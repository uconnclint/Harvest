// The farm: 12 plots, the farmhouse door (into the cozy interior), the market
// stand, the painted garden fence, and the road to town.

import {
  C, FARM_MAP, SPAWN, DOOR_TILE, STAND_TILES, SIGN_TILE,
  FARM_GATE, TOWN_SPAWN_FROM_FARM, FARM_SPAWN_FROM_HOUSE, FENCE_TILES,
} from '../config.js';
import { CROPS } from '../data/crops.js';
import { gs, bus } from '../systems/GameState.js';
import { Sfx } from '../systems/Sfx.js';
import { WorldScene } from './WorldScene.js';

const T = C.TILE;

export class FarmScene extends WorldScene {
  constructor() { super('Farm'); }

  create() {
    this.wentHomeAt = null;
    this.pointer = null; this.pointTween = null;   // B9: scene instances are reused; drop stale destroyed refs
    this.map = FARM_MAP;
    this.walkChars = '.r';
    this.buildWorld(SPAWN);
    this.buildObjects();
    this.buildPlots();
    this.buildFences();

    this.addGate(FARM_GATE, 'Town', TOWN_SPAWN_FROM_FARM);

    this.onPlots = (idx) => {
      if (idx === null || idx === undefined) this.refreshAllPlots();
      else this.refreshPlot(idx);
    };
    this.onPaint = () => this.paintFences();
    this.onGoHome = () => this.goHome();
    this.onPoint = (tile) => this.showPointer(tile);
    bus.on('plots', this.onPlots);
    bus.on('paint', this.onPaint);
    bus.on('goHome', this.onGoHome);
    bus.on('tutorialPoint', this.onPoint);

    // ambient life: chimney smoke, pond sparkles, butterflies
    this.time.addEvent({ delay: 1700, loop: true, callback: () => this.puffSmoke() });
    [[136, 470, 0], [186, 502, 700], [208, 462, 1400]].forEach(([x, y, delay]) => {
      const s = this.add.image(x, y, 'atlas', 'sparkle').setDepth(5).setAlpha(0).setScale(0.7);
      this.tweens.add({
        targets: s, alpha: 0.85, scale: 1, duration: 700, delay,
        yoyo: true, repeat: -1, repeatDelay: 1500, ease: 'Sine.easeInOut',
      });
    });
    this.addButterfly(120, 160, 860, 580);
    this.addButterfly(120, 160, 860, 580);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    else bus.emit('enteredFarm');
  }

  puffSmoke() {
    const p = this.add.image(196, 86, 'atlas', 'puff').setDepth(300).setAlpha(0.75).setScale(0.5);
    this.tweens.add({
      targets: p, y: 54, x: 206, scale: 1.1, alpha: 0, duration: 2200,
      ease: 'Sine.easeOut', onComplete: () => p.destroy(),
    });
  }

  onShutdown() {
    bus.off('plots', this.onPlots);
    bus.off('paint', this.onPaint);
    bus.off('goHome', this.onGoHome);
    bus.off('tutorialPoint', this.onPoint);
  }

