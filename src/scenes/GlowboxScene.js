// The Glowbox: a genuinely fun 20-second firefly catch. It costs acorns —
// that tradeoff IS the media-balance lesson. No coin prizes on purpose:
// if the arcade paid out, play would become "work" and the lesson dies.

import { C } from '../config.js';
import { gs } from '../systems/GameState.js';
import { Sfx } from '../systems/Sfx.js';

const W = 960, H = 540;
const FONT = '"Trebuchet MS", Verdana, sans-serif';

export class GlowboxScene extends Phaser.Scene {
  constructor() { super('Glowbox'); }

  txt(x, y, str, size, color = '#ffffff') {
    return this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold',
      stroke: '#1a1430', strokeThickness: 5, resolution: 2,
    }).setOrigin(0.5);
  }

  create() {
    gs.activeWorld = 'Glowbox';
    // B6: hide + freeze the HUD so it doesn't render over (or take taps during) the minigame
    const ui = this.scene.get('UI');
    if (ui) {
      ui.scene.setVisible(false);
      ui.input.enabled = false;
      this.events.once('shutdown', () => { ui.scene.setVisible(true); ui.input.enabled = true; });
    }
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1430);
    this.add.rectangle(W / 2, H - 30, W, 60, 0x24202e);
    for (let i = 0; i < 40; i++) {
      const s = this.add.rectangle(((i * 211) % 940) + 10, ((i * 137) % 380) + 20, 2, 2, 0xfff8d8, 0.7);
      this.tweens.add({ targets: s, alpha: 0.2, duration: 600 + (i * 53) % 900, yoyo: true, repeat: -1 });
    }

    this.jar = this.add.image(W / 2, H - 64, 'atlas', 'jar').setScale(1.4).setDepth(10);
    this.score = 0;
    this.timeLeft = C.GLOWBOX_SECONDS;
    this.running = false;

    this.scoreText = this.txt(80, 96, '0', 30);
    this.add.image(80, 60, 'atlas', 'firefly').setScale(1.4);
    this.timerBg = this.add.rectangle(W / 2, 28, 480, 16, 0x3a3450).setStrokeStyle(2, 0x6a628a);
    this.timerBar = this.add.rectangle(W / 2 - 238, 28, 476, 12, 0xf2d450).setOrigin(0, 0.5);

    this.flies = [];
    for (let i = 0; i < 14; i++) {
      const f = this.add.image(0, 0, 'atlas', 'firefly').setVisible(false).setDepth(5);
      this.flies.push({ img: f, alive: false, vy: 0, wob: 0, t: 0 });
    }
    this.spawnTimer = 0;

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D');
    this.input.on('pointermove', (p) => { if (this.running) this.jar.x = Phaser.Math.Clamp(p.x, 40, W - 40); });

    const ready = this.txt(W / 2, 240, 'Catch the fireflies!', 40);
    const go = this.txt(W / 2, 300, 'Move the jar. Ready...', 22, '#f2d450');
    this.time.delayedCall(1400, () => {
      ready.setText('GO!');
      go.destroy();
      Sfx.morning();
      this.tweens.add({ targets: ready, alpha: 0, duration: 500, onComplete: () => ready.destroy() });
      this.running = true;
    });
  }

  spawnFly() {
    const f = this.flies.find(x => !x.alive);
    if (!f) return;
    f.alive = true;
    f.t = Math.random() * 6;
    f.vy = 70 + Math.random() * 90;
    f.wob = 30 + Math.random() * 50;
    f.img.setPosition(60 + Math.random() * (W - 120), -16).setVisible(true).setScale(1.1 + Math.random() * 0.5);
  }

  update(time, dt) {
    if (!this.running) return;
    const d = dt / 1000;

    this.timeLeft -= d;
    this.timerBar.width = Math.max(0, 476 * (this.timeLeft / C.GLOWBOX_SECONDS));
    if (this.timeLeft <= 0) { this.finish(); return; }

    if (this.keys.LEFT.isDown || this.keys.A.isDown) this.jar.x = Math.max(40, this.jar.x - 320 * d);
    if (this.keys.RIGHT.isDown || this.keys.D.isDown) this.jar.x = Math.min(W - 40, this.jar.x + 320 * d);

    this.spawnTimer -= d;
    if (this.spawnTimer <= 0) {
      this.spawnFly();
      this.spawnTimer = 0.45 + Math.random() * 0.4;
    }

    const mouthY = this.jar.y - 16, mouthX = this.jar.x;
    this.flies.forEach(f => {
      if (!f.alive) return;
      f.t += d * 3;
      f.img.setFrame(Math.floor(f.t * 5) % 2 ? 'firefly_1' : 'firefly');
      f.img.y += f.vy * d;
      f.img.x += Math.sin(f.t) * f.wob * d;
      if (Math.abs(f.img.x - mouthX) < 26 && Math.abs(f.img.y - mouthY) < 22) {
        f.alive = false;
        f.img.setVisible(false);
        this.score++;
        this.scoreText.setText(String(this.score));
        Sfx.pop();
        const spark = this.add.image(f.img.x, f.img.y, 'atlas', 'i_star').setDepth(12);
        this.tweens.add({ targets: spark, scale: 1.6, alpha: 0, duration: 300, onComplete: () => spark.destroy() });
      } else if (f.img.y > H + 20) {
        f.alive = false;
        f.img.setVisible(false);
      }
    });
  }

  finish() {
    this.running = false;
    this.flies.forEach(f => { f.alive = false; f.img.setVisible(false); });
    const prevBest = gs.state.stats.glowboxBest;
    gs.glowboxScore(this.score);
    Sfx.sleep();

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1430, 0.6);
    const panel = this.add.nineslice(W / 2, 250, 'atlas', 'panel', 480, 300, 12, 12, 12, 12);
    const title = this.add.text(W / 2, 140, `You caught ${this.score}!`, {
      fontFamily: FONT, fontSize: '30px', color: '#3a2a1a', fontStyle: 'bold', resolution: 2,
    }).setOrigin(0.5);
    let subText = `Best so far: ${Math.max(this.score, prevBest)}`;
    if (this.score > prevBest && prevBest > 0) subText = 'NEW BEST! ' + subText;
    const sticker = this.score >= 15 ? 'Gold firefly sticker!' : this.score >= 10 ? 'Silver firefly sticker!' : this.score >= 5 ? 'Firefly sticker!' : null;
    this.add.text(W / 2, 184, subText, {
      fontFamily: FONT, fontSize: '18px', color: '#6b5234', fontStyle: 'bold', resolution: 2,
    }).setOrigin(0.5);
    if (sticker) {
      this.add.image(W / 2 - 80, 222, 'atlas', 'i_star');
      this.add.text(W / 2 - 60, 222, sticker, {
        fontFamily: FONT, fontSize: '17px', color: '#3a2a1a', fontStyle: 'bold', resolution: 2,
      }).setOrigin(0, 0.5);
    }

    this.makeBtn(W / 2, 290, `Play again · ${gs.glowboxCost()} acorns`, () => {
      if (gs.payGlowbox()) { Sfx.tick(); this.scene.restart(); }
    }, 'btn_cream');
    this.makeBtn(W / 2, 352, 'Back to arcade', () => {
      Sfx.tick();
      this.scene.start('Interior', { which: 'arcade' });
    }, 'btn');
  }

  makeBtn(x, y, label, cb, frame) {
    const bg = this.add.nineslice(x, y, 'atlas', frame, 330, 52, 8, 8, 8, 8).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', resolution: 2,
      color: frame === 'btn' ? '#ffffff' : '#3a2a1a',
    }).setOrigin(0.5);
    bg.on('pointerup', cb);
  }
}
