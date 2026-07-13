// The treasure chest and its picture-tile password (privacy & security strand).
// Building: pick 3-5 pictures in order; a bean sprout grows with length —
// "longer is stronger" made visible. Opening: tap your pictures again.
// Forgot it? Mayor Marigold resets it — asking a trusted adult, modeled.

import { CODE_TILES } from '../config.js';
import { gs } from '../systems/GameState.js';
import { Sfx } from '../systems/Sfx.js';

const W = 960;
const INK = '#3a2a1a';
const SUB = '#6b5234';

export function openChest(ui) {
  if (!gs.state.chestCode) openBuilder(ui, false);
  else openPad(ui);
}

function tileGrid(ui, o, cx, topY, onPick) {
  CODE_TILES.forEach((frame, i) => {
    const x = cx + (i % 3 - 1) * 76;
    const y = topY + Math.floor(i / 3) * 76;
    const bg = ui.add.nineslice(x, y, 'atlas', 'btn_cream', 64, 64, 8, 8, 8, 8)
      .setInteractive({ useHandCursor: true });
    const icon = ui.add.image(x, y, 'atlas', frame).setScale(1.5);
    o.add(bg, icon);
    bg.on('pointerup', () => onPick(frame));
  });
}

export function openBuilder(ui, isReset) {
  const o = ui.openOverlay();
  let picked = [];
  let stage = 'pick';          // pick -> confirm
  let firstCode = null;
  let slotIcons = [];

  o.add(ui.add.nineslice(W / 2, 270, 'atlas', 'panel', 760, 500, 12, 12, 12, 12));
  const title = ui.txt(W / 2, 58, isReset ? 'Pick a NEW password!' : 'Make your chest password!', 24).setOrigin(0.5);
  o.add(title);
  const owl = ui.add.image(190, 100, 'atlas', 'i_owl').setScale(1.3);
  const hint = ui.txt(214, 100, 'Pick 3 to 5 pictures. More is stronger!', 16, SUB).setOrigin(0, 0.5);
  o.add(owl, hint);
  const closeBtn = ui.iconBtn(832, 58, 'i_x', () => o.close());
  o.add(closeBtn.bg, closeBtn.icon);

  // your secret picture row
  const slots = [];
  for (let i = 0; i < 5; i++) {
    const s = ui.add.nineslice(W / 2 - 152 + i * 76, 152, 'atlas', 'panel', 60, 60, 12, 12, 12, 12);
    slots.push(s);
    o.add(s);
  }

  // strength sprout: a bean plant that grows with password length
  const meterLabel = ui.txt(778, 130, 'Strength', 14, SUB).setOrigin(0.5);
  const sprout = ui.add.image(778, 176, 'atlas', 'bean_0').setScale(2);
  o.add(meterLabel, sprout);

  const doneParts = ui.btn(W / 2 + 110, 492, 220, 50, 'Done!', () => finishPick(), { size: 18 });
  const clearParts = ui.btn(W / 2 - 130, 492, 200, 50, 'Start over', () => resetPick(), { frame: 'btn_cream', size: 16 });
  o.add(doneParts, clearParts);

  function refresh() {
    slotIcons.forEach(s => s.destroy());
    slotIcons = [];
    picked.forEach((f, i) => {
      const icon = ui.add.image(W / 2 - 152 + i * 76, 152, 'atlas', f).setScale(1.3);
      slotIcons.push(icon);
      o.add(icon);
    });
    const stageFrame = picked.length >= 5 ? 'bean_3' : picked.length >= 4 ? 'bean_2' : picked.length >= 3 ? 'bean_1' : 'bean_0';
    sprout.setFrame(stageFrame);
    doneParts[0].setAlpha(picked.length >= 3 ? 1 : 0.5);
    doneParts[1].setAlpha(picked.length >= 3 ? 1 : 0.5);
  }

  function resetPick() {
    picked = [];
    Sfx.tick();
    refresh();
  }

  function onPick(frame) {
    if (picked.length >= 5) return;
    picked.push(frame);
    Sfx.plant();
    refresh();
    if (stage === 'confirm' && picked.length === firstCode.length) checkConfirm();
  }

  function finishPick() {
    if (picked.length < 3) { gs.toast('Pick at least 3 pictures!', 'i_owl'); return; }
    if (stage === 'pick') {
      firstCode = picked.slice();
      picked = [];
      stage = 'confirm';
      title.setText('Tap your pictures again!');
      hint.setText('Just to make sure you remember.');
      refresh();
    }
  }

  function checkConfirm() {
    const match = picked.length === firstCode.length && picked.every((f, i) => f === firstCode[i]);
    if (match) {
      gs.setChestCode(firstCode);
      Sfx.fanfare();
      gs.toast('Password locked in! Keep it secret!', 'i_chest');
      o.close();
    } else {
      Sfx.deny();
      title.setText('Almost! Tap them again.');
      picked = [];
      refresh();
    }
  }

  tileGrid(ui, o, W / 2, 246, onPick);
  refresh();
}

