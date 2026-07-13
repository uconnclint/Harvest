// Cozy single-room interiors (farmhouse, arcade), data-driven from INTERIORS.
// The camera centers on the small room — no scrolling. Furniture blocks its
// footprint and becomes a tappable target; decor is purely visual.

import { C, INTERIORS } from '../config.js';
import { gs, bus } from '../systems/GameState.js';
import { WorldScene } from './WorldScene.js';

const T = C.TILE;

export class InteriorScene extends WorldScene {
  constructor() { super('Interior'); }

  init(data) {
    this.which = (data && data.which) || 'farmhouse';
    this.cfg = INTERIORS[this.which];
    this.spawnTile = (data && data.spawn) || this.cfg.spawn;
  }

  create() {
    this.map = this.cfg.map;
    this.walkChars = '.D';
    this.buildWorld(this.cfg.spawn);

    // small room: center it, no follow, warm/dim backdrop in the margins
    this.cameras.main.stopFollow();
    this.cameras.main.removeBounds();
    this.cameras.main.centerOn(this.worldW / 2, this.worldH / 2);
    this.cameras.main.setBackgroundColor(this.cfg.bg);

    this.buildRoom();
    this.cfg.doors.forEach(tile => this.addGate(tile, this.cfg.exit.to, this.cfg.exit.spawn));

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
  }

  tileFrame(ch) {
    return ch === '#' ? this.cfg.wallFrame : this.cfg.floorFrame;   // '.' and 'D'
  }

  block(tiles) {
    tiles.forEach(t => { if (this.walk[t.ty] && t.tx >= 0 && t.tx < this.gridW) this.walk[t.ty][t.tx] = false; });
  }

  buildRoom() {
    (this.cfg.decor || []).forEach(d => {
      const img = this.add.image(d.x, d.y, 'atlas', d.frame)
        .setOrigin(...(d.origin || [0.5, 1])).setDepth(d.depth != null ? d.depth : d.y);
      if (d.scale) img.setScale(d.scale);
      if (d.block) this.block(d.tiles || []);
    });
    (this.cfg.objects || []).forEach(o => {
      if (o.needsFlag && !gs.state.flags[o.needsFlag]) return;
      const img = this.add.image(o.x, o.y, 'atlas', o.frame).setOrigin(0.5, 1).setDepth(o.y);
      if (o.scale) img.setScale(o.scale);
      this.block(o.tiles || []);
      this.addTarget({ type: o.type, clickTiles: o.tiles, reach: o.reach });
      if (o.type === 'machine') {
        // a soft glow on the playable cabinet so kids know it's the one
        this.tweens.add({ targets: img, alpha: { from: 0.86, to: 1 }, duration: 900, yoyo: true, repeat: -1 });
      }
    });
  }

  doAction(target) {
    if (target.type === 'bed') { bus.emit('askSleep'); return; }
    if (target.type === 'chest') { bus.emit('openChest'); return; }
    if (target.type === 'journal') { bus.emit('openJournal'); return; }
    if (target.type === 'machine') {
      bus.emit('action', { type: 'visit', target: 'glowbox' });
      bus.emit('askGlowbox');
      return;
    }
    if (target.type === 'cabinet') { gs.toast('Out of order! Try the big one.', 'i_bang'); return; }
  }
}
