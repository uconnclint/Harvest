// Single source of truth for the run. Scenes call mutators; UI listens on `bus`.
// Save schema v2 (GDD §4 + town/quest/board state). v1 saves migrate forward.

import { C, PLOT_DEFS } from '../config.js';
import { CROPS } from '../data/crops.js';
import { UPGRADES } from '../data/upgrades.js';
import { Save } from './SaveManager.js';

export const bus = new Phaser.Events.EventEmitter();

function freshPlots() {
  return PLOT_DEFS.map((p, i) => ({
    i, tx: p.tx, ty: p.ty, locked: p.locked,
    s: p.start,            // weed | rock | grass | tilled | grow | ready | wither
    crop: null, prog: 0, wet: false, dry: 0, picked: false,
  }));
}

function freshState() {
  return {
    v: 2,
    farmName: 'My Farm', icon: 'i_acorn',
    day: 1, season: 'spring',
    coins: C.START_COINS,
    acorns: C.ACORN_BASE, acornMax: C.ACORN_BASE,
    seeds: { ...C.START_SEEDS }, produce: {},
    plots: freshPlots(),
    upgrades: [],
    hearts: { pip: 0, marigold: 0, bram: 0, tessa: 0 },
    quests: {},            // qid -> { step, done, n, tasks: [], enteredDay }
    board: {},             // postId -> { tone, text, day }
    journal: [],           // { day, text, icon }
    chestCode: null,       // array of icon frame names, or null
    stats: { earned: 0, harvested: 0, glowboxBest: 0, glowboxPlays: 0 },
    flags: {
      chestPlaced: false, choresFirstStar: false,
      slyRefusals: 0, slyFooled: false, slyStole: 0, slyDone: [], pendingSly: null,
      footprintCrop: null, kindTo: [], giftsGiven: {},
      truthPosted: false, badges: [], festivalShown: false,
      fenceColor: null,
    },
    today: { earned: 0, watered: 0, harvested: 0 },
  };
}

function migrate(data) {
  if (data.v === 2) return data;
  // v1 -> v2: keep the farm, add the town-era fields.
  const s = freshState();
  ['farmName', 'icon', 'day', 'season', 'coins', 'acorns', 'acornMax',
    'seeds', 'produce', 'plots', 'upgrades', 'journal', 'today'].forEach(k => {
    if (data[k] !== undefined) s[k] = data[k];
  });
  // B12: give every migrated plot the full v2 shape (older saves miss `picked`).
  if (Array.isArray(s.plots)) {
    s.plots = s.plots.map((p, i) => ({
      i: p.i ?? i, tx: p.tx, ty: p.ty, locked: !!p.locked, s: p.s || 'grass',
      crop: p.crop ?? null, prog: p.prog || 0, wet: !!p.wet, dry: p.dry || 0, picked: !!p.picked,
    }));
  }
  s.v = 2;
  return s;
}