function openPad(ui) {
  const o = ui.openOverlay();
  let picked = [];
  let slotIcons = [];
  const code = gs.state.chestCode;

  o.add(ui.add.nineslice(W / 2, 270, 'atlas', 'panel', 760, 500, 12, 12, 12, 12));
  const title = ui.txt(W / 2, 58, 'Tap your secret pictures!', 24).setOrigin(0.5);
  o.add(title);
  o.add(ui.add.image(W / 2 - title.width / 2 - 28, 58, 'atlas', 'i_chest').setScale(1.2));
  const closeBtn = ui.iconBtn(832, 58, 'i_x', () => o.close());
  o.add(closeBtn.bg, closeBtn.icon);

  const slots = [];
  for (let i = 0; i < code.length; i++) {
    const s = ui.add.nineslice(W / 2 - ((code.length - 1) * 38) + i * 76, 140, 'atlas', 'panel', 60, 60, 12, 12, 12, 12);
    slots.push(s);
    o.add(s);
  }

  const forgot = ui.btn(W / 2, 492, 320, 48, 'I forgot! Ask Marigold', () => {
    gs.state.flags.forgotChest = true;
    gs.touch();
    gs.toast('Go see Mayor Marigold. She can help!', 'i_owl');
    o.close();
  }, { frame: 'btn_cream', size: 16 });
  o.add(forgot);

  function refresh() {
    slotIcons.forEach(s => s.destroy());
    slotIcons = [];
    picked.forEach((f, i) => {
      const icon = ui.add.image(W / 2 - ((code.length - 1) * 38) + i * 76, 140, 'atlas', f).setScale(1.3);
      slotIcons.push(icon);
      o.add(icon);
    });
  }

  function onPick(frame) {
    picked.push(frame);
    Sfx.tick();
    refresh();
    if (picked.length === code.length) {
      const match = picked.every((f, i) => f === code[i]);
      if (match) { o.close(); openTreasure(ui); }
      else {
        Sfx.deny();
        title.setText('Hmm, not it. Try again!');
        picked = [];
        ui.time.delayedCall(250, refresh);
      }
    }
  }

  tileGrid(ui, o, W / 2, 234, onPick);
}

function openTreasure(ui) {
  const o = ui.openOverlay();
  Sfx.coin();
  o.add(ui.add.nineslice(W / 2, 260, 'atlas', 'panel', 560, 330, 12, 12, 12, 12));
  o.add(ui.txt(W / 2, 130, 'It opens! Your treasures:', 24).setOrigin(0.5));

  const s = gs.state;
  const rows = [
    { icon: 'i_coin', text: `${s.coins} coins, safe and sound` },
    { icon: 'i_star', text: `Best Glowbox score: ${s.stats.glowboxBest}` },
  ];
  s.flags.badges.forEach(b => rows.push({ icon: 'i_badge', text: `${b} badge` }));
  if ((s.seeds.sunflower || 0) > 0) rows.push({ icon: 'i_seed_sunflower', text: 'A golden sunflower seed!' });
  rows.slice(0, 4).forEach((r, i) => {
    const y = 178 + i * 44;
    o.add(ui.add.image(W / 2 - 150, y, 'atlas', r.icon));
    o.add(ui.txt(W / 2 - 126, y, r.text, 17).setOrigin(0, 0.5));
  });

  o.add(ui.btn(W / 2 - 110, 372, 220, 50, 'Change password', () => { o.close(); openBuilder(ui, true); }, { frame: 'btn_cream', size: 15 }));
  o.add(ui.btn(W / 2 + 130, 372, 180, 50, 'Close', () => o.close(), { size: 16 }));
}
