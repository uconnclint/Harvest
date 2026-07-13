// Persistent UI overlay: HUD (acorns, coins, day, quest tracker, journal,
// mute), Hoot toasts, and every modal overlay. Runs above Farm/Town/Glowbox.

import { C, FENCE_COLORS } from '../config.js';
import { CROPS, CROP_ORDER } from '../data/crops.js';
import { UPGRADES } from '../data/upgrades.js';
import { NPCS } from '../data/npcs.js';
import { gs, bus } from '../systems/GameState.js';
import { Save } from '../systems/SaveManager.js';
import { Sfx } from '../systems/Sfx.js';
import { Speech } from '../systems/Speech.js';
import { QE } from '../systems/QuestEngine.js';
import { openDialogue } from '../ui/DialogueUI.js';
import { openBoard } from '../ui/BoardUI.js';
import { openJournal } from '../ui/JournalUI.js';
import { openChest, openBuilder } from '../ui/ChestUI.js';
import { startTutorial } from '../ui/TutorialUI.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const INK = '#3a2a1a';
const SUB = '#6b5234';
const W = 960, H = 540;

export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  // ---------- small builders (shared with src/ui modules) ----------

  txt(x, y, str, size = 16, color = INK, bold = true) {
    return this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: size + 'px', color,
      fontStyle: bold ? 'bold' : 'normal', resolution: 2,
    });
  }

  btn(x, y, w, h, label, cb, opts = {}) {
    const frame = opts.frame || 'btn';
    const lightText = frame === 'btn' || frame === 'btn_red';
    const bg = this.add.nineslice(x, y, 'atlas', frame, w, h, 8, 8, 8, 8)
      .setInteractive({ useHandCursor: true });
    const t = this.txt(x, y, label, opts.size || 18, opts.color || (lightText ? '#ffffff' : INK)).setOrigin(0.5);
    const parts = [bg, t];
    if (opts.icon) {
      t.setX(x + 13);
      const icon = this.add.image(t.x - t.width / 2 - 16, y, 'atlas', opts.icon).setScale(opts.iconScale || 1);
      parts.push(icon);
    }
    const baseY = parts.map(p => p.y);
    const press = (on) => parts.forEach((p, i) => { p.y = baseY[i] + (on ? 2 : 0); });
    bg.on('pointerdown', () => press(true));
    bg.on('pointerout', () => press(false));
    bg.on('pointerup', () => { press(false); Sfx.tick(); cb(); });
    return parts;
  }

  iconBtn(x, y, iconFrame, cb) {
    const bg = this.add.nineslice(x, y, 'atlas', 'btn_cream', 44, 44, 8, 8, 8, 8)
      .setInteractive({ useHandCursor: true });
    const icon = this.add.image(x, y, 'atlas', iconFrame);
    bg.on('pointerup', () => { Sfx.tick(); cb(); });
    return { bg, icon };
  }

  // A small "read this aloud" speaker that sits beside text. getText() is read
  // at tap time so it always voices the current content. Returns [] when TTS is
  // unavailable or switched off, so callers can splat it harmlessly.
  speakBtn(x, y, getText, size = 34) {
    if (!Speech.available() || !Speech.isOn()) return [];
    const bg = this.add.nineslice(x, y, 'atlas', 'btn_cream', size, size, 8, 8, 8, 8)
      .setInteractive({ useHandCursor: true });
    const icon = this.add.image(x, y, 'atlas', 'i_speak').setScale(size / 26);
    bg.on('pointerdown', () => { bg.y = y + 2; icon.y = y + 2; });
    bg.on('pointerout', () => { bg.y = y; icon.y = y; });
    bg.on('pointerup', () => { bg.y = y; icon.y = y; Speech.speak(getText()); });
    return [bg, icon];
  }

  // ---------- lifecycle ----------

  create() {
    this.hudRects = [];
    this.toastQueue = [];
    this.toastShowing = false;
    this.overlayParts = null;
    this.overlayTapCb = null;

    this.buildHud();

    this.h = {
      acorns: () => this.updateAcorns(),
      coins: () => this.updateCoins(),
      day: () => { this.updateBanner(); this.updateTracker(); },
      hint: () => this.updateTracker(),
      toast: (t) => this.enqueueToast(t),
      askSleep: () => this.openSleepConfirm(),
      openShop: () => this.openShop(),
      openPicker: (i) => this.openPicker(i),
      denied: () => Sfx.deny(),
      talkNpc: (id) => openDialogue(this, QE.getTalk(id)),
      openBoard: () => openBoard(this),
      openChest: () => openChest(this),
      openChestBuilder: () => openBuilder(this, true),
      openJournal: () => { if (!gs.modal) openJournal(this); },
      askGlowbox: () => this.openGlowboxConfirm(),
      enteredFarm: () => this.time.delayedCall(450, () => this.maybeAmbush()),
      questDone: (q) => {
        Sfx.fanfare();
        this.enqueueToast({ text: `Quest done: ${q.title}!` + (q.coins ? ` +${q.coins} coins!` : ''), icon: 'i_quest' });
      },
      hearts: (e) => {
        Sfx.heart();
        this.enqueueToast({ text: `${NPCS[e.npc].name} +1 heart!`, icon: 'i_heart' });
      },
    };
    Object.entries(this.h).forEach(([ev, fn]) => bus.on(ev, fn));
    this.events.once('shutdown', () => {
      Object.entries(this.h).forEach(([ev, fn]) => bus.off(ev, fn));
    });

    this.input.keyboard.on('keydown-M', () => this.toggleMute());
    this.input.keyboard.on('keydown-ESC', () => { if (this.overlayParts) this.closeOverlay(); });
    this.input.keyboard.on('keydown-J', () => { if (!gs.modal) openJournal(this); });

    QE.onWake();
    this.updateTracker();

    if (gs.freshStart) {
      gs.freshStart = false;
      this.time.delayedCall(500, () => startTutorial(this));
    } else {
      this.enqueueToast({ text: 'Welcome back!', icon: 'i_owl' });
      gs.morningNotes().forEach(n => this.enqueueToast(n));
    }
    this.time.delayedCall(800, () => this.maybeAmbush());
  }

  // ---------- HUD ----------

  buildHud() {
    this.acornParts = [];
    this.buildAcorns();

    this.coinPanel = this.add.nineslice(76, 78, 'atlas', 'panel', 128, 38, 12, 12, 12, 12);
    this.add.image(34, 78, 'atlas', 'i_coin');
    this.coinText = this.txt(52, 78, String(gs.state.coins), 18).setOrigin(0, 0.5);
    this.hudRects.push({ x: 12, y: 59, w: 128, h: 38 });

    this.bannerPanel = this.add.nineslice(850, 30, 'atlas', 'panel', 200, 40, 12, 12, 12, 12);
    this.add.image(772, 30, 'atlas', 'i_leaf');
    this.bannerText = this.txt(788, 30, '', 17).setOrigin(0, 0.5);
    this.updateBanner();
    this.hudRects.push({ x: 750, y: 10, w: 200, h: 40 });

    this.iconBtn(792, 78, 'i_help', () => { if (!gs.modal) this.openHelp(); });
    const book = this.iconBtn(840, 78, 'i_book', () => { if (!gs.modal) openJournal(this); });
    const mute = this.iconBtn(888, 78, Sfx.isMuted() ? 'i_mute' : 'i_snd', () => { if (!gs.modal) this.toggleMute(); });
    this.muteIcon = mute.icon;
    this.iconBtn(936, 78, 'i_gear', () => { if (!gs.modal) this.openSettings(); });
    this.hudRects.push({ x: 770, y: 56, w: 44, h: 44 });
    this.hudRects.push({ x: 818, y: 56, w: 44, h: 44 });
    this.hudRects.push({ x: 866, y: 56, w: 44, h: 44 });
    this.hudRects.push({ x: 914, y: 56, w: 44, h: 44 });

    // quest tracker, top-center — tap it to hear the current goal read aloud
    this.trackerPanel = this.add.nineslice(W / 2, 30, 'atlas', 'panel', 200, 40, 12, 12, 12, 12).setAlpha(0.95);
    this.trackerIcon = this.add.image(0, 30, 'atlas', 'i_quest');
    this.trackerText = this.txt(0, 30, '', 14).setOrigin(0, 0.5);
    this.trackerZone = this.add.zone(W / 2, 30, 200, 40).setInteractive({ useHandCursor: true });
    this.trackerZone.on('pointerup', () => {
      if (!gs.modal && this.trackerText.visible) Speech.speak(this.trackerText.text);
    });
    this.updateTracker();

    this.dayFlash = this.txt(W / 2, 120, '', 42, '#ffffff').setOrigin(0.5).setAlpha(0);
    this.dayFlash.setStroke('#5e3a20', 8);
  }

  buildAcorns() {
    this.acornParts.forEach(p => p.destroy());
    this.acornParts = [];
    const max = gs.state.acornMax;
    const w = max * 22 + 22;
    this.acornParts.push(this.add.nineslice(12 + w / 2, 32, 'atlas', 'panel', w, 40, 12, 12, 12, 12));
    this.acornIcons = [];
    for (let i = 0; i < max; i++) {
      const ic = this.add.image(32 + i * 22, 32, 'atlas', 'i_acorn');
      this.acornIcons.push(ic);
      this.acornParts.push(ic);
    }
    this.hudRects = this.hudRects.filter(r => r.tag !== 'acorns');
    this.hudRects.push({ x: 12, y: 12, w, h: 40, tag: 'acorns' });
    this.updateAcorns();
  }

  updateAcorns() {
    if (this.acornIcons.length !== gs.state.acornMax) { this.buildAcorns(); return; }
    this.acornIcons.forEach((ic, i) => ic.setFrame(i < gs.state.acorns ? 'i_acorn' : 'i_acorn_g'));
  }

  updateCoins() {
    this.coinText.setText(String(gs.state.coins));
    this.tweens.add({ targets: this.coinText, scale: { from: 1.3, to: 1 }, duration: 200 });
  }

  updateBanner() {
    this.bannerText.setText(`${C.SEASON} · Day ${gs.state.day}`);
  }

  updateTracker() {
    if (!this.trackerPanel) return;
    const hint = QE.currentHint();
    const show = !!hint;
    this.trackerPanel.setVisible(show);
    this.trackerIcon.setVisible(show);
    this.trackerText.setVisible(show);
    this.trackerZone.setVisible(show);
    this.hudRects = this.hudRects.filter(r => r.tag !== 'tracker');
    if (!show) return;
    this.trackerText.setText(hint.hint);
    const w = Math.min(470, this.trackerText.width + 58);
    this.trackerPanel.setSize ? this.trackerPanel.setSize(w, 40) : this.trackerPanel.resize(w, 40);
    this.trackerPanel.setPosition(W / 2, 30);
    this.trackerIcon.setPosition(W / 2 - w / 2 + 24, 30);
    this.trackerText.setPosition(W / 2 - w / 2 + 42, 30);
    this.trackerZone.setPosition(W / 2, 30).setSize(w, 40);
    this.trackerZone.input.hitArea.setTo(0, 0, w, 40);
    this.hudRects.push({ x: W / 2 - w / 2, y: 10, w, h: 40, tag: 'tracker' });
  }

  toggleMute() {
    Sfx.setMuted(!Sfx.isMuted());
    this.muteIcon.setFrame(Sfx.isMuted() ? 'i_mute' : 'i_snd');
    Sfx.tick();
  }

  isPointerOver(pointer) {
    if (gs.modal) return true;
    return this.hudRects.some(r =>
      pointer.x >= r.x && pointer.x <= r.x + r.w && pointer.y >= r.y && pointer.y <= r.y + r.h);
  }

  flashDay() {
    this.dayFlash.setText(`Day ${gs.state.day}`).setAlpha(0);
    this.tweens.add({ targets: this.dayFlash, alpha: 1, duration: 350, hold: 900, yoyo: true });
  }

  maybeAmbush() {
    if (gs.modal || !gs.state || !gs.state.flags.pendingSly) return;
    if (gs.activeWorld !== 'Farm') return;
    Sfx.caw();
    openDialogue(this, QE.takeSlyEvent());
  }

  // ---------- toasts ----------

  enqueueToast(t) {
    this.toastQueue.push(t);
    if (!this.toastShowing) this.nextToast();
  }

  nextToast() {
    const t = this.toastQueue.shift();
    if (!t) { this.toastShowing = false; return; }
    this.toastShowing = true;
    const label = this.txt(0, 0, t.text, 16).setOrigin(0, 0.5);
    const w = label.width + 78;
    const x = 16 + w / 2, y = H - 42;
    const panel = this.add.nineslice(x, y, 'atlas', 'panel', w, 52, 12, 12, 12, 12).setAlpha(0.97).setDepth(6000);
    const icon = this.add.image(16 + 30, y, 'atlas', t.icon || 'i_owl').setScale(1.15).setDepth(6001);
    label.setPosition(16 + 54, y).setDepth(6001);
    const parts = [panel, icon, label];
    parts.forEach(p => { p.y += 70; p.setAlpha(0); });
    this.tweens.add({ targets: parts, y: '-=70', alpha: 1, duration: 240, ease: 'Back.easeOut' });
    Speech.auto(t.text);   // hands-free read-aloud, if the kid turned it on
    this.time.delayedCall(2900, () => {
      this.tweens.add({
        targets: parts, alpha: 0, y: '+=18', duration: 220,
        onComplete: () => { parts.forEach(p => p.destroy()); this.nextToast(); },
      });
    });
  }

  // ---------- overlay framework ----------

  openOverlay(dimAlpha = 0.45) {
    if (this.overlayParts) this.closeOverlay();
    gs.modal = true;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x2a2018, dimAlpha).setInteractive();
    this.overlayParts = [dim];
    this.overlayTapCb = null;
    dim.on('pointerup', () => { if (this.overlayTapCb) this.overlayTapCb(); });
    const self = this;
    return {
      add: (...parts) => { parts.flat().forEach(p => self.overlayParts && self.overlayParts.push(p)); },
      close: () => self.closeOverlay(),
      onTap: (cb) => { self.overlayTapCb = cb; },
    };
  }

  closeOverlay() {
    if (!this.overlayParts) return;
    Speech.stop();   // don't let a reading bleed past the panel it belongs to
    this.overlayParts.forEach(p => p.destroy());
    this.overlayParts = null;
    this.overlayTapCb = null;
    gs.modal = false;
  }

  // ---------- sleep, summary, festival ----------

  openSleepConfirm() {
    const o = this.openOverlay();
    o.add(this.add.nineslice(W / 2, 250, 'atlas', 'panel', 470, 200, 12, 12, 12, 12));
    o.add(this.add.image(W / 2 - 130, 205, 'atlas', 'i_zzz').setScale(1.3));
    o.add(this.txt(W / 2 + 12, 205, `Sleep and end Day ${gs.state.day}?`, 22).setOrigin(0.5));
    o.add(this.btn(W / 2 - 105, 290, 190, 56, 'Sleep', () => { this.closeOverlay(); this.doSleep(); }, { icon: 'i_zzz' }));
    o.add(this.btn(W / 2 + 105, 290, 190, 56, 'Not yet', () => this.closeOverlay(), { frame: 'btn_cream' }));
  }

  doSleep() {
    gs.modal = true;
    Sfx.sleep();
    // interactive so it swallows stray taps over the night fade + summary (B2)
    const night = this.add.rectangle(W / 2, H / 2, W, H, 0x1a1410, 0).setDepth(5000).setInteractive();
    this.tweens.add({
      targets: night, fillAlpha: 1, duration: 700,
      onComplete: () => {
        const sum = gs.sleep();
        if (sum.festival) this.showFestival(sum, night);
        else this.showSummary(sum, night);
      },
    });
  }

  wakeUp(night, parts, thenJournal) {
    parts.forEach(p => p.destroy());
    this.tweens.add({
      targets: night, fillAlpha: 0, duration: 600,
      onComplete: () => {
        night.destroy();
        gs.modal = false;
        Sfx.morning();
        this.flashDay();
        QE.onWake();
        gs.morningNotes().forEach(n => this.enqueueToast(n));
        if (thenJournal) openJournal(this);
        else this.time.delayedCall(700, () => this.maybeAmbush());
      },
    });
  }

  showSummary(sum, night) {
    const parts = [];
    const D = 5001;
    parts.push(this.add.nineslice(W / 2, 255, 'atlas', 'panel', 520, 320, 12, 12, 12, 12).setDepth(D));
    parts.push(this.txt(W / 2, 130, `Day ${sum.day} done!`, 30).setOrigin(0.5).setDepth(D));
    const rows = [
      { icon: 'i_coin', text: `Earned ${sum.earned} coins` },
      { icon: 'i_drop', text: `Watered ${sum.watered} crops` },
      { icon: 'i_basket', text: `Picked ${sum.harvested} crops` },
    ];
    if (sum.withered > 0) rows.push({ icon: 'i_bang', text: `${sum.withered} crops dried up!` });
    rows.forEach((r, i) => {
      const y = 185 + i * 44;
      parts.push(this.add.image(W / 2 - 110, y, 'atlas', r.icon).setScale(1.1).setDepth(D));
      parts.push(this.txt(W / 2 - 84, y, r.text, 19).setOrigin(0, 0.5).setDepth(D));
    });
    parts.push(...this.btn(W / 2, 372, 280, 58, `Start Day ${gs.state.day}`, () => this.wakeUp(night, parts)).map(p => p.setDepth(D)));
  }

  showFestival(sum, night) {
    const parts = [];
    const D = 5001;
    Sfx.fanfare();
    parts.push(this.add.nineslice(W / 2, 262, 'atlas', 'panel', 640, 420, 12, 12, 12, 12).setDepth(D));
    for (let i = 0; i < 8; i++) {
      parts.push(this.add.image(W / 2 - 252 + i * 72, 86, 'atlas', i % 2 ? 'i_star' : 'i_heart').setDepth(D).setScale(0.9));
    }
    parts.push(this.txt(W / 2, 124, 'The Spring Festival!', 32).setOrigin(0.5).setDepth(D));
    parts.push(this.txt(W / 2, 158, 'The whole town came to celebrate YOUR spring.', 16, SUB).setOrigin(0.5).setDepth(D));
    const s = gs.state;
    const rows = [
      { icon: 'i_coin', text: `Earned ${s.stats.earned} coins all season` },
      { icon: 'i_basket', text: `Picked ${s.stats.harvested} crops` },
      { icon: 'i_heart', text: `Grew ${QE.heartsTotal()} friendship hearts` },
      { icon: 'i_book', text: `Wrote ${s.journal.length} journal stories` },
    ];
    if (s.flags.badges.length) rows.push({ icon: 'i_badge', text: `Earned the ${s.flags.badges.join(', ')} badge!` });
    rows.slice(0, 5).forEach((r, i) => {
      const y = 196 + i * 42;
      parts.push(this.add.image(W / 2 - 180, y, 'atlas', r.icon).setDepth(D));
      parts.push(this.txt(W / 2 - 154, y, r.text, 17).setOrigin(0, 0.5).setDepth(D));
    });
    parts.push(...this.btn(W / 2 - 130, 428, 240, 54, 'Read my journal', () => this.wakeUp(night, parts, true), { frame: 'btn_cream', size: 16 }).map(p => p.setDepth(D)));
    parts.push(...this.btn(W / 2 + 130, 428, 240, 54, 'Keep farming!', () => this.wakeUp(night, parts), { size: 17 }).map(p => p.setDepth(D)));
  }

  // ---------- glowbox ----------

  openGlowboxConfirm() {
    const o = this.openOverlay();
    const cost = gs.glowboxCost();
    o.add(this.add.nineslice(W / 2, 250, 'atlas', 'panel', 520, 280, 12, 12, 12, 12));
    o.add(this.add.image(W / 2 - 180, 200, 'atlas', 'machine').setScale(1.6));
    o.add(this.txt(W / 2 + 20, 160, 'Play Glowbox?', 26).setOrigin(0.5));
    const costRow = this.txt(W / 2 + 20, 200, `Costs ${cost}`, 19).setOrigin(0.5);
    o.add(costRow);
    o.add(this.add.image(W / 2 + 20 + costRow.width / 2 + 16, 200, 'atlas', 'i_acorn'));
    if (cost === C.COSTS.glowboxStar) {
      o.add(this.txt(W / 2 + 20, 228, 'Chores done — play cheap!', 14, '#4c7d33').setOrigin(0.5));
    }
    o.add(this.txt(W / 2, 262, 'Screen says: GLOWBOX 2 — DOUBLE GROW MODE!', 13, SUB).setOrigin(0.5));
    o.add(this.btn(W / 2 - 110, 322, 200, 54, 'Play!', () => {
      if (gs.payGlowbox()) {
        const world = gs.activeWorld;
        this.closeOverlay();
        this.scene.stop(world);
        this.scene.launch('Glowbox');
      }
    }));
    o.add(this.btn(W / 2 + 110, 322, 200, 54, 'Not now', () => this.closeOverlay(), { frame: 'btn_cream' }));
  }

  // ---------- market stand ----------

  openShop() {
    const o = this.openOverlay();
    o.add(this.add.nineslice(W / 2, 270, 'atlas', 'panel', 810, 470, 12, 12, 12, 12));
    const title = this.txt(W / 2, 72, 'Market Stand', 26).setOrigin(0.5);
    o.add(title);
    o.add(this.add.image(W / 2 - title.width / 2 - 26, 72, 'atlas', 'i_basket').setScale(1.2));
    const closeBtn = this.iconBtn(848, 70, 'i_x', () => this.closeOverlay());
    o.add(closeBtn.bg, closeBtn.icon);

    this.shopTab = this.shopTab || 'buy';
    this.shopTabParts = [];
    this.shopItems = [];
    o.add({ destroy: () => { this.shopItems.forEach(p => p.destroy()); this.shopItems = []; } });
    o.add({ destroy: () => { this.shopTabParts.forEach(p => p.destroy()); this.shopTabParts = []; } });
    this.renderShopTabs();
    this.renderShopTab();
  }

  renderShopTabs() {
    this.shopTabParts.forEach(p => p.destroy());
    this.shopTabParts = [];
    const tabs = [['buy', 'Buy seeds'], ['sell', 'Sell crops'], ['up', 'Upgrades']];
    tabs.forEach(([id, label], i) => {
      const x = 250 + i * 230;
      const parts = this.btn(x, 124, 210, 48, label, () => {
        this.shopTab = id;
        this.renderShopTabs();
        this.renderShopTab();
      }, { frame: this.shopTab === id ? 'btn' : 'btn_cream', size: 19 });
      this.shopTabParts.push(...parts);
    });
  }

  renderShopTab() {
    this.shopItems.forEach(p => p.destroy());
    this.shopItems = [];
    if (!this.overlayParts) return;
    const add = (...ps) => ps.flat().forEach(p => this.shopItems.push(p));

    if (this.shopTab === 'buy') {
      CROP_ORDER.forEach((id, i) => {
        const def = CROPS[id];
        const y = 188 + i * 70;
        add(this.add.image(150, y, 'atlas', def.icon).setScale(1.7));
        add(this.txt(192, y - 13, def.seedName, 20).setOrigin(0, 0.5));
        const own = gs.state.seeds[id] || 0;
        add(this.txt(192, y + 13, `Grows in ${def.growDays} days · you have ${own}`, 14, SUB).setOrigin(0, 0.5));
        add(this.add.image(600, y, 'atlas', 'i_coin'));
        add(this.txt(618, y, String(def.seedPrice), 20).setOrigin(0, 0.5));
        add(this.btn(770, y, 130, 50, 'Buy', () => {
          if (gs.buySeed(id)) { Sfx.coin(); this.renderShopTab(); }
        }));
      });
    } else if (this.shopTab === 'sell') {
      const entries = Object.entries(gs.state.produce).filter(([, n]) => n > 0);
      if (!entries.length) {
        add(this.txt(W / 2, 290, 'Nothing to sell yet. Grow some crops!', 20, SUB).setOrigin(0.5));
      }
      entries.slice(0, 5).forEach(([id, n], i) => {   // B10: all 5 crops are sellable — don't strand the sunflower
        const def = CROPS[id];
        const y = 188 + i * 70;
        add(this.add.image(150, y, 'atlas', `${id}_3`).setScale(1.4));
        add(this.txt(192, y - 13, `${def.name} ×${n}`, 20).setOrigin(0, 0.5));
        add(this.txt(192, y + 13, `${gs.sellPriceOf(id)} coins each`, 14, SUB).setOrigin(0, 0.5));
        add(this.btn(660, y, 120, 50, 'Sell 1', () => {
          if (gs.sellProduce(id, 1)) { Sfx.coin(); this.renderShopTab(); }
        }, { frame: 'btn_cream', size: 17 }));
        add(this.btn(796, y, 120, 50, 'Sell all', () => {
          if (gs.sellProduce(id, 99)) { Sfx.coin(); this.renderShopTab(); }
        }, { size: 17 }));
      });
    } else {
      UPGRADES.forEach((up, i) => {
        const y = 188 + i * 70;
        add(this.add.image(150, y, 'atlas', up.icon).setScale(1.4));
        add(this.txt(192, y - 13, up.name, 20).setOrigin(0, 0.5));
        add(this.txt(192, y + 13, up.desc, 14, SUB).setOrigin(0, 0.5));
        if (gs.has(up.id)) {
          if (up.id === 'paint') {
            add(this.btn(786, y, 150, 50, 'Repaint', () => this.openPaintPicker(), { frame: 'btn_cream', size: 15 }));
          } else {
            add(this.add.image(744, y, 'atlas', 'i_check'));
            add(this.txt(766, y, 'Owned!', 18, '#4c7d33').setOrigin(0, 0.5));
          }
        } else {
          add(this.add.image(600, y, 'atlas', 'i_coin'));
          add(this.txt(618, y, String(up.price), 20).setOrigin(0, 0.5));
          add(this.btn(770, y, 130, 50, 'Buy', () => {
            if (gs.buyUpgrade(up.id)) { Sfx.coin(); this.renderShopTab(); if (up.id === 'paint') this.openPaintPicker(); }
          }));
        }
      });
    }
  }

  // ---------- paint set ----------

  openPaintPicker() {
    const o = this.openOverlay();
    o.add(this.add.nineslice(W / 2, 256, 'atlas', 'panel', 540, 300, 12, 12, 12, 12));
    const title = this.txt(W / 2, 142, 'Pick a fence color!', 24).setOrigin(0.5);
    o.add(title);
    o.add(this.add.image(W / 2 - title.width / 2 - 26, 142, 'atlas', 'i_brush').setScale(1.2));
    FENCE_COLORS.forEach((c, i) => {
      const x = W / 2 - 150 + (i % 3) * 150;
      const y = 212 + Math.floor(i / 3) * 76;
      const sw = this.add.rectangle(x, y, 96, 54, c.color).setStrokeStyle(3, 0x3a2a1a)
        .setInteractive({ useHandCursor: true });
      const lbl = this.txt(x, y, c.name, 15, '#ffffff').setOrigin(0.5);
      lbl.setStroke('#3a2a1a', 4);
      o.add(sw, lbl);
      sw.on('pointerup', () => {
        gs.state.flags.fenceColor = c.color;
        gs.touch();
        bus.emit('paint');
        Sfx.coin();
        this.closeOverlay();
        gs.toast('Fences painted!', 'i_brush');
      });
    });
    o.add(this.btn(W / 2, 374, 200, 50, 'Done', () => this.closeOverlay(), { frame: 'btn_cream' }));
  }

  // ---------- seed picker ----------

  openPicker(plotIdx) {
    const types = gs.seedTypesOwned();
    if (!types.length) return;
    const o = this.openOverlay();
    const rows = types.length + 1;
    const panelH = 90 + rows * 64;
    const top = 270 - panelH / 2;
    o.add(this.add.nineslice(W / 2, 270, 'atlas', 'panel', 440, panelH, 12, 12, 12, 12));
    o.add(this.txt(W / 2, top + 40, 'Plant which seeds?', 22).setOrigin(0.5));
    types.forEach((id, i) => {
      const def = CROPS[id];
      const y = top + 92 + i * 64;
      o.add(this.btn(W / 2, y, 360, 54, `${def.seedName} ×${gs.state.seeds[id]}`, () => {
        this.closeOverlay();
        const farm = this.scene.get('Farm');
        farm.plantHere(plotIdx, id);
      }, { frame: 'btn_cream', size: 19 }));
      o.add(this.add.image(W / 2 - 140, y, 'atlas', def.icon).setScale(1.2));
    });
    o.add(this.btn(W / 2, top + 92 + types.length * 64, 360, 54, 'Never mind', () => this.closeOverlay(), { size: 18 }));
  }

  // ---------- help / directions ----------

  openHelp() {
    const o = this.openOverlay();
    o.add(this.add.nineslice(W / 2, 270, 'atlas', 'panel', 720, 480, 12, 12, 12, 12));
    const title = this.txt(W / 2, 70, 'How to Play', 26).setOrigin(0.5);
    o.add(title);
    o.add(this.add.image(W / 2 - title.width / 2 - 26, 70, 'atlas', 'i_owl').setScale(1.2));
    const closeBtn = this.iconBtn(W / 2 + 312, 70, 'i_x', () => o.close());
    o.add(closeBtn.bg, closeBtn.icon);

    const rows = [
      { icon: 'i_point', text: 'Tap where to go. Or use arrow keys.' },
      { icon: 'i_basket', text: 'Tap things to use them.' },
      { icon: 'i_acorn', text: 'Each chore uses an acorn. Sleep to refill.' },
      { icon: 'i_zzz', text: 'Tap your house, then your bed, to sleep.' },
      { icon: 'i_heart', text: 'On the Board, THINK: True? Helpful? Kind?' },
      { icon: 'i_quest', text: 'Your next goal shows up at the top.' },
    ];
    rows.forEach((r, i) => {
      const y = 132 + i * 56;
      o.add(this.add.image(116, y, 'atlas', r.icon).setScale(1.25));
      o.add(this.txt(150, y, r.text, 17).setOrigin(0, 0.5));
      o.add(this.speakBtn(660, y, () => r.text, 32));
    });
    o.add(this.btn(W / 2, 474, 220, 50, 'Got it!', () => o.close()));
  }

  // ---------- settings ----------

  openSettings() {
    const o = this.openOverlay();
    o.add(this.add.nineslice(W / 2, 268, 'atlas', 'panel', 440, 384, 12, 12, 12, 12));
    o.add(this.txt(W / 2, 116, 'Settings', 26).setOrigin(0.5));

    const soundParts = this.btn(W / 2, 164, 340, 50, Sfx.isMuted() ? 'Sound: Off' : 'Sound: On', () => {
      this.toggleMute();
      soundParts[1].setText(Sfx.isMuted() ? 'Sound: Off' : 'Sound: On');
    }, { frame: 'btn_cream', icon: Sfx.isMuted() ? 'i_mute' : 'i_snd' });
    o.add(soundParts);

    // read-aloud help for young readers
    if (Speech.available()) {
      const readParts = this.btn(W / 2, 220, 340, 50, Speech.isOn() ? 'Read aloud: On' : 'Read aloud: Off', () => {
        Speech.setOn(!Speech.isOn());
        readParts[1].setText(Speech.isOn() ? 'Read aloud: On' : 'Read aloud: Off');
        if (Speech.isOn()) Speech.speak('Read aloud is on.');
      }, { frame: 'btn_cream', icon: 'i_speak' });
      o.add(readParts);
      const autoParts = this.btn(W / 2, 276, 340, 50, Speech.isAuto() ? 'Auto-read: On' : 'Auto-read: Off', () => {
        Speech.setAuto(!Speech.isAuto());
        autoParts[1].setText(Speech.isAuto() ? 'Auto-read: On' : 'Auto-read: Off');
        if (Speech.isAuto()) Speech.speak('I will read the words for you.');
      }, { frame: 'btn_cream', icon: 'i_owl' });
      o.add(autoParts);
    } else {
      o.add(this.txt(W / 2, 248, 'Read aloud needs a newer browser.', 14, SUB).setOrigin(0.5));
    }

    o.add(this.btn(W / 2, 336, 340, 50, 'Back to title', () => {
      Save.flush(gs.state, gs.slot);
      const world = gs.activeWorld;
      this.closeOverlay();
      this.scene.stop(world);
      this.scene.stop('Glowbox');
      this.scene.stop('UI');        // B1: stop UI so its shutdown runs (bus.off) and the next farm relaunches a fresh HUD + tutorial
      this.scene.start('Title');
    }, { frame: 'btn_cream' }));
    o.add(this.btn(W / 2, 392, 340, 50, 'Keep playing', () => this.closeOverlay()));
  }
}
