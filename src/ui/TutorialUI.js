// First-day coached tutorial. Professor Hoot teaches the controls by walking the
// kid through one real crop cycle — learn by doing, no lecture screen (GDD ethos).
// Runs once on a brand-new farm; the Help (?) button re-shows quick directions.
//
// Steps are either `tap` (read-and-continue, world paused) or `wait:<action>`
// (the world is live and the step completes when the kid does that action).

import { gs, bus } from '../systems/GameState.js';
import { Speech } from '../systems/Speech.js';
import { Sfx } from '../systems/Sfx.js';

const W = 960, H = 540;
const DOOR = { tx: 5, ty: 5 };

export const STEPS = [
  { tap: true, lines: ["Hi! I'm Professor Hoot.", "Let's grow your first crop!"] },
  { wait: 'walk', lines: ['Tap the grass to walk. Or use arrow keys!'] },
  { wait: 'clear', point: 'weed', lines: ['See the weeds? Tap them to pull!'] },
  { wait: 'hoe', point: 'grass', lines: ['Now tap the dirt to dig a hole!'] },
  { wait: 'plant', point: 'tilled', lines: ['Tap again to plant a bean seed!'] },
  { wait: 'water', point: 'grow', lines: ['Tap your seed to give it water!'] },
  { tap: true, lines: ['Hooray! You did it!', 'Beans grow in two sleeps.'] },
  { tap: true, point: 'house', lines: ['Fill your farm, then tap your house to sleep.', 'Have fun, farmer!'] },
];

export function startTutorial(ui) {
  let si = 0, li = 0, done = false;
  let catcher = null;

  // keep world taps from leaking through the bottom bar
  ui.hudRects.push({ x: 0, y: H - 94, w: W, h: 94, tag: 'tut' });

  const panel = ui.add.nineslice(W / 2, H - 46, 'atlas', 'panel', 904, 88, 12, 12, 12, 12)
    .setAlpha(0.98).setDepth(6500).setInteractive();
  panel.on('pointerup', tapAdvance);
  const owl = ui.add.image(60, H - 46, 'atlas', 'i_owl').setScale(2.4).setDepth(6501);
  ui.tweens.add({ targets: owl, angle: { from: -6, to: 6 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const label = ui.txt(108, H - 52, '', 19).setOrigin(0, 0.5).setWordWrapWidth(600).setDepth(6501);
  const tapHint = ui.txt(700, H - 22, 'tap to go on ▾', 14, '#8a7350').setOrigin(0.5).setDepth(6501);
  ui.tweens.add({ targets: tapHint, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  const speak = ui.speakBtn(W - 158, H - 46, () => STEPS[si].lines[li], 38);
  speak.forEach(p => p.setDepth(6501));
  const skip = ui.btn(W - 76, H - 46, 110, 44, 'Skip', () => end(), { frame: 'btn_cream', size: 15 });
  skip.forEach(p => p.setDepth(6501));

  const parts = [panel, owl, label, tapHint, ...speak, ...skip];

  function findTile(kind) {
    if (kind === 'house') return DOOR;
    const open = gs.state.plots.filter(p => !p.locked);
    const match = {
      weed: p => p.s === 'weed' || p.s === 'rock',
      grass: p => p.s === 'grass',
      tilled: p => p.s === 'tilled',
      grow: p => p.s === 'grow',
    }[kind];
    const p = open.find(match || (() => false));
    return p ? { tx: p.tx, ty: p.ty } : null;
  }

  function ensureCatcher(on) {
    if (on && !catcher) {
      catcher = ui.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setInteractive().setDepth(6400);
      catcher.on('pointerup', tapAdvance);
    } else if (!on && catcher) {
      catcher.destroy();
      catcher = null;
    }
  }

  function showLine() {
    label.setText(STEPS[si].lines[li]);
    Sfx.tick();
    Speech.speak(STEPS[si].lines[li]);
  }

  function showStep() {
    li = 0;
    const step = STEPS[si];
    bus.emit('tutorialPoint', step.point ? findTile(step.point) : null);
    if (step.tap) {
      gs.modal = true;          // pause the world; tap to continue
      ensureCatcher(true);
      tapHint.setVisible(true);
    } else {
      gs.modal = false;         // let the kid act in the world
      ensureCatcher(false);
      tapHint.setVisible(false);
    }
    showLine();
  }

  function tapAdvance() {
    const step = STEPS[si];
    if (done || !step.tap) return;
    if (li < step.lines.length - 1) { li++; showLine(); return; }
    next();
  }

  function next() {
    si++;
    if (si >= STEPS.length) { end(); return; }
    showStep();
  }

  function onAction(a) {
    const step = STEPS[si];
    if (done || !step || !step.wait) return;
    if (a.type === step.wait) { Sfx.heart(); next(); }
  }

  function end() {
    if (done) return;
    done = true;
    gs.modal = false;
    ensureCatcher(false);
    bus.off('action', onAction);
    bus.off('travel', onTravel);
    bus.emit('tutorialPoint', null);
    ui.hudRects = ui.hudRects.filter(r => r.tag !== 'tut');
    parts.forEach(p => p.destroy());
    gs.toast('Stuck later? Tap the help button!', 'i_help');
  }

  // B17: leaving the farm mid-tutorial would strand the bubble — tear it down.
  function onTravel() { end(); }

  bus.on('action', onAction);
  bus.on('travel', onTravel);
  ui.events.once('shutdown', () => { bus.off('action', onAction); bus.off('travel', onTravel); });
  showStep();
}
