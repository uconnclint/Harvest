// Core mechanics that the season sim doesn't exercise directly: pathfinding,
// the market side-effects, the wither/dry night path, regrow, and the Glowbox
// discount rule (B14). Run: node test/core.test.mjs

class EE { constructor() { this.m = {}; } on(e, f) { (this.m[e] = this.m[e] || []).push(f); } off() {} emit(e, ...a) { (this.m[e] || []).slice().forEach(f => f(...a)); } once() {} }
globalThis.Phaser = { Events: { EventEmitter: EE } };
globalThis.localStorage = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } };

const { findPath } = await import('../src/systems/astar.js');
const { gs } = await import('../src/systems/GameState.js');
const { C } = await import('../src/config.js');

let fails = 0;
const ok = (c, m) => { if (c) console.log('ok:', m); else { fails++; console.error('FAIL:', m); } };

// ---- astar ----
const grid = [
  [true, true, true],
  [true, false, true],
  [true, true, true],
];
ok(findPath(grid, 0, 0, 0, 0).length === 0, 'astar: same tile is an empty path');
const p = findPath(grid, 0, 0, 2, 2);
ok(Array.isArray(p) && p.length > 0 && p[p.length - 1].x === 2 && p[p.length - 1].y === 2, 'astar: routes around a wall to the goal');
const walled = [[true, false, true]];
ok(findPath(walled, 0, 0, 2, 0) === null, 'astar: no route returns null');
ok(findPath(grid, 0, 0, 5, 5) === null, 'astar: off-grid target returns null');

// ---- market side-effects ----
gs.newGame(0, 'Core Farm', 'i_acorn');
gs.state.coins = 100; gs.state.seeds = {}; gs.state.produce = {};
ok(gs.buySeed('carrot') && gs.state.coins === 92 && gs.state.seeds.carrot === 1, 'market: buySeed deducts price, adds seed');
gs.state.coins = 3;
ok(gs.buySeed('pumpkin') === false && gs.state.coins === 3, 'market: buySeed refused when too poor');
gs.state.coins = 0; gs.state.produce = { carrot: 3 };
const gain = gs.sellProduce('carrot', 2);
ok(gain === 30 && gs.state.coins === 30 && gs.state.produce.carrot === 1, 'market: sellProduce pays per item');
ok(gs.buyUpgrade('scale') === false, 'market: cannot buy upgrade when broke');
gs.state.coins = 80; gs.buyUpgrade('scale');
ok(gs.has('scale') && gs.sellPriceOf('carrot') === 17, 'market: Shiny Scale adds +2 per sale');
gs.state.coins = 60; const maxBefore = gs.state.acornMax; gs.buyUpgrade('satchel');
ok(gs.state.acornMax === maxBefore + C.SATCHEL_BONUS, 'market: Satchel raises acorn max');
gs.state.coins = 40; gs.buyUpgrade('field');
ok(gs.state.plots.every(pl => !pl.locked), 'market: Field Plus unlocks every plot');
gs.state.coins = 30; gs.buyUpgrade('paint');
ok(gs.has('paint') && gs.state.flags.fenceColor != null, 'market: Paint Set sets a fence color');

// ---- wither / dry night path ----
gs.newGame(0, 'Wither Farm', 'i_acorn');
const plot = gs.state.plots[0];
plot.locked = false; plot.s = 'grow'; plot.crop = 'carrot'; plot.prog = 0; plot.wet = false; plot.dry = 0;
gs.sleep();
ok(plot.s === 'grow' && plot.dry === 1, 'night: an unwatered crop droops (dry=1), still alive');
gs.sleep();
ok(plot.s === 'wither', 'night: a second dry night withers the crop');
ok(gs.clearPlot(0) && gs.state.plots[0].s === 'tilled', 'a withered plot clears back to tilled');

// ---- regrow harvest branch (berry) ----
gs.newGame(0, 'Berry Farm', 'i_acorn');
const b = gs.state.plots[0];
b.locked = false; b.s = 'grow'; b.crop = 'berry'; b.prog = 0; b.wet = false;
for (let i = 0; i < 3; i++) { b.wet = true; gs.sleep(); }
ok(b.s === 'ready', 'berry ready after 3 watered nights');
gs.harvestPlot(0);
ok(b.s === 'grow' && b.picked === true && b.prog === 1, 'regrow: berry harvest returns to grow, picked, prog reset to growDays-regrowDays');

// ---- B14: Glowbox discount needs a real watered crop ----
gs.newGame(0, 'Glow Farm', 'i_acorn');
gs.state.flags.choresFirstStar = true;
gs.state.plots.forEach(pl => { pl.s = 'grass'; });
ok(gs.glowboxCost() === C.COSTS.glowbox, 'B14: no growing crops -> full Glowbox price (not the discount)');
const g = gs.state.plots[0]; g.locked = false; g.s = 'grow'; g.crop = 'bean'; g.wet = true;
ok(gs.glowboxCost() === C.COSTS.glowboxStar, 'B14: a watered growing crop -> the chores-done discount');
g.wet = false;
ok(gs.glowboxCost() === C.COSTS.glowbox, 'B14: an unwatered crop -> back to full price');

if (fails) { console.error(`\n${fails} core check(s) failed`); process.exit(1); }
console.log('ALL CORE CHECKS PASS');