  // bouncing arrow the tutorial uses to show what to tap next
  showPointer(tile) {
    if (this.pointTween) { this.pointTween.stop(); this.pointTween = null; }
    if (!tile) { if (this.pointer) this.pointer.setVisible(false); return; }
    const x = tile.tx * T + T / 2, y = tile.ty * T - 14;
    if (!this.pointer) this.pointer = this.add.image(x, y, 'atlas', 'i_point').setDepth(4500).setScale(1.4);
    this.pointer.setPosition(x, y).setVisible(true);
    this.pointTween = this.tweens.add({
      targets: this.pointer, y: y - 9, duration: 460, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  buildObjects() {
    this.add.image(3 * T, 6 * T, 'atlas', 'house').setOrigin(0, 1).setDepth(6 * T);
    this.add.image(3 * T, 14 * T, 'atlas', 'pond').setOrigin(0, 0).setDepth(1);
    this.add.image(STAND_TILES[0].tx * T, (STAND_TILES[0].ty + 1) * T, 'atlas', 'stand')
      .setOrigin(0, 1).setDepth((STAND_TILES[0].ty + 1) * T);
    this.add.image(SIGN_TILE.tx * T + T / 2, (SIGN_TILE.ty + 1) * T, 'atlas', 'sign')
      .setOrigin(0.5, 1).setDepth((SIGN_TILE.ty + 1) * T);

    const houseTiles = [];
    for (let y = 2; y <= 5; y++) for (let x = 3; x <= 6; x++) houseTiles.push({ tx: x, ty: y });
    this.addTarget({ type: 'door', clickTiles: houseTiles, reach: [DOOR_TILE] });
    const standClicks = [];
    STAND_TILES.forEach(t => { standClicks.push(t, { tx: t.tx, ty: t.ty - 1 }); });
    this.addTarget({ type: 'stand', clickTiles: standClicks, reach: STAND_TILES });
    this.addTarget({ type: 'sign', clickTiles: [SIGN_TILE], reach: [SIGN_TILE] });

    STAND_TILES.forEach(t => { this.walk[t.ty][t.tx] = false; });
    this.walk[SIGN_TILE.ty][SIGN_TILE.tx] = false;
  }

  buildFences() {
    this.fenceSprites = [];
    const painted = gs.state.flags.fenceColor != null;
    FENCE_TILES.forEach(t => {
      this.walk[t.ty][t.tx] = false;
      const f = this.add.image(t.tx * T + T / 2, (t.ty + 1) * T, 'atlas', painted ? 'fencepost_paint' : 'fencepost')
        .setOrigin(0.5, 1).setDepth((t.ty + 1) * T - 2);
      if (painted) f.setTint(gs.state.flags.fenceColor);
      this.fenceSprites.push(f);
    });
  }

  paintFences() {
    const color = gs.state.flags.fenceColor;
    this.fenceSprites.forEach(f => {
      f.setFrame('fencepost_paint');
      if (color != null) f.setTint(color); else f.clearTint();
    });
  }

  // Gentle nudge home when the day's energy runs out (GDD §2).
  goHome() {
    if (this.transitioning || gs.modal) return;
    if (this.wentHomeAt === gs.state.day) return;
    this.wentHomeAt = gs.state.day;
    this.setPathTo(FARM_SPAWN_FROM_HOUSE.tx, FARM_SPAWN_FROM_HOUSE.ty);
  }

  buildPlots() {
    this.plotSprites = [];
    this.plotByTile = new Map();
    gs.state.plots.forEach(p => {
      const soil = this.add.image(p.tx * T, p.ty * T, 'atlas', 'plot_rough').setOrigin(0).setDepth(2);
      const crop = this.add.image(p.tx * T + T / 2, p.ty * T + T - 2, 'atlas', 'bean_0')
        .setOrigin(0.5, 1).setDepth(p.ty * T + 16).setVisible(false);
      const icon = this.add.image(p.tx * T + 24, p.ty * T + 6, 'atlas', 'i_star')
        .setDepth(1500).setScale(0.8).setVisible(false);
      this.plotSprites.push({ soil, crop, icon, bob: null });
      this.plotByTile.set(`${p.tx},${p.ty}`, p.i);
      this.refreshPlot(p.i);
    });
  }

  refreshAllPlots() { gs.state.plots.forEach(p => this.refreshPlot(p.i)); }

  refreshPlot(i) {
    const p = gs.state.plots[i];
    const v = this.plotSprites[i];
    let soilFrame = 'plot_rough';
    if (p.locked) soilFrame = 'bramble';
    else if (p.s === 'weed') soilFrame = 'plot_weed';
    else if (p.s === 'rock') soilFrame = 'plot_rock';
    else if (p.s === 'grass') soilFrame = 'plot_rough';
    else soilFrame = p.wet ? 'soil_wet' : 'soil_dry';
    v.soil.setFrame(soilFrame);

    if (v.sway) { v.sway.stop(); v.sway = null; }
    v.crop.setAngle(0);
    if (!p.locked && (p.s === 'grow' || p.s === 'ready' || p.s === 'wither')) {
      let f = 'crop_wither';
      if (p.s !== 'wither') {
        const def = CROPS[p.crop];
        let stage = Math.min(2, Math.floor((p.prog / def.growDays) * 3));
        if (p.picked) stage = Math.max(stage, 2);
        f = p.s === 'ready' ? `${p.crop}_3` : `${p.crop}_${stage}`;
        // a gentle breeze — crops pivot at their base (origin 0.5, 1)
        v.sway = this.tweens.add({
          targets: v.crop, angle: { from: -2.5, to: 2.5 },
          duration: 1100 + (i * 137) % 700,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
      v.crop.setFrame(f).setVisible(true);
    } else {
      v.crop.setVisible(false);
    }

    if (v.bob) { v.bob.stop(); v.bob = null; }
    v.icon.setVisible(false).setY(p.ty * T + 6);
    if (!p.locked) {
      if (p.s === 'ready') {
        v.icon.setFrame('i_star').setVisible(true);
        v.bob = this.tweens.add({ targets: v.icon, y: p.ty * T + 2, duration: 480, yoyo: true, repeat: -1 });
      } else if (p.s === 'grow' && p.dry >= C.DROOP_AFTER) {
        v.icon.setFrame('i_bang').setVisible(true);
      } else if (p.s === 'grow' && p.wet) {
        v.icon.setFrame('i_drop').setVisible(true);
      }
    }
  }

  resolveTarget(tx, ty) {
    const pi = this.plotByTile.get(`${tx},${ty}`);
    if (pi !== undefined) return { type: 'plot', i: pi, reach: [{ tx, ty }] };
    return super.resolveTarget(tx, ty);
  }

  doAction(target) {
    if (target.type === 'door') { this.travel({ to: 'Interior', which: 'farmhouse' }); return; }
    if (target.type === 'stand') { bus.emit('openShop'); return; }
    if (target.type === 'sign') { gs.toast('This road leads to town!', 'i_leaf'); return; }
    if (target.type === 'plot') this.plotAction(target.i);
  }

  plotAction(i) {
    const p = gs.state.plots[i];
    const cx = p.tx * T + T / 2, cy = p.ty * T;
    if (p.locked) { gs.toast('Too brambly! Buy Field Plus at the stand.', 'i_basket'); return; }

    if (p.s === 'weed' || p.s === 'rock' || p.s === 'wither') {
      if (gs.clearPlot(i)) { Sfx.dig(); this.bounceSoil(i); this.float(cx, cy, '-1', 'i_acorn'); }
    } else if (p.s === 'grass') {
      if (gs.hoePlot(i)) { Sfx.dig(); this.bounceSoil(i); this.float(cx, cy, '-1', 'i_acorn'); }
    } else if (p.s === 'tilled') {
      const types = gs.seedTypesOwned();
      if (types.length === 0) gs.toast('No seeds! Buy some at the stand.', 'i_basket');
      else if (types.length === 1) this.plantHere(i, types[0]);
      else bus.emit('openPicker', i);
    } else if (p.s === 'grow') {
      if (p.wet) gs.toast('All watered! Come back tomorrow.', 'i_drop');
      else if (gs.waterPlot(i)) {
        Sfx.splash();
        this.float(cx, cy, '-1', 'i_acorn');
        const d = this.add.image(cx, cy + 10, 'atlas', 'i_drop').setDepth(4000).setScale(0.3);
        this.tweens.add({ targets: d, scale: 1.1, alpha: 0, duration: 420, onComplete: () => d.destroy() });
      }
    } else if (p.s === 'ready') {
      const crop = p.crop;
      if (gs.harvestPlot(i)) {
        Sfx.pop();
        this.float(cx, cy, '+1', `${crop}_3`);
      }
    }
  }

  plantHere(i, cropId) {
    if (gs.plantPlot(i, cropId)) {
      Sfx.plant();
      const v = this.plotSprites[i];
      v.crop.setScale(0.2);
      this.tweens.add({ targets: v.crop, scale: 1, duration: 260, ease: 'Back.easeOut' });
    }
  }

  bounceSoil(i) {
    const p = gs.state.plots[i];
    const v = this.plotSprites[i];
    v.soil.setY(p.ty * T - 4);
    this.tweens.add({ targets: v.soil, y: p.ty * T, duration: 170, ease: 'Bounce.easeOut' });
  }
}
