// Read-aloud for emerging readers (ages 7-10). Uses the browser's built-in
// Web Speech API (window.speechSynthesis) — entirely on-device, no network
// calls, nothing collected. COPPA-safe like the rest of the game.
//
// Two modes, both stored per-device in hh.settings:
//   tts     — master switch; when on, the speaker buttons appear and work (default on)
//   ttsAuto — auto-read each new dialogue line / toast hands-free (default off)
//
// Degrades to a silent no-op anywhere the API is missing (old browsers, tests).

import { Save } from './SaveManager.js';

const hasAPI = typeof window !== 'undefined' && 'speechSynthesis' in window;
let voice = null;

function pickVoice() {
  if (!hasAPI) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  // Prefer a local (offline, e.g. school Chromebook) English voice.
  voice = voices.find(v => v.localService && /^en/i.test(v.lang))
    || voices.find(v => /^en/i.test(v.lang))
    || voices[0];
}

if (hasAPI) {
  pickVoice();
  // Most browsers populate voices asynchronously.
  window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

export const Speech = {
  available() { return hasAPI; },
  isOn() { return Save.settings().tts !== false; },     // default on
  isAuto() { return !!Save.settings().ttsAuto; },        // default off

  setOn(on) {
    const s = Save.settings();
    s.tts = on;
    Save.saveSettings(s);
    if (!on) this.stop();
  },

  setAuto(on) {
    const s = Save.settings();
    s.ttsAuto = on;
    Save.saveSettings(s);
  },

  // Speak now. Cancels anything in progress so rapid taps don't pile up.
  speak(text) {
    if (!hasAPI || !this.isOn() || !text) return;
    const synth = window.speechSynthesis;
    if (!voice) pickVoice();
    const utter = () => {
      const u = new SpeechSynthesisUtterance(String(text));
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
      u.rate = 0.9;     // a touch slow for young readers
      u.pitch = 1.05;
      u.volume = 1;
      synth.speak(u);
    };
    // B15: on Chromebooks, speak() right after cancel() can be dropped — only
    // cancel when something is actually playing, and give it a beat to settle.
    if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(utter, 60); }
    else utter();
  },

  // Speak only when hands-free auto-read is on (used by dialogue + toasts).
  auto(text) {
    if (this.isAuto()) this.speak(text);
  },

  stop() {
    if (hasAPI) window.speechSynthesis.cancel();
  },
};
