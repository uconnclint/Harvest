// Tiny WebAudio chiptune blips — no audio files, COPPA-clean, gentle volumes.
// The AudioContext unlocks on the first user gesture (see main.js).
//
// Mute is persisted, but now lives in the shared engine settings
// (engine/core/settings.js, 'muted' key) instead of a private hh.settings
// blob — a returning player's old hh.settings.muted choice is adopted once,
// up front, by the legacySettingsReaders in EngineContext.js. New players
// start MUTED (Clint's Q11 standing decision, enforced by core/settings.js's
// own default). isMuted()/setMuted() keep their exact original signatures —
// every call site (TitleScene, UIScene's 'M' key + speaker icon, Settings
// panel) is unchanged.

import { settings } from './EngineContext.js';

let ctx = null;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.08, type = 'triangle', vol = 0.12, delay = 0) {
  const a = ac();
  // Read live (never cached) so an un-mute mid-session is picked up
  // immediately, not just after the next reload.
  if (!a || settings.get('muted')) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

export const Sfx = {
  unlock() { ac(); },
  isMuted() { return !!settings.get('muted'); },
  setMuted(m) { settings.set('muted', !!m); },
  tick()    { tone(660, 0.05, 'square', 0.05); },
  dig()     { tone(180, 0.09, 'triangle', 0.14); tone(120, 0.10, 'triangle', 0.10, 0.05); },
  plant()   { tone(520, 0.06, 'sine', 0.10); tone(740, 0.08, 'sine', 0.10, 0.06); },
  splash()  { tone(900, 0.05, 'sine', 0.08); tone(640, 0.09, 'sine', 0.09, 0.04); },
  pop()     { tone(880, 0.06, 'square', 0.08); tone(1180, 0.09, 'square', 0.07, 0.05); },
  coin()    { tone(990, 0.06, 'square', 0.08); tone(1320, 0.10, 'square', 0.08, 0.06); },
  deny()    { tone(220, 0.12, 'sawtooth', 0.05); },
  sleep()   { [523, 392, 330, 262].forEach((f, i) => tone(f, 0.22, 'sine', 0.09, i * 0.16)); },
  morning() { [392, 523, 659].forEach((f, i) => tone(f, 0.15, 'sine', 0.08, i * 0.10)); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.07, i * 0.11)); },
  heart()   { tone(784, 0.08, 'sine', 0.09); tone(1047, 0.12, 'sine', 0.09, 0.08); },
  caw()     { tone(340, 0.12, 'sawtooth', 0.06); tone(290, 0.14, 'sawtooth', 0.05, 0.10); },
  post()    { tone(740, 0.05, 'triangle', 0.09); tone(880, 0.07, 'triangle', 0.08, 0.05); },
};
