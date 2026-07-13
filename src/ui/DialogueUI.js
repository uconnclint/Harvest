// Conversation overlay: portrait, name, hearts, tap-to-advance lines, and
// choice buttons. Hoot's T.H.I.N.K. hint appears ONLY on hover or long-press —
// he never lectures (GDD: kind communication strand).

import { NPCS } from '../data/npcs.js';
import { gs } from '../systems/GameState.js';
import { Sfx } from '../systems/Sfx.js';
import { Speech } from '../systems/Speech.js';

const W = 960, H = 540;
const INK = '#3a2a1a';

function speakerInfo(sp) {
  if (sp === 'hoot') return { name: 'Professor Hoot', frame: 'i_owl', scale: 3 };
  if (sp === 'you') return { name: gs.state.farmName, frame: 'player_down_0', scale: 1.8 };
  const npc = NPCS[sp];
  return { name: npc.name, frame: npc.frame, scale: 2.2 };
}

export function openDialogue(ui, model) {
  if (!model) return;
  const o = ui.openOverlay(0.25);
  let lineIdx = 0;
  let lines = model.lines.slice();
  let mode = 'lines';          // lines | choice | reply
  let afterReply = null;       // 'done' | 'retry'
  let pickedIdx = null;
  let choiceParts = [];
  let hintParts = [];
  let closed = false;
  const pressTimers = [];
  // B16: when the panel tears down (incl. ESC), cancel any pending long-press
  // timer and clear the hint so no orphan panel is left floating over the world.
  o.add({ destroy: () => { closed = true; pressTimers.forEach(t => t && t.remove()); } });

  const panel = ui.add.nineslice(W / 2 + 60, 455, 'atlas', 'panel', 700, 140, 12, 12, 12, 12);
  const portrait = ui.add.nineslice(120, 448, 'atlas', 'panel', 150, 156, 12, 12, 12, 12);
  const face = ui.add.image(120, 432, 'atlas', 'player_down_0').setScale(2.2);
  const nameT = ui.txt(120, 492, '', 15).setOrigin(0.5);
  const textT = ui.txt(240, 430, '', 19).setOrigin(0, 0).setWordWrapWidth(620);
  const tapT = ui.txt(870, 505, 'tap ▾', 14, '#8a7350').setOrigin(1, 0.5);
  ui.tweens.add({ targets: tapT, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  o.add(panel, portrait, face, nameT, textT, tapT);

  // read-aloud: voices the current line, or in a choice the prompt + all options
  function currentSpeech() {
    if (mode === 'choice' && model.choice) {
      return [model.choice.prompt, ...model.choice.options.map(op => op.text)].join('. ');
    }
    return lines[lineIdx] ? lines[lineIdx].text : '';
  }
  o.add(ui.speakBtn(862, 408, currentSpeech, 38));

  const heartIcons = [];
  if (model.hearts !== null && model.hearts !== undefined) {
    for (let i = 0; i < 5; i++) {
      const h = ui.add.image(76 + i * 22, 514, 'atlas', i < model.hearts ? 'i_heart' : 'i_heart_g').setScale(0.8);
      heartIcons.push(h);
      o.add(h);
    }
  }

  function showLine() {
    const l = lines[lineIdx];
    const info = speakerInfo(l.sp);
    face.setFrame(info.frame).setScale(info.scale);
    nameT.setText(info.name);
    textT.setText(l.text);
    Sfx.tick();
    Speech.auto(l.text);
  }

  function clearChoice() {
    choiceParts.forEach(p => p.destroy());
    choiceParts = [];
    clearHint();
  }

  function clearHint() {
    hintParts.forEach(p => p.destroy());
    hintParts = [];
  }

  function showHint(think) {
    clearHint();
    if (!think || closed) return;   // a late long-press timer must not spawn a hint after close (B16)
    // fixed hint slot on the left, clear of the choice buttons
    const probe = ui.txt(0, 0, think, 15).setOrigin(0, 0.5);
    const w = probe.width + 76;
    probe.destroy();
    const cx = 60 + w / 2;
    const hp = ui.add.nineslice(cx, 330, 'atlas', 'panel', w, 46, 12, 12, 12, 12);
    const owl = ui.add.image(cx - w / 2 + 28, 330, 'atlas', 'i_owl');
    const label = ui.txt(cx - w / 2 + 50, 330, think, 15).setOrigin(0, 0.5);
    hintParts = [hp, owl, label];
    hintParts.forEach(p => o.add(p));
  }

  function showChoice() {
    mode = 'choice';
    tapT.setVisible(false);
    const opts = model.choice.options;
    const baseY = 380 - opts.length * 60;
    const promptT = ui.txt(700, baseY - 36, model.choice.prompt, 18, '#ffffff').setOrigin(0.5);
    promptT.setStroke('#3a2a1a', 5);
    choiceParts.push(promptT);
    o.add(promptT);

    opts.forEach((opt, i) => {
      const y = baseY + i * 60;
      const bg = ui.add.nineslice(700, y, 'atlas', 'btn_cream', 420, 52, 8, 8, 8, 8)
        .setInteractive({ useHandCursor: true });
      const t = ui.txt(700, y, opt.text, 17).setOrigin(0.5);
      choiceParts.push(bg, t);
      o.add(bg, t);

      let pressTimer = null;
      let suppressed = false;
      bg.on('pointerover', () => showHint(opt.think));
      bg.on('pointerout', () => { clearHint(); if (pressTimer) { pressTimer.remove(); pressTimer = null; } });
      bg.on('pointerdown', () => {
        suppressed = false;
        if (opt.think) {
          pressTimer = ui.time.delayedCall(450, () => { suppressed = true; showHint(opt.think); });
          pressTimers.push(pressTimer);
        }
      });
      bg.on('pointerup', () => {
        if (pressTimer) { pressTimer.remove(); pressTimer = null; }
        if (suppressed) { suppressed = false; return; }   // long-press = peek, not pick
        pick(i);
      });
    });
    Speech.auto(currentSpeech());
  }

  function pick(i) {
    const opt = model.choice.options[i];
    Sfx.tick();
    clearChoice();
    pickedIdx = i;
    afterReply = opt.ok ? 'done' : 'retry';
    if (opt.reply && opt.reply.length) {
      mode = 'reply';
      lines = opt.reply;
      lineIdx = 0;
      tapT.setVisible(true);
      showLine();
    } else {
      finishPath();
    }
  }

  function finishPath() {
    if (afterReply === 'retry') {
      lines = [];
      showChoice();
      return;
    }
    close(pickedIdx);
  }

  function close(okIdx) {
    o.close();
    if (model.onDone) model.onDone(okIdx);
  }

  function advance() {
    if (mode === 'choice') return;
    if (lineIdx < lines.length - 1) {
      lineIdx++;
      showLine();
      return;
    }
    if (mode === 'reply') { finishPath(); return; }
    if (model.choice) { showChoice(); return; }
    close(null);
  }

  o.onTap(advance);
  showLine();
}
