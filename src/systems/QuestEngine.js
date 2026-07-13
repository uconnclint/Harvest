// Drives the seven questlines: unlocks by day, advances steps on player actions,
// resolves what every NPC says right now, schedules Sly's tricks, grants rewards.

import { QUESTS, SLY_EVENTS, SLY_OPTIONS, SLY_OK, SLY_BAD, SLY_RECOVERY } from '../data/quests.js';
import { NPCS, HEART_GIFTS, HEART_GIFT_SEED } from '../data/npcs.js';
import { CROPS } from '../data/crops.js';
import { gs, bus } from './GameState.js';

function norm(lines, npcId, state) {
  return (lines || []).map(l => {
    let sp = npcId, text = l;
    if (Array.isArray(l)) { sp = l[0]; text = l[1]; }
    if (text.includes('{crop}')) {
      text = text.replace('{crop}', state.flags.footprintCrop || 'pumpkin');
    }
    return { sp, text };
  });
}

export const QE = {
  init() {
    bus.on('action', (a) => { if (gs.state) this.onAction(a); });
  },

  // ---------- unlocks & scheduling ----------

  onWake() {
    const s = gs.state;
    QUESTS.forEach(q => {
      if (!s.quests[q.id] && s.day >= q.unlock.day) {
        s.quests[q.id] = { step: 0, done: false, n: 0, tasks: [], enteredDay: s.day };
        if (q.intro) gs.toast(q.intro, 'i_quest');
      }
    });
    // Sly strikes on wake — but only once a password exists to ask for.
    s.flags.pendingSly = null;
    if (s.chestCode && !s.flags.slyFooled) {
      const ev = SLY_EVENTS.find(e => e.day <= s.day && !s.flags.slyDone.includes(e.id));
      if (ev) s.flags.pendingSly = ev.id;
    }
    bus.emit('hint');
    gs.touch();
  },

  q(id) { return gs.state.quests[id]; },
  questDef(id) { return QUESTS.find(q => q.id === id); },

  activeStep(qdef) {
    const qs = this.q(qdef.id);
    if (!qs || qs.done) return null;
    return qdef.steps[qs.step] || null;
  },

  advance(qid) {
    const qdef = this.questDef(qid);
    const qs = this.q(qid);
    qs.step++;
    qs.n = 0;
    qs.tasks = [];
    qs.enteredDay = gs.state.day;
    if (qs.step >= qdef.steps.length) this.complete(qdef);
    bus.emit('hint');
    gs.touch();
  },

  complete(qdef) {
    const qs = this.q(qdef.id);
    qs.done = true;
    const r = qdef.reward || {};
    if (r.coins) { gs.state.coins += r.coins; bus.emit('coins'); }
    if (r.seeds) {
      Object.entries(r.seeds).forEach(([c, n]) => {
        gs.state.seeds[c] = (gs.state.seeds[c] || 0) + n;
      });
      bus.emit('inv');
    }
    if (r.hearts) Object.entries(r.hearts).forEach(([npc, n]) => gs.addHearts(npc, n));
    if (r.perk) gs.state.flags[r.perk] = true;
    if (r.badge) {
      gs.state.flags.badges.push(r.badge);
      gs.toast(`You earned the ${r.badge} badge!`, 'i_badge');
    }
    if (r.journal) gs.writeJournal(r.journal, 'i_star');
    bus.emit('questDone', { id: qdef.id, title: qdef.title, coins: r.coins || 0 });
    if (r.toast) gs.toast(r.toast, 'i_star');
    if (r.coda) gs.toast(r.coda, 'i_owl');   // a one-line bridge from the fiction to the kid's real world
  },

  applyOnDone(effects) {
    if (!effects) return;
    if (effects.seeds) {
      Object.entries(effects.seeds).forEach(([c, n]) => {
        gs.state.seeds[c] = (gs.state.seeds[c] || 0) + n;
        gs.toast(`Got ${n} ${CROPS[c].seedName}!`, CROPS[c].icon);
      });
      bus.emit('inv');
    }
    if (effects.spawnChest) {
      gs.state.flags.chestPlaced = true;
      bus.emit('chestPlaced');
      gs.toast('Your new chest is inside your farmhouse!', 'i_chest');
    }
    if (effects.footprintSeed) {
      const crop = gs.state.flags.footprintCrop || 'pumpkin';
      gs.state.seeds[crop] = (gs.state.seeds[crop] || 0) + 1;
      gs.toast(`Pip saved you a ${CROPS[crop].seedName.toLowerCase()}!`, CROPS[crop].icon);
      bus.emit('inv');
    }
    if (effects.truthPost) {
      gs.state.flags.truthPosted = true;
      gs.toast('You posted the true answer!', 'i_check');
    }
    if (effects.toast) gs.toast(effects.toast, 'i_star');
    gs.touch();
  },

  // ---------- action notifications ----------

  onAction(a) {
    QUESTS.forEach(qdef => {
      const step = this.activeStep(qdef);
      if (!step) return;
      const qs = this.q(qdef.id);

      if (a.type === 'plant' && step.t === 'plant' && a.crop === step.crop) {
        qs.n++;
        if (qs.n >= step.n) this.advance(qdef.id);
      }
      if (a.type === 'slept' && step.t === 'streak') {
        qs.n = a.allWatered ? qs.n + 1 : 0;
        if (qs.n >= step.days) this.advance(qdef.id);
        gs.touch();
      }
      if (a.type === 'boardReply') {
        if (step.t === 'board' && step.post === a.postId) this.advance(qdef.id);
        if (step.t === 'kindReplies' && a.tone === 'kind' && a.author !== 'you') {
          const kt = gs.state.flags.kindTo;
          if (!kt.includes(a.author)) kt.push(a.author);
          if (kt.length >= step.n) this.advance(qdef.id);
          gs.touch();
        }
        if (step.t === 'multi') this.markTask(qdef, t => t.t === 'board' && t.post === a.postId);
      }
      if (a.type === 'visit' && step.t === 'visit' && step.target === a.target) {
        if (!step.minDay || gs.state.day >= step.minDay) {
          this.applyOnDone(step.onDone);
          this.advance(qdef.id);
        }
      }
      if (a.type === 'chestSet' && step.t === 'chest') this.advance(qdef.id);
      if (a.type === 'glowbox' && step.t === 'glowbox') this.advance(qdef.id);
    });
    bus.emit('hint');
  },

  markTask(qdef, match) {
    const qs = this.q(qdef.id);
    const step = qdef.steps[qs.step];
    step.tasks.forEach((t, i) => {
      if (!qs.tasks[i] && match(t, i)) qs.tasks[i] = true;
    });
    if (step.tasks.every((t, i) => qs.tasks[i])) this.advance(qdef.id);
    gs.touch();
  },

  // ---------- quest tracker ----------

  currentHint() {
    for (const qdef of QUESTS) {
      const step = this.activeStep(qdef);
      if (step) return { title: qdef.title, hint: step.hint };
    }
    return null;
  },

  heartsTotal() {
    return Object.values(gs.state.hearts).reduce((a, b) => a + b, 0);
  },

  // ---------- dialogue resolution ----------

  getTalk(npcId) {
    const s = gs.state;
    const npc = NPCS[npcId];

    // 1 · Marigold fixes the Sly mess first.
    if (npcId === 'marigold' && s.flags.slyFooled) {
      return this.model(npc, norm(SLY_RECOVERY.lines, npcId, s), null, () => {
        s.coins += s.flags.slyStole;
        s.flags.slyStole = 0;
        s.flags.slyFooled = false;
        bus.emit('coins');
        gs.writeJournal(SLY_RECOVERY.journal, 'i_check');
        gs.toast('Coins are back! Now pick a new password.', 'i_coin');
        bus.emit('openChestBuilder');
        gs.touch();
      });
    }

    // 1b · "I forgot my password" — asking the trusted adult, modeled.
    if (npcId === 'marigold' && s.flags.forgotChest) {
      return this.model(npc, norm([
        ['you', 'I forgot my chest password...'],
        'That happens! Good thing you asked a helper.',
        'Let us make a fresh one together.',
      ], 'marigold', s), null, () => {
        s.flags.forgotChest = false;
        bus.emit('openChestBuilder');
        gs.touch();
      });
    }

    // 2 · Quest dialogue. If two live quests both need this NPC (e.g. q5 + q6
    // both want Marigold once both are active), pick the one whose current step
    // was reached most recently — the quest the kid is actually "on" — instead
    // of plain array order. An actionable step always outranks a waiting one (B3).
    let best = null, bestScore = -1;
    for (const qdef of QUESTS) {
      const step = this.activeStep(qdef);
      if (!step) continue;
      const qs = this.q(qdef.id);
      let cand = null;

      if (step.t === 'talk' && step.npc === npcId) {
        const waiting = (step.minDay && s.day < step.minDay) ||
          (step.nextDay && s.day <= qs.enteredDay);
        if (waiting) {
          if (step.waitLines) cand = { kind: 'wait', qdef, step, waiting: true };
        } else {
          cand = { kind: 'talk', qdef, step };
        }
      } else if (step.t === 'multi') {
        const idx = step.tasks.findIndex((t, i) => t.t === 'talk' && t.npc === npcId && !qs.tasks[i]);
        if (idx >= 0) cand = { kind: 'multi', qdef, step, idx };
      }

      if (cand) {
        const score = (cand.waiting ? 0 : 1e6) + qs.enteredDay * 100 + qdef.unlock.day;
        if (score > bestScore) { bestScore = score; best = cand; }
      }
    }
    if (best) {
      if (best.kind === 'wait') return this.model(npc, norm(best.step.waitLines, npcId, s), null, null);
      if (best.kind === 'talk') return this.questTalk(best.qdef, best.step, npc);
      const task = best.step.tasks[best.idx];
      return this.questTalk(best.qdef, task, npc, () => this.markTask(best.qdef, (t, i) => i === best.idx));
    }

    // 3 · Friendship gifts at 2, 4 and 5 hearts.
    if (npc.hearts) {
      const given = s.flags.giftsGiven[npcId] || [];
      for (const m of [2, 4, 5]) {
        if (s.hearts[npcId] >= m && !given.includes(m)) {
          const gift = HEART_GIFTS[m];
          return this.model(npc, norm(gift.lines, npcId, s), null, () => {
            (s.flags.giftsGiven[npcId] = s.flags.giftsGiven[npcId] || []).push(m);
            if (gift.type === 'seed') {
              const crop = HEART_GIFT_SEED[npcId];
              s.seeds[crop] = (s.seeds[crop] || 0) + 1;
              gs.toast(`${npc.name} gave you ${CROPS[crop].seedName}!`, CROPS[crop].icon);
              bus.emit('inv');
            } else if (gift.type === 'coins') {
              s.coins += gift.amount;
              gs.toast(`${npc.name} gave you ${gift.amount} coins!`, 'i_coin');
              bus.emit('coins');
            } else {
              gs.writeJournal(`${npc.name} wrote me a friend letter. Five hearts!`, 'i_heart');
              gs.toast('A friend letter! It is in your journal.', 'i_heart');
            }
            gs.touch();
          });
        }
      }
    }

    // 4 · Everyday small talk, rotating by day.
    const lines = npc.talk[s.day % npc.talk.length];
    return this.model(npc, norm(lines, npcId, s), null, null);
  },

  questTalk(qdef, step, npc, customDone) {
    const s = gs.state;
    const finish = () => {
      this.applyOnDone(step.onDone);
      if (customDone) customDone();
      else this.advance(qdef.id);
    };
    let choice = null;
    if (step.choice) {
      choice = {
        prompt: step.choice.prompt,
        options: step.choice.options.map(o => ({
          text: o.text, ok: o.ok, think: o.think,
          reply: norm(o.reply, step.npc, s),
        })),
      };
    }
    return this.model(npc, norm(step.lines, step.npc, s), choice, finish);
  },

  model(npc, lines, choice, onDone) {
    return {
      npcId: npc.id, name: npc.name, frame: npc.frame,
      hearts: npc.hearts ? gs.state.hearts[npc.id] : null,
      lines, choice, onDone,
    };
  },

  // ---------- Sly's tricks ----------

  takeSlyEvent() {
    const s = gs.state;
    const id = s.flags.pendingSly;
    if (!id) return null;
    const ev = SLY_EVENTS.find(e => e.id === id);
    const finaleDue = ev.finale && s.flags.slyRefusals >= 3;
    const okPack = finaleDue ? ev.finale : SLY_OK;
    const options = SLY_OPTIONS.map(o => ({
      text: o.text, ok: true, think: o.think,
      reply: norm(o.ok ? okPack.lines : SLY_BAD.lines, 'sly', s),
      good: o.ok,
    }));
    const npc = NPCS.sly;
    return {
      npcId: 'sly', name: npc.name, frame: npc.frame, hearts: null,
      lines: norm(ev.lines, 'sly', s),
      choice: { prompt: 'What do you do?', options },
      onDone: (idx) => {
        s.flags.slyDone.push(ev.id);
        s.flags.pendingSly = null;
        if (options[idx].good) {
          s.flags.slyRefusals++;
          s.coins += okPack.coins;
          bus.emit('coins');
          gs.writeJournal(okPack.journal || SLY_OK.journal, 'i_check');
          gs.toast(`+${okPack.coins} coins for staying safe!`, 'i_coin');
        } else {
          s.flags.slyStole = Math.min(5, s.coins);
          s.coins -= s.flags.slyStole;
          s.flags.slyFooled = true;
          bus.emit('coins');
          gs.writeJournal(SLY_BAD.journal, 'i_bang');
          gs.toast('Sly took 5 coins! Tell Mayor Marigold!', 'i_bang');
        }
        bus.emit('hint');
        gs.touch();
      },
    };
  },
};
