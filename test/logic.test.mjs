// Full-season quest simulation, no browser: every questline start to finish,
// Sly's refusal AND fooled paths, hearts, gifts, migration.
// Run: node test/logic.test.mjs

class EE {
  constructor() { this.m = {}; }
  on(e, f) { (this.m[e] = this.m[e] || []).push(f); }
  off(e, f) { if (this.m[e]) this.m[e] = this.m[e].filter(x => x !== f); }
  emit(e, ...a) { (this.m[e] || []).slice().forEach(f => f(...a)); }
  once(e, f) { const g = (...a) => { this.off(e, g); f(...a); }; this.on(e, g); }
}
globalThis.Phaser = { Events: { EventEmitter: EE } };
globalThis.localStorage = {
  store: {},
  getItem(k) { return this.store[k] ?? null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
};

const { gs, bus } = await import('../src/systems/GameState.js');
const { QE } = await import('../src/systems/QuestEngine.js');
const { Save } = await import('../src/systems/SaveManager.js');
const { POSTS, visiblePosts } = await import('../src/data/posts.js');

let fails = 0;
const ok = (cond, msg) => { if (cond) console.log('ok:', msg); else { fails++; console.error('FAIL:', msg); } };
const post = (id) => POSTS.find(p => p.id === id);

// "Play" a dialogue model the way DialogueUI would.
function playTalk(npcId, pickText) {
  const m = QE.getTalk(npcId);
  if (!m) return null;
  if (m.choice && pickText !== undefined) {
    const idx = m.choice.options.findIndex(o => o.text === pickText);
    if (m.choice.options[idx].ok === false) return m; // UI would retry; caller asserts
    m.onDone && m.onDone(idx);
  } else if (!m.choice) {
    m.onDone && m.onDone(null);
  }
  return m;
}
function sleepDays(n) {
  for (let i = 0; i < n; i++) { gs.sleep(); QE.onWake(); }
}

QE.init();
gs.newGame(0, 'Test Farm', 'i_acorn');
QE.onWake();

// --- day 1: no quests yet ---
ok(Object.keys(gs.state.quests).length === 0, 'day 1: no quests unlocked');

// --- day 2: q2 (password) + q4 (kindness) unlock ---
sleepDays(1);
ok(gs.state.quests.q2 && gs.state.quests.q4, 'day 2: q2 + q4 unlocked');
ok(QE.currentHint().hint.includes('Marigold'), 'tracker points to Marigold');

let m = playTalk('marigold');
ok(gs.state.flags.chestPlaced, 'chest placed after Marigold talk');
gs.setChestCode(['i_star', 'i_moon', 'i_frog']);
ok(gs.state.quests.q2.done, 'q2 done after password set');
ok(gs.state.coins === 15 + 5, 'q2 reward coins');
ok(gs.state.hearts.marigold === 1, 'q2 reward heart');
ok(gs.state.journal.length === 1, 'q2 journal written');

// --- kind replies: q4 ---
gs.replyToPost('b_d1', post('b_d1').replies[0], 'marigold');
gs.replyToPost('b_d2_pip', post('b_d2_pip').replies[0], 'pip');
gs.replyToPost('b_d2_bram', post('b_d2_bram').replies[0], 'bram');
ok(gs.state.quests.q4.done, 'q4 done after 3 kind replies');
ok(gs.state.hearts.pip === 1 && gs.state.hearts.bram === 1, 'kind replies grew hearts');

// --- day 3: q1 pumpkin promise ---
sleepDays(1);
ok(gs.state.quests.q1, 'day 3: q1 unlocked');
playTalk('pip');
ok((gs.state.seeds.pumpkin || 0) === 2, 'pip gave 2 pumpkin seeds');
// plant 2 pumpkins (plots 1,3 prepped)
gs.state.plots[1].s = 'tilled'; gs.state.plots[3].s = 'tilled';
gs.plantPlot(1, 'pumpkin'); gs.plantPlot(3, 'pumpkin');
ok(gs.state.quests.q1.step === 2, 'q1 advanced to streak step');
// water 2 days running
gs.waterPlot(1); gs.waterPlot(3); sleepDays(1);
gs.waterPlot(1); gs.waterPlot(3); sleepDays(1);
ok(gs.state.quests.q1.step === 3, 'streak of 2 complete');
m = playTalk('pip', 'Before chores!');
ok(!gs.state.quests.q1.done, 'wrong pick does not finish q1');
playTalk('pip', 'After chores!');
ok(gs.state.quests.q1.done, 'q1 done');
ok(gs.state.flags.choresFirstStar, 'chores-first star earned');
gs.state.plots.filter(p => p.s === 'grow').forEach(p => { p.wet = true; });
ok(gs.glowboxCost() === 2, 'glowbox discounted when watered');

// --- q3 footprint: reply on day-4 prompt ---
ok(gs.state.quests.q3, 'q3 unlocked (day 4+)');
gs.replyToPost('b_d4', post('b_d4').replies[0], 'marigold');   // "I love pumpkins!"
ok(gs.state.flags.footprintCrop === 'pumpkin', 'footprint crop remembered');
ok(gs.state.quests.q3.step === 1, 'q3 waiting for day 12');

// --- day 6: Sly's first trick (refuse) ---
sleepDays(1);   // day 6
ok(gs.state.flags.pendingSly === 'sly1', 'sly ambush pending on day 6');
let ev = QE.takeSlyEvent();
const coinsBefore = gs.state.coins;
ev.onDone(0);   // "NO way!"
ok(gs.state.coins === coinsBefore + 10, 'refusal pays 10 coins');
ok(gs.state.flags.slyRefusals === 1, 'refusal counted');

// --- day 10: Sly's second trick (fooled + recovery) ---
sleepDays(4);   // day 10
ok(gs.state.flags.pendingSly === 'sly2', 'sly2 pending');
ev = QE.takeSlyEvent();
const before = gs.state.coins;
ev.onDone(2);   // "Tell Sly the password"
ok(gs.state.coins === before - 5 && gs.state.flags.slyFooled, 'sly took 5 coins');
playTalk('marigold');
ok(gs.state.coins === before && !gs.state.flags.slyFooled, 'marigold recovered the coins');

// --- day 12: pip remembers the post ---
sleepDays(2);   // day 12
playTalk('pip');
ok((gs.state.seeds.pumpkin || 0) > 0, 'pip saved a pumpkin seed (footprint!)');
ok(gs.state.quests.q3.step === 2, 'q3 on final step');

// --- day 13: see Bram's sting post ---
sleepDays(1);
bus.emit('action', { type: 'visit', target: 'board' });
ok(gs.state.quests.q3.done, 'q3 done');

// --- day 14: upstander arc ---
sleepDays(1);
ok(gs.state.quests.q5, 'q5 unlocked day 14');
bus.emit('action', { type: 'visit', target: 'board' });
ok(gs.state.quests.q5.step === 1, 'q5 saw the mean post');
playTalk('pip', 'You work hard. I am your friend.');
playTalk('marigold');
const bramHeartsBefore = gs.state.hearts.bram;
gs.replyToPost('b_d14', post('b_d14').replies[0], 'bram', post('b_d14'));
ok(gs.state.hearts.bram === bramHeartsBefore, 'B13: kind reply to a mean post grants its author no heart');
ok(gs.state.quests.q5.step === 2, 'multi-step complete in any order');
playTalk('bram');
ok(gs.state.quests.q5.done, 'q5 done');
sleepDays(2);   // day 16
const vis = visiblePosts(gs.state).map(p => p.id);
ok(vis.includes('b_d16_bram') && vis.includes('b_d16_pip'), 'apology posts appeared');

// --- day 18: the rumor ---
sleepDays(2);   // day 18
ok(gs.state.quests.q6, 'q6 unlocked');
bus.emit('action', { type: 'visit', target: 'board' });
playTalk('tessa', 'Where did you hear it?');
playTalk('bram');
playTalk('sly');
bus.emit('action', { type: 'visit', target: 'glowbox' });
playTalk('marigold');
ok(gs.state.quests.q6.step === 6, 'q6 waiting for tomorrow');
m = QE.getTalk('marigold');
ok(m.lines[0].text.includes('tomorrow') || m.lines[0].text.includes('night'), 'marigold says wait');
sleepDays(1);   // day 19
playTalk('marigold');
bus.emit('action', { type: 'visit', target: 'board' });
ok(gs.state.quests.q6.done, 'q6 done');
ok(gs.state.flags.truthPosted, 'truth posted');
ok(gs.state.flags.badges.includes('Fact-Finder'), 'badge earned');
ok(visiblePosts(gs.state).some(p => p.id === 'b_truth'), 'truth post on the board');

// --- day 20: the scam ---
sleepDays(1);   // day 20
ok(gs.state.quests.q7, 'q7 unlocked');
m = playTalk('tessa', 'Tell her my name and address');
ok(!gs.state.quests.q7.done && gs.state.quests.q7.step === 0, 'bad pick retried, not accepted');
playTalk('tessa', 'No way! That is private.');
playTalk('marigold');
ok(gs.state.quests.q7.done, 'q7 done');
ok((gs.state.seeds.sunflower || 0) === 1, 'golden sunflower seed earned');

// --- days 16 + 22: remaining Sly tricks -> finale ---
ev = QE.takeSlyEvent();   // sly3 (due since day 16)
ok(ev && gs.state.flags.pendingSly === 'sly3', 'sly3 was waiting');
ev.onDone(1);
sleepDays(2);   // day 22
ev = QE.takeSlyEvent();
ok(gs.state.flags.pendingSly === 'sly4' || ev, 'sly4 pending');
const c4 = gs.state.coins;
ev.onDone(0);
// This run was fooled once at sly2, so no clean-record finale: standard +10.
ok(gs.state.coins === c4 + 10, 'fooled-once run gets standard reward');
ok(gs.state.flags.slyRefusals === 3, 'three refusals (one slip)');

// Clean-record finale: 3 refusals going into the 4th trick pays the bonus.
gs.state.flags.slyDone = ['sly1', 'sly2', 'sly3'];
gs.state.flags.slyRefusals = 3;
gs.state.flags.pendingSly = 'sly4';
ev = QE.takeSlyEvent();
const c5 = gs.state.coins;
ev.onDone(0);
ok(gs.state.coins === c5 + 20, 'clean record finale pays 20');
ok(ev.choice.options[0].reply.some(l => l.text.includes('smart')), 'finale lines used');

// --- hearts gifts ---
gs.state.hearts.pip = 2;
playTalk('pip');
ok(Object.values(gs.state.flags.giftsGiven.pip || {}).length >= 1, 'heart gift granted at 2');

// --- festival on day 28 ---
gs.state.day = 28;
const sum = gs.sleep();
ok(sum.festival === true, 'festival fires on day 28');
const sum2 = gs.sleep();
ok(!sum2.festival, 'festival only once');

// --- save + v1 migration ---
Save.flush(gs.state, 0);
const loaded = Save.read(0);
ok(loaded.quests.q6.done && loaded.chestCode.length === 3, 'full state round-trips');
const v1 = { v: 1, farmName: 'Old Farm', day: 9, coins: 77, acorns: 4, acornMax: 12, seeds: { bean: 1 }, produce: {}, plots: loaded.plots, upgrades: ['satchel'], journal: [{ day: 2, text: 'old note' }], today: { earned: 0, watered: 0, harvested: 0 } };
localStorage.setItem('hh.slot.2', JSON.stringify(v1));
gs.continueGame(2);
ok(gs.state.v === 2 && gs.state.coins === 77 && gs.state.farmName === 'Old Farm', 'v1 save migrates');
ok(gs.state.hearts && gs.state.quests && gs.state.flags, 'migrated save has v2 fields');

// --- B3: two live quests both want Marigold -> the most-recently-reached wins ---
gs.newGame(0, 'Collide Farm', 'i_acorn');
gs.state.day = 19;
gs.state.quests = {
  // q5 mid multi-step: the "tell Marigold" task is still pending, reached day 14
  q5: { step: 1, done: false, n: 0, tasks: [true, false, true], enteredDay: 14 },
  // q6 reached its own "tell Marigold what you found" step more recently, day 19
  q6: { step: 5, done: false, n: 0, tasks: [], enteredDay: 19 },
};
let mc = QE.getTalk('marigold');
ok(mc && mc.lines.some(l => /rumor came from|fact-finder/i.test(l.text)),
  'B3: shared NPC resolves to the most-recently-reached quest (q6)');
ok(mc && !mc.lines.some(l => /mean about Pip/i.test(l.text)),
  'B3: does NOT show the older quest (q5) dialogue');
// reverse: when q6 is not yet at a Marigold step, q5 keeps Marigold
gs.state.quests.q6 = { step: 1, done: false, n: 0, tasks: [], enteredDay: 19 };
mc = QE.getTalk('marigold');
ok(mc && mc.lines.some(l => /mean about Pip/i.test(l.text)),
  'B3: q5 Marigold task still resolves when q6 needs someone else');

if (fails) { console.error(`\n${fails} logic check(s) failed`); process.exit(1); }
console.log('ALL LOGIC CHECKS PASS');