export const gs = {
  state: null,
  slot: 0,
  modal: false,            // an overlay is open; world input pauses
  activeWorld: 'Farm',

  newGame(slot, farmName, icon) {
    this.slot = slot;
    this.state = freshState();
    if (farmName) this.state.farmName = farmName;
    if (icon) this.state.icon = icon;
    Save.write(this.state, slot);
  },
  continueGame(slot) {
    this.slot = slot;
    const data = Save.read(slot);
    this.state = data ? migrate(data) : freshState();
    Save.write(this.state, slot);
  },
  touch() { Save.schedule(this.state, this.slot); },
  save() { Save.write(this.state, this.slot); },

  // ---- queries ----
  walkSpeed() { return C.WALK_SPEED * (this.has('boots') ? C.BOOTS_MULT : 1); },
  has(id) { return this.state.upgrades.includes(id); },
  sellPriceOf(cropId) { return CROPS[cropId].sellPrice + (this.has('scale') ? C.SCALE_BONUS : 0); },
  seedTypesOwned() { return Object.keys(this.state.seeds).filter(k => this.state.seeds[k] > 0); },
  allGrowingWatered() {
    const grow = this.state.plots.filter(p => p.s === 'grow');
    return grow.length === 0 || grow.every(p => p.wet);
  },
  glowboxCost() {
    // B14: the discount is a reward for watering real crops — not free when nothing is growing.
    const grow = this.state.plots.filter(p => p.s === 'grow');
    const choresDone = this.state.flags.choresFirstStar && grow.length > 0 && grow.every(p => p.wet);
    return choresDone ? C.COSTS.glowboxStar : C.COSTS.glowbox;
  },

  toast(text, icon) { bus.emit('toast', { text, icon: icon || 'i_owl' }); },

  // ---- acorns ----
  trySpend(n) {
    if (n <= 0) return true;
    if (this.state.acorns < n) {
      this.toast('All out of pep! Head home to bed.', 'i_zzz');
      bus.emit('denied');
      if (this.activeWorld === 'Farm') bus.emit('goHome');
      return false;
    }
    this.state.acorns -= n;
    bus.emit('acorns');
    this.touch();
    return true;
  },

  // ---- plot actions ----
  clearPlot(i) {
    const p = this.state.plots[i];
    if (p.s === 'weed' || p.s === 'rock') {
      if (!this.trySpend(C.COSTS.clear)) return false;
      p.s = 'grass';
    } else if (p.s === 'wither') {
      if (!this.trySpend(C.COSTS.clear)) return false;
      p.s = 'tilled'; p.crop = null; p.prog = 0; p.dry = 0; p.picked = false;
    } else return false;
    bus.emit('plots', i); bus.emit('action', { type: 'clear', i }); this.touch(); return true;
  },

  hoePlot(i) {
    const p = this.state.plots[i];
    if (p.s !== 'grass') return false;
    if (!this.trySpend(C.COSTS.hoe)) return false;
    p.s = 'tilled';
    bus.emit('plots', i); bus.emit('action', { type: 'hoe', i }); this.touch(); return true;
  },

  plantPlot(i, cropId) {
    const p = this.state.plots[i];
    if (p.s !== 'tilled' || (this.state.seeds[cropId] || 0) < 1) return false;
    if (!this.trySpend(C.COSTS.plant)) return false;
    this.state.seeds[cropId]--;
    p.s = 'grow'; p.crop = cropId; p.prog = 0; p.wet = false; p.dry = 0; p.picked = false;
    bus.emit('plots', i); bus.emit('inv');
    bus.emit('action', { type: 'plant', crop: cropId });
    this.touch(); return true;
  },

  waterPlot(i) {
    const p = this.state.plots[i];
    if (p.s !== 'grow' || p.wet) return false;
    if (!this.trySpend(C.COSTS.water)) return false;
    p.wet = true; p.dry = 0;
    this.state.today.watered++;
    bus.emit('plots', i); bus.emit('action', { type: 'water', i }); this.touch(); return true;
  },

  harvestPlot(i) {
    const p = this.state.plots[i];
    if (p.s !== 'ready') return false;
    const def = CROPS[p.crop];
    this.state.produce[p.crop] = (this.state.produce[p.crop] || 0) + 1;
    this.state.today.harvested++;
    this.state.stats.harvested++;
    if (def.regrowDays) {
      p.s = 'grow'; p.prog = def.growDays - def.regrowDays; p.wet = false; p.picked = true;
    } else {
      p.s = 'tilled'; p.crop = null; p.prog = 0;
    }
    bus.emit('plots', i); bus.emit('inv'); this.touch(); return true;
  },

  // ---- market ----
  buySeed(cropId) {
    const def = CROPS[cropId];
    if (this.state.coins < def.seedPrice) { this.toast('Not enough coins yet!', 'i_coin'); return false; }
    this.state.coins -= def.seedPrice;
    this.state.seeds[cropId] = (this.state.seeds[cropId] || 0) + 1;
    bus.emit('coins'); bus.emit('inv'); this.touch(); return true;
  },

  sellProduce(cropId, n) {
    const have = this.state.produce[cropId] || 0;
    n = Math.min(n, have);
    if (n < 1) return 0;
    const gain = n * this.sellPriceOf(cropId);
    this.state.produce[cropId] = have - n;
    this.state.coins += gain;
    this.state.today.earned += gain;
    this.state.stats.earned += gain;
    bus.emit('coins'); bus.emit('inv'); this.touch();
    return gain;
  },

  buyUpgrade(id) {
    if (this.has(id)) return false;
    const up = UPGRADES.find(u => u.id === id);
    if (this.state.coins < up.price) { this.toast('Not enough coins yet!', 'i_coin'); return false; }
    this.state.coins -= up.price;
    this.state.upgrades.push(id);
    if (id === 'satchel') {
      this.state.acornMax += C.SATCHEL_BONUS;
      this.state.acorns += C.SATCHEL_BONUS;
      bus.emit('acorns');
    }
    if (id === 'field') {
      this.state.plots.forEach(p => { p.locked = false; });
      bus.emit('plots', null);
    }
    if (id === 'paint') {
      if (this.state.flags.fenceColor == null) this.state.flags.fenceColor = 0xd9534f;
      bus.emit('paint');
    }
    bus.emit('coins'); this.touch(); return true;
  },

  // ---- hearts / journal / board ----
  addHearts(npc, n) {
    if (this.state.hearts[npc] === undefined) return;
    const before = this.state.hearts[npc];
    this.state.hearts[npc] = Math.min(5, before + n);
    if (this.state.hearts[npc] > before) bus.emit('hearts', { npc, hearts: this.state.hearts[npc] });
    this.touch();
  },

  writeJournal(text, icon) {
    this.state.journal.push({ day: this.state.day, text, icon: icon || 'i_leaf' });
    bus.emit('journal');
    this.touch();
  },

  replyToPost(postId, reply, author, post) {
    if (this.state.board[postId]) return false;
    this.state.board[postId] = { tone: reply.tone, text: reply.text, day: this.state.day };
    if (reply.crop && reply.tone !== 'unkind') this.state.flags.footprintCrop = reply.crop;   // B5: only a positive pick becomes your footprint
    const mean = !!(post && post.mean);
    if (reply.tone === 'kind' && author !== 'you' && !mean) this.addHearts(author, 1);          // B13: a mean post earns its author no heart
    bus.emit('action', { type: 'boardReply', postId, tone: reply.tone, author });
    this.touch();
    return true;
  },

  setChestCode(code) {
    const first = !this.state.chestCode;
    this.state.chestCode = code;
    bus.emit('action', { type: 'chestSet', first });
    this.touch();
  },

  payGlowbox() {
    const cost = this.glowboxCost();
    if (!this.trySpend(cost)) return false;
    this.state.stats.glowboxPlays++;
    this.touch();
    return true;
  },

  glowboxScore(score) {
    if (score > this.state.stats.glowboxBest) this.state.stats.glowboxBest = score;
    bus.emit('action', { type: 'glowbox', score });
    this.touch();
  },

  // ---- the night pass ----
  sleep() {
    const s = this.state;
    const allWatered = this.allGrowingWatered() && s.plots.some(p => p.s === 'grow');
    const summary = {
      day: s.day,
      earned: s.today.earned, watered: s.today.watered,
      harvested: s.today.harvested, withered: 0,
      festival: s.day === C.SEASON_DAYS && !s.flags.festivalShown,
    };
    s.plots.forEach(p => {
      if (p.s === 'grow') {
        if (p.wet) {
          p.prog++; p.dry = 0;
          if (p.prog >= CROPS[p.crop].growDays) p.s = 'ready';
        } else {
          p.dry++;
          if (p.dry >= C.WITHER_AFTER) { p.s = 'wither'; summary.withered++; }
        }
      }
      p.wet = false;       // ready crops wait safely; they never rot
    });
    s.day++;
    s.acorns = s.acornMax;
    s.today = { earned: 0, watered: 0, harvested: 0 };
    if (summary.festival) s.flags.festivalShown = true;
    bus.emit('action', { type: 'slept', allWatered });
    bus.emit('plots', null); bus.emit('acorns'); bus.emit('coins'); bus.emit('day');
    this.save();
    return summary;
  },

  morningNotes() {
    const s = this.state;
    const notes = [];
    if (s.plots.some(p => p.s === 'wither')) {
      notes.push({ text: 'A crop dried up! Clear and replant.', icon: 'i_bang' });
    } else if (s.plots.some(p => p.s === 'grow' && p.dry >= C.DROOP_AFTER)) {
      notes.push({ text: 'Your crops are thirsty! Water them first?', icon: 'i_drop' });
    }
    if (s.plots.some(p => p.s === 'ready')) {
      notes.push({ text: 'Something is ready to pick!', icon: 'i_star' });
    }
    return notes;
  },
};
