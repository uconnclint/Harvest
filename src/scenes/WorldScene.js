// Shared base for walkable map scenes (Farm, Town): ground rendering, the
// walk grid, tap-to-move with queued actions, keyboard movement, the selector
// ring, floating feedback text, and gate tiles that lead to other scenes.

import { C } from '../config.js';
import { gs, bus } from '../systems/GameState.js';
import { Speech } from '../systems/Speech.js';
import { findPath } from '../systems/astar.js';

const T = C.TILE;
const FONT = '"Trebuchet MS", Verdana, sans-serif';

export class WorldScene extends Phaser.Scene {

  init(data) {
    this.spawnTile = (data && data.spawn) || null;
  }

  // Subclasses call this from create() after setting this.map / this.walkChars.
  buildWorld(defaultSpawn) {
    this.gridW = this.map[0].length;
    this.gridH = this.map.length;
    this.worldW = this.gridW * T;
    this.worldH = this.gridH * T;
    this.targets = [];
    this.gates = [];

    this.walk = this.map.map(row => [...row].map(ch => this.walkChars.includes(ch)));

    const rt = this.add.renderTexture(0, 0, this.worldW, this.worldH).setOrigin(0).setDepth(0);
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        rt.drawFrame('atlas', this.tileFrame(this.map[y][x], x, y), x * T, y * T);
      }
    }
    this.groundRT = rt;   // freed explicitly on shutdown so its GPU framebuffer doesn't linger

    this.trees = [];
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        if (this.map[y][x] === 't') {
          this.walk[y][x] = false;
          this.trees.push({ tx: x, ty: y });
          this.add.image(x * T + T / 2, (y + 1) * T, 'atlas', 'tree')
            .setOrigin(0.5, 1).setDepth((y + 1) * T);
        }
      }
    }

    const spawn = this.spawnTile || defaultSpawn;
    const px = spawn.tx * T + T / 2, py = spawn.ty * T + 24;
    this.shadow = this.add.image(px, py - 2, 'atlas', 'shadow').setDepth(4);
    this.player = this.add.image(px, py, 'atlas', 'player_down_0').setOrigin(0.5, 1).setDepth(py);

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.fadeIn(400, 42, 32, 24);

    this.ring = this.add.image(0, 0, 'atlas', 'ring').setDepth(3).setVisible(false).setAlpha(0.9);
    this.tweens.add({ targets: this.ring, scale: { from: 1, to: 1.1 }, duration: 520, yoyo: true, repeat: -1 });

    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,ENTER,E');
    this.input.on('pointerup', this.onTap, this);

    this.path = [];
    this.queued = null;
    this.facing = 'down';
    this.animTime = 0;
    this.animStep = 0;
    this.transitioning = false;
    this._moved = false;        // one-shot 'walk' signal for the tutorial

    gs.activeWorld = this.scene.key;
    gs.save();

    this.events.once('shutdown', () => {
      this.input.off('pointerup', this.onTap, this);
      if (this.groundRT) { this.groundRT.destroy(); this.groundRT = null; }
      this.onShutdown && this.onShutdown();
    });
  }

  // Default grass/path/tree-wall tiles; subclasses extend.
  tileFrame(ch, x, y) {
    if (ch === 'T') return 'treewall';
    if (ch === 'r') return 'path';
    if (ch === 'c') return 'cobble';
    const h = (x * 7 + y * 13) % 29;
    if (h === 3) return 'grass_fl0';
    if (h === 11) return 'grass_fl1';
    return (x + y) % 2 ? 'grass1' : 'grass0';
  }

  addTarget(t) { this.targets.push(t); }
  addGate(tile, to, spawn) { this.gates.push({ tile, to, spawn }); }

  // ---------- input ----------

  onTap(pointer) {
    if (gs.modal || this.transitioning) return;
    const ui = this.scene.get('UI');
    if (ui && ui.isPointerOver && ui.isPointerOver(pointer)) return;
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / T), ty = Math.floor(world.y / T);
    const target = this.resolveTarget(tx, ty);
    if (target) {
      if (this.withinReach(target)) this.doAction(target);
      else this.walkToward(target);
    } else if (this.isWalkable(tx, ty)) {
      this.queued = null;
      if (!this.setPathTo(tx, ty)) gs.toast('I can’t get there!', 'i_bang');   // B11: no route -> say so
    }
  }

  resolveTarget(tx, ty) {
    for (const t of this.targets) {
      if (t.clickTiles.some(c => c.tx === tx && c.ty === ty)) return t;
    }
    return null;
  }

  playerTile() {
    return { tx: Math.floor(this.player.x / T), ty: Math.floor((this.player.y - 4) / T) };
  }

  withinReach(target) {
    const pt = this.playerTile();
    return target.reach.some(r => Math.max(Math.abs(r.tx - pt.tx), Math.abs(r.ty - pt.ty)) <= 1);
  }

  isWalkable(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < this.gridW && ty < this.gridH && this.walk[ty][tx];
  }

  setPathTo(tx, ty) {
    const pt = this.playerTile();
    const path = findPath(this.walk, pt.tx, pt.ty, tx, ty);
    if (path) this.path = path;
    return !!path;
  }

  walkToward(target) {
    const pt = this.playerTile();
    const cands = [];
    const seen = new Set();
    target.reach.forEach(r => {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = r.tx + dx, ny = r.ty + dy;
          const k = `${nx},${ny}`;
          if (!seen.has(k) && this.isWalkable(nx, ny)) { seen.add(k); cands.push({ tx: nx, ty: ny }); }
        }
      }
    });
    cands.sort((a, b) =>
      (Math.abs(a.tx - pt.tx) + Math.abs(a.ty - pt.ty)) - (Math.abs(b.tx - pt.tx) + Math.abs(b.ty - pt.ty)));
    for (let i = 0; i < Math.min(cands.length, 12); i++) {
      if (this.setPathTo(cands[i].tx, cands[i].ty)) { this.queued = target; return; }
    }
    gs.toast('I can’t get there!', 'i_bang');   // B11: target exists but no reachable spot
  }

  doAction(target) { /* subclasses */ }

  // ---------- ambient life ----------

  addButterfly(x0, y0, x1, y1) {
    const b = this.add.image(
      x0 + Math.random() * (x1 - x0),
      y0 + Math.random() * (y1 - y0),
      'atlas', 'butterfly_0',
    ).setDepth(2500);
    this.time.addEvent({
      delay: 110, loop: true,
      callback: () => b.setFrame(b.frame.name === 'butterfly_0' ? 'butterfly_1' : 'butterfly_0'),
    });
    const wander = () => {
      if (!b.active) return;
      const nx = x0 + Math.random() * (x1 - x0);
      const ny = y0 + Math.random() * (y1 - y0);
      b.setFlipX(nx < b.x);
      this.tweens.add({
        targets: b, x: nx, y: ny,
        duration: Math.hypot(nx - b.x, ny - b.y) * 14 + 600,
        ease: 'Sine.easeInOut', onComplete: wander,
      });
    };
    wander();
    return b;
  }

  // ---------- shared feedback ----------

  float(x, y, str, iconFrame) {
    const icon = this.add.image(x - 12, y, 'atlas', iconFrame).setDepth(4000).setScale(0.85);
    const t = this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#3a2a1a', strokeThickness: 4, resolution: 2,
    }).setOrigin(0, 0.5).setDepth(4000);
    this.tweens.add({
      targets: [icon, t], y: y - 30, alpha: 0, duration: 850, ease: 'Sine.easeOut',
      onComplete: () => { icon.destroy(); t.destroy(); },
    });
  }

  // ---------- movement ----------

  update(time, dt) {
    if (!gs.state || this.transitioning) return;
    if (gs.modal) {
      this.path = []; this.queued = null;   // B7: don't resume a stale walk/action after the overlay closes
      this.setIdleFrame(); this.ring.setVisible(false);
      return;
    }

    const k = this.keys;
    let dx = 0, dy = 0;
    if (k.LEFT.isDown || k.A.isDown) dx = -1;
    else if (k.RIGHT.isDown || k.D.isDown) dx = 1;
    if (k.UP.isDown || k.W.isDown) dy = -1;
    else if (k.DOWN.isDown || k.S.isDown) dy = 1;

    const speed = gs.walkSpeed() * (dt / 1000);
    let moving = false;

    if (dx || dy) {
      this.path = [];
      this.queued = null;
      const len = Math.hypot(dx, dy);
      this.tryMove((dx / len) * speed, (dy / len) * speed);
      this.setFacing(dx, dy);
      moving = true;
    } else if (this.path.length) {
      // hand off to the next waypoint in the same frame — no per-tile stutter
      let ddx = 0, ddy = 0, dist = 0;
      while (this.path.length) {
        const wp = this.path[0];
        ddx = wp.x * T + T / 2 - this.player.x;
        ddy = wp.y * T + 24 - this.player.y;
        dist = Math.hypot(ddx, ddy);
        if (dist >= 3) break;
        this.path.shift();
      }
      if (this.path.length) {
        const step = Math.min(speed, dist);
        this.player.x += (ddx / dist) * step;
        this.player.y += (ddy / dist) * step;
        this.setFacing(ddx, ddy);
        moving = true;
      }
      if (!this.path.length && this.queued) {
        const q = this.queued;
        this.queued = null;
        if (this.withinReach(q)) this.doAction(q);
      }
      if (!this.path.length && this.onPathDone) {
        const cb = this.onPathDone;
        this.onPathDone = null;
        cb();
      }
    }

    if (moving) {
      if (!this._moved) { this._moved = true; bus.emit('action', { type: 'walk' }); }
      this.animTime += dt;
      if (this.animTime > 130) { this.animTime = 0; this.animStep = (this.animStep + 1) % 4; }
      this.setWalkFrame();
    } else {
      this.animStep = 0;
      this.setIdleFrame();
    }

    this.player.setDepth(this.player.y);
    this.shadow.setPosition(this.player.x, this.player.y - 2);

    // gates
    const pt = this.playerTile();
    for (const g of this.gates) {
      if (pt.tx === g.tile.tx && pt.ty === g.tile.ty) { this.travel(g); return; }
    }

    this.updateSelector();
    if (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER) || Phaser.Input.Keyboard.JustDown(k.E)) {
      if (this.selTarget) this.doAction(this.selTarget);
    }
  }

  travel(gate) {
    this.transitioning = true;
    Speech.stop();
    bus.emit('travel', gate.to);   // B17: lets the tutorial tear down if the kid leaves the farm mid-step
    gs.save();
    this.cameras.main.fadeOut(300, 42, 32, 24);
    this.time.delayedCall(320, () => {
      this.scene.start(gate.to, { spawn: gate.spawn, which: gate.which });
    });
  }

  tryMove(mx, my) {
    const half = 8;
    const nx = this.player.x + mx;
    if (this.canStand(nx - half, this.player.y) && this.canStand(nx + half, this.player.y)) this.player.x = nx;
    const ny = this.player.y + my;
    if (this.canStand(this.player.x - half, ny) && this.canStand(this.player.x + half, ny)) this.player.y = ny;
  }

  canStand(x, y) {
    return this.isWalkable(Math.floor(x / T), Math.floor((y - 4) / T));
  }

  setFacing(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx < 0 ? 'left' : 'right';
    else this.facing = dy < 0 ? 'up' : 'down';
  }

  frameBase() {
    if (this.facing === 'up') return 'player_up_';
    if (this.facing === 'down') return 'player_down_';
    return 'player_side_';
  }

  setWalkFrame() {
    const WALK_SEQ = [0, 1, 0, 2];   // contact, left stride, contact, right stride
    this.player.setFrame(this.frameBase() + WALK_SEQ[this.animStep]);
    this.player.setFlipX(this.facing === 'left');
  }

  setIdleFrame() {
    this.player.setFrame(this.frameBase() + '0');
    this.player.setFlipX(this.facing === 'left');
  }

  updateSelector() {
    const pt = this.playerTile();
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [fx, fy] = dirs[this.facing];
    const candidates = [
      { tx: pt.tx + fx, ty: pt.ty + fy },
      { tx: pt.tx, ty: pt.ty },
    ];
    this.selTarget = null;
    for (const c of candidates) {
      const t = this.resolveTarget(c.tx, c.ty);
      if (t && this.withinReach(t)) {
        this.selTarget = t;
        this.ring.setPosition(c.tx * T + T / 2, c.ty * T + T / 2).setVisible(true);
        return;
      }
    }
    this.ring.setVisible(false);
  }
}
