// Content guards: 2nd-grade line lengths, valid references, sane day ranges.
// Run: node test/data.test.mjs (from the project root)

class EE { on() {} off() {} emit() {} once() {} }
globalThis.Phaser = { Events: { EventEmitter: EE } };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { NPCS, HEART_GIFTS, HEART_GIFT_SEED } = await import('../src/data/npcs.js');
const { POSTS } = await import('../src/data/posts.js');
const { QUESTS, SLY_EVENTS, SLY_OPTIONS, SLY_OK, SLY_BAD, SLY_RECOVERY } = await import('../src/data/quests.js');
const { CROPS } = await import('../src/data/crops.js');
const { CODE_TILES, FARM_ICONS, TOWN_MAP, FARM_MAP, INTERIORS, FENCE_TILES, FENCE_COLORS } = await import('../src/config.js');
const { UPGRADES } = await import('../src/data/upgrades.js');
const { STEPS: TUTORIAL } = await import('../src/ui/TutorialUI.js');

let fails = 0;
const fail = (msg) => { fails++; console.error('FAIL:', msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };

const words = (s) => s.replace('{crop}', 'pumpkin').split(/\s+/).filter(Boolean).length;
const checkLine = (line, where, max = 12) => {
  const text = Array.isArray(line) ? line[1] : line;
  ok(typeof text === 'string' && text.length > 0, `${where}: empty line`);
  ok(words(text) <= max, `${where}: "${text}" is ${words(text)} words (max ${max})`);
  if (Array.isArray(line)) {
    ok(line[0] === 'hoot' || line[0] === 'you' || NPCS[line[0]], `${where}: unknown speaker ${line[0]}`);
  }
};

// --- NPC small talk ---
Object.values(NPCS).forEach(npc => {
  npc.talk.forEach((set, i) => set.forEach(l => checkLine(l, `npc ${npc.id} talk[${i}]`)));
  ok(npc.frame.startsWith('npc_'), `npc ${npc.id} frame`);
});
Object.values(HEART_GIFTS).forEach(g => g.lines.forEach(l => checkLine(l, 'heart gift')));
Object.values(HEART_GIFT_SEED).forEach(c => ok(CROPS[c], `heart gift seed crop ${c}`));

// --- posts ---
const postIds = new Set();
POSTS.forEach(p => {
  ok(!postIds.has(p.id), `duplicate post id ${p.id}`);
  postIds.add(p.id);
  ok(p.day >= 1 && p.day <= 28, `post ${p.id} day ${p.day}`);
  ok(p.author === 'you' || NPCS[p.author], `post ${p.id} author ${p.author}`);
  checkLine(p.text, `post ${p.id}`, 13);
  (p.replies || []).forEach(r => {
    ok(['kind', 'plain', 'unkind'].includes(r.tone), `post ${p.id} tone ${r.tone}`);
    checkLine(r.text, `post ${p.id} reply`);
    if (r.think) checkLine(r.think, `post ${p.id} think`);
    if (r.crop) ok(CROPS[r.crop], `post ${p.id} crop ${r.crop}`);
  });
  if (p.requires && p.requires.replied) ok(POSTS.some(x => x.id === p.requires.replied), `post ${p.id} requires.replied`);
  if (p.requires && p.requires.questDone) ok(QUESTS.some(q => q.id === p.requires.questDone), `post ${p.id} requires.questDone`);
});
ok(POSTS.some(p => p.mean), 'has the upstander mean post');
ok(POSTS.some(p => p.prompt), 'has the day-4 prompt post');

// --- quests ---
const STEP_TYPES = ['talk', 'choice', 'plant', 'streak', 'board', 'visit', 'chest', 'glowbox', 'multi', 'kindReplies'];
const checkStep = (st, where) => {
  ok(STEP_TYPES.includes(st.t), `${where}: bad step type ${st.t}`);
  if (st.t === 'talk') {
    ok(NPCS[st.npc], `${where}: unknown npc ${st.npc}`);
    (st.lines || []).forEach(l => checkLine(l, where));
    (st.waitLines || []).forEach(l => checkLine(l, where + ' wait'));
    if (st.choice) {
      checkLine(st.choice.prompt, where + ' prompt');
      ok(st.choice.options.length >= 1 && st.choice.options.length <= 3, `${where}: choice count`);
      ok(st.choice.options.some(o => o.ok), `${where}: needs an ok option`);
      st.choice.options.forEach(o => {
        checkLine(o.text, where + ' option');
        if (o.think) checkLine(o.think, where + ' think');
        (o.reply || []).forEach(l => checkLine(l, where + ' reply'));
      });
    }
  }
  if (st.t === 'board') ok(POSTS.some(p => p.id === st.post), `${where}: unknown post ${st.post}`);
  if (st.t === 'plant') ok(CROPS[st.crop], `${where}: unknown crop`);
  if (st.t === 'visit') ok(['chest', 'glowbox', 'board', 'well'].includes(st.target), `${where}: target`);
  if (st.hint) checkLine(st.hint, where + ' hint', 9);
};
const qIds = new Set();
QUESTS.forEach(q => {
  ok(!qIds.has(q.id), `duplicate quest ${q.id}`);
  qIds.add(q.id);
  ok(q.unlock.day >= 1 && q.unlock.day <= 28, `quest ${q.id} unlock day`);
  if (q.intro) checkLine(q.intro, `quest ${q.id} intro`, 10);
  q.steps.forEach((st, i) => {
    checkStep(st, `quest ${q.id} step ${i}`);
    if (st.t === 'multi') st.tasks.forEach((t, j) => checkStep(t, `quest ${q.id} step ${i} task ${j}`));
  });
  if (q.reward && q.reward.journal) checkLine(q.reward.journal, `quest ${q.id} journal`, 16);
  if (q.reward && q.reward.coda) checkLine(q.reward.coda, `quest ${q.id} real-life coda`, 12);
  if (q.reward && q.reward.seeds) Object.keys(q.reward.seeds).forEach(c => ok(CROPS[c], `quest ${q.id} reward seed`));
});
ok(QUESTS.length === 7, `expected 7 questlines, got ${QUESTS.length}`);

// --- Sly events ---
SLY_EVENTS.forEach(e => {
  ok(e.day >= 2 && e.day <= 28, `sly ${e.id} day`);
  e.lines.forEach(l => checkLine(l, `sly ${e.id}`));
  if (e.finale) e.finale.lines.forEach(l => checkLine(l, `sly ${e.id} finale`));
});
SLY_OPTIONS.forEach(o => checkLine(o.text, 'sly option'));
[SLY_OK, SLY_BAD].forEach(p => p.lines.forEach(l => checkLine(l, 'sly outcome')));
SLY_RECOVERY.lines.forEach(l => checkLine(l, 'sly recovery'));
ok(SLY_EVENTS.length === 4, 'four sly events');

// --- maps ---
ok(TOWN_MAP.every(r => r.length === 36), 'town map rows are 36 wide');
ok(TOWN_MAP.length === 20, 'town map is 20 tall');
ok(FARM_MAP.every(r => r.length === 30), 'farm map rows are 30 wide');
ok(TOWN_MAP[10][0] === 'r', 'town west gate open');
ok(FARM_MAP[10][29] === 'r', 'farm east gate open');
Object.values(NPCS).forEach(npc => {
  const [tx, ty] = npc.spot;
  const ch = TOWN_MAP[ty][tx];
  ok('.rc'.includes(ch), `npc ${npc.id} spot (${tx},${ty}) is '${ch}' — must be open ground`);
});
ok(CODE_TILES.length === 9, 'nine password tiles');
ok(FARM_ICONS.length === 8, 'eight farm icons');

// --- interiors ---
const WALK = '.D';
['farmhouse', 'arcade'].forEach(key => {
  const it = INTERIORS[key];
  ok(it, `interior ${key} exists`);
  const W = it.map[0].length;
  ok(it.map.every(r => r.length === W), `interior ${key} rows uniform width`);
  // spawn + doors land on walkable tiles
  ok(WALK.includes(it.map[it.spawn.ty][it.spawn.tx]), `interior ${key} spawn walkable`);
  it.doors.forEach(d => ok(it.map[d.ty][d.tx] === 'D', `interior ${key} door (${d.tx},${d.ty}) is 'D'`));
  ok(it.exit && it.exit.to && it.exit.spawn, `interior ${key} has an exit`);
  // every object reach tile is open floor, and tiles/reach are inside the room
  (it.objects || []).forEach(o => {
    ok(o.type && o.frame && o.tiles && o.reach, `interior ${key} object ${o.type} well-formed`);
    o.reach.forEach(t => ok(WALK.includes(it.map[t.ty] && it.map[t.ty][t.tx]), `interior ${key} ${o.type} reach (${t.tx},${t.ty}) walkable`));
  });
});
ok(INTERIORS.farmhouse.objects.some(o => o.type === 'bed'), 'farmhouse has a bed');
ok(INTERIORS.farmhouse.objects.some(o => o.type === 'chest' && o.needsFlag === 'chestPlaced'), 'farmhouse chest gated on chestPlaced');
ok(INTERIORS.farmhouse.objects.some(o => o.type === 'journal'), 'farmhouse has the journal table');
ok(INTERIORS.arcade.objects.some(o => o.type === 'machine'), 'arcade has the Glowbox machine');

// --- paint set + fences ---
ok(UPGRADES.some(u => u.id === 'paint'), 'Paint Set upgrade exists');
ok(UPGRADES.length === 5, 'five upgrades total (260c economy)');
ok(FENCE_TILES.length > 0 && FENCE_COLORS.length >= 4, 'fence tiles + a palette of colors');
ok(FENCE_TILES.every(t => FARM_MAP[t.ty] && '.'.includes(FARM_MAP[t.ty][t.tx])), 'fence posts sit on open farm ground');

// --- tutorial ---
const ACTIONS = ['walk', 'clear', 'hoe', 'plant', 'water'];
TUTORIAL.forEach((s, i) => {
  ok(s.tap || ACTIONS.includes(s.wait), `tutorial step ${i} is tap or a known action`);
  ok(Array.isArray(s.lines) && s.lines.length >= 1, `tutorial step ${i} has lines`);
  s.lines.forEach(l => checkLine(l, `tutorial step ${i}`));
  if (!s.tap) ok(s.lines.length === 1, `tutorial action step ${i} is single-line (no tap-to-advance conflict)`);
});
ok(TUTORIAL.some(s => s.wait === 'clear') && TUTORIAL.some(s => s.wait === 'water'), 'tutorial coaches the crop cycle');

if (fails) { console.error(`\n${fails} data check(s) failed`); process.exit(1); }
console.log('ALL DATA CHECKS PASS');
