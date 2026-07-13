// Title screen: 3 save-slot signs for shared class devices. Farm names come
// from a two-word picker and an icon — no typing, no real names, COPPA-safe.

import { C, VERSION, NAME_FIRST, NAME_SECOND, FARM_ICONS } from '../config.js';
import { gs } from '../systems/GameState.js';
import { Save } from '../systems/SaveManager.js';
import { Sfx } from '../systems/Sfx.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const INK = '#3a2a1a';
const SUB = '#6b5234';
const W = 960, H = 540;

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  txt(x, y, str, size, color = INK) {
    return this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold', resolution: 2,
    }).setOrigin(0.5);
  }

  btn(x, y, w, h, label, cb, frame = 'btn', size = 20) {
    const bg = this.add.nineslice(x, y, 'atlas', frame, w, h, 8, 8, 8, 8)
      .setInteractive({ useHandCursor: true });
    const t = this.txt(x, y, label, size, frame === 'btn' || frame === 'btn_red' ? '#ffffff' : INK);
    bg.on('pointerdown', () => { bg.y = y + 2; t.y = y + 2; });
    const up = () => { bg.y = y; t.y = y; };
    bg.on('pointerout', up);
    bg.on('pointerup', () => { up(); Sfx.tick(); cb(); });
    return [bg, t];
  }

  create() {
    // warm sky, hills, sun
    this.add.rectangle(W / 2, 150, W, 300, 0x9fd9ee);
    this.add.circle(836, 70, 34, 0xf2d450);
    this.add.circle(836, 70, 27, 0xf8e388);
    this.add.rectangle(W / 2, 320, W, 60, 0x69a342);
    this.add.rectangle(W / 2, 445, W, 200, 0x7cb850);
    [[150, 56], [430, 92], [660, 48]].forEach(([x, y], i) => {
      const cl = this.add.ellipse(x, y, 110, 34, 0xffffff, 0.85);
      this.tweens.add({ targets: cl, x: x + 18, duration: 4200 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    this.add.image(96, 496, 'atlas', 'house').setScale(0.9);
    this.add.image(884, 502, 'atlas', 'tree').setScale(1.1);

    const a1 = this.add.image(258, 92, 'atlas', 'i_acorn').setScale(2.2);
    const a2 = this.add.image(702, 92, 'atlas', 'i_acorn').setScale(2.2);
    this.tweens.add({ targets: [a1, a2], angle: 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const title = this.txt(W / 2, 88, 'Harvest Hollow', 50, '#5e3a20');
    title.setStroke('#f6e7c8', 8);
    this.tweens.add({ targets: title, y: 92, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.txt(W / 2, 138, 'Grow crops. Make friends. Be kind.', 17, '#4a3826');

    this.view = [];
    this.showSlots();

    this.muteBg = this.add.nineslice(924, 504, 'atlas', 'btn_cream', 44, 44, 8, 8, 8, 8)
      .setInteractive({ useHandCursor: true });
    this.muteIcon = this.add.image(924, 504, 'atlas', Sfx.isMuted() ? 'i_mute' : 'i_snd');
    this.muteBg.on('pointerup', () => {
      Sfx.setMuted(!Sfx.isMuted());
      this.muteIcon.setFrame(Sfx.isMuted() ? 'i_mute' : 'i_snd');
      Sfx.tick();
    });

    this.add.text(10, H - 20, `v${VERSION} · spring`, {
      fontFamily: FONT, fontSize: '12px', color: '#4a3826', resolution: 2,
    });
  }

  clearView() {
    this.view.forEach(p => p.destroy());
    this.view = [];
  }

  v(...parts) {
    parts.flat().forEach(p => this.view.push(p));
  }

  // ---------- slot signs ----------

  showSlots() {
    this.clearView();
    this.v(this.txt(W / 2, 188, 'Pick your farm:', 19, '#4a3826'));
    [0, 1, 2].forEach(slot => {
      const x = 220 + slot * 260;
      const sum = Save.summary(slot);
      this.v(this.add.nineslice(x, 312, 'atlas', 'panel', 236, 178, 12, 12, 12, 12));
      if (sum) {
        this.v(this.add.image(x, 268, 'atlas', sum.icon || 'i_acorn').setScale(1.7));
        this.v(this.txt(x, 312, sum.farmName, 20));
        this.v(this.txt(x, 340, `${C.SEASON} · Day ${sum.day}`, 14, SUB));
        this.v(this.btn(x, 380, 170, 44, 'Play!', () => this.play(slot), 'btn', 18));
        const erase = this.add.nineslice(x + 96, 240, 'atlas', 'btn_red', 36, 36, 8, 8, 8, 8)
          .setInteractive({ useHandCursor: true });
        const ex = this.add.image(x + 96, 240, 'atlas', 'i_x').setScale(0.7);
        erase.on('pointerup', () => { Sfx.tick(); this.confirmErase(slot, sum.farmName); });
        this.v(erase, ex);
      } else {
        this.v(this.txt(x, 280, '+', 52, '#b8a888'));
        this.v(this.txt(x, 322, 'Empty field', 15, SUB));
        this.v(this.btn(x, 380, 170, 44, 'New farm', () => this.showNaming(slot), 'btn_cream', 17));
      }
    });
  }

  confirmErase(slot, name) {
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x2a2018, 0.5).setInteractive();
    const panel = this.add.nineslice(W / 2, 250, 'atlas', 'panel', 500, 210, 12, 12, 12, 12);
    const q = this.txt(W / 2, 196, `Erase ${name}?`, 24);
    const q2 = this.txt(W / 2, 230, 'The farm and journal go away forever.', 15, SUB);
    const parts = [dim, panel, q, q2];
    parts.push(...this.btn(W / 2 - 115, 296, 200, 52, 'Erase it', () => {
      Save.clear(slot);
      parts.forEach(p => p.destroy());
      this.showSlots();
    }, 'btn_red', 17));
    parts.push(...this.btn(W / 2 + 115, 296, 200, 52, 'Keep it!', () => {
      parts.forEach(p => p.destroy());
    }, 'btn_cream', 17));
  }

  // ---------- farm naming (word picker, no typing) ----------

  showNaming(slot) {
    this.clearView();
    this.pickFirst = NAME_FIRST[Math.floor(Math.random() * NAME_FIRST.length)];
    this.pickSecond = NAME_SECOND[Math.floor(Math.random() * NAME_SECOND.length)];
    this.pickIcon = FARM_ICONS[Math.floor(Math.random() * FARM_ICONS.length)];

    this.v(this.add.nineslice(W / 2, 330, 'atlas', 'panel', 820, 330, 12, 12, 12, 12));
    this.v(this.txt(W / 2, 196, 'Name your farm!', 22));

    this.previewIcon = this.add.image(W / 2 - 110, 238, 'atlas', this.pickIcon).setScale(1.4);
    this.previewText = this.txt(W / 2 + 14, 238, '', 26, '#4c7d33');
    this.v(this.previewIcon, this.previewText);

    this.wordBtns = { first: [], second: [] };
    NAME_FIRST.forEach((word, i) => {
      const x = 218 + (i % 2) * 130, y = 296 + Math.floor(i / 2) * 54;
      this.v(this.makeWordBtn(x, y, word, 'first'));
    });
    NAME_SECOND.forEach((word, i) => {
      const x = 528 + (i % 2) * 130, y = 296 + Math.floor(i / 2) * 54;
      this.v(this.makeWordBtn(x, y, word, 'second'));
    });

    this.iconBtns = [];
    FARM_ICONS.forEach((frame, i) => {
      const x = 758 + (i % 2) * 56, y = 286 + Math.floor(i / 2) * 56;
      const bg = this.add.nineslice(x, y, 'atlas', 'btn_cream', 48, 48, 8, 8, 8, 8)
        .setInteractive({ useHandCursor: true });
      const ic = this.add.image(x, y, 'atlas', frame);
      bg.on('pointerup', () => { Sfx.tick(); this.pickIcon = frame; this.refreshNaming(); });
      this.iconBtns.push({ bg, frame });
      this.v(bg, ic);
    });

    this.v(this.btn(W / 2 - 110, 466, 240, 50, 'Start farming!', () => {
      this.play(slot, true, `${this.pickFirst} ${this.pickSecond}`, this.pickIcon);
    }, 'btn', 19));
    this.v(this.btn(W / 2 + 130, 466, 180, 50, 'Back', () => this.showSlots(), 'btn_cream', 17));

    this.refreshNaming();
  }

  makeWordBtn(x, y, word, group) {
    const bg = this.add.nineslice(x, y, 'atlas', 'btn_cream', 122, 46, 8, 8, 8, 8)
      .setInteractive({ useHandCursor: true });
    const t = this.txt(x, y, word, 16);
    bg.on('pointerup', () => {
      Sfx.tick();
      if (group === 'first') this.pickFirst = word;
      else this.pickSecond = word;
      this.refreshNaming();
    });
    this.wordBtns[group].push({ bg, t, word });
    return [bg, t];
  }

  refreshNaming() {
    this.previewText.setText(`${this.pickFirst} ${this.pickSecond}`);
    this.previewIcon.setFrame(this.pickIcon);
    ['first', 'second'].forEach(g => {
      const sel = g === 'first' ? this.pickFirst : this.pickSecond;
      this.wordBtns[g].forEach(b => {
        b.bg.setFrame(b.word === sel ? 'btn' : 'btn_cream');
        b.t.setColor(b.word === sel ? '#ffffff' : INK);
      });
    });
    this.iconBtns.forEach(b => b.bg.setFrame(b.frame === this.pickIcon ? 'btn' : 'btn_cream'));
  }

  // ---------- go ----------

  play(slot, fresh, name, icon) {
    if (fresh) { gs.newGame(slot, name, icon); gs.freshStart = true; }
    else gs.continueGame(slot);
    this.cameras.main.fadeOut(300, 42, 32, 24);
    this.time.delayedCall(320, () => this.scene.start('Farm'));
  }
}
