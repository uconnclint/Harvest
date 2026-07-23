// Read-aloud for emerging readers (ages 7-10). Uses the browser's built-in
// Web Speech API (window.speechSynthesis) — entirely on-device, no network
// calls, nothing collected. COPPA-safe like the rest of the game.
//
// Two modes, now persisted through the shared engine settings
// (engine/core/settings.js) instead of a private hh.settings blob:
//   readAloud (was hh.settings.tts)     — master switch; when on, the
//     speaker buttons appear and work (engine default: on)
//   ttsAuto   (was hh.settings.ttsAuto) — auto-read each new dialogue line /
//     toast hands-free (Harvest-specific extra setting; default off)
// A returning player's old hh.settings.tts/ttsAuto choices are adopted
// once, up front, by the legacySettingsReaders in EngineContext.js.
//
// Speech.js keeps its OWN SpeechSynthesis backend below (voice-picking +
// the B15 Chromebook cancel/delay workaround) rather than routing through
// engine/core/speech.js's generic TTS fallback, which has neither — only
// the read-aloud on/off + auto-read persistence moved to ctx.settings.
//
// Degrades to a silent no-op anywhere the API is missing (old browsers, tests).

import { settings } from './EngineContext.js';

const hasAPI = typeof window !== 'undefined' && 'speechSynthesis' in window;
const hasWindow = typeof window !== 'undefined';
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

// Pre-recorded narration (Kokoro af_heart) for the fixed, authored read-aloud
// strings — tutorial lines, journal/reward text, Hollow Board reply choices
// (see scripts/build-voiceover.mjs for exactly what gets voiced and why).
// A hit plays a real clip; anything not in the manifest — or a clip that
// fails to load — falls through to the existing SpeechSynthesis path below,
// so nothing ever goes silent. vo/vo-manifest.json is the set of keys that
// have a clip; the key is the same h*31 hash build-voiceover.mjs used to
// name the files. Fetched once, relative to the page (repo-root served).
const voKeys = new Set();
let voAudio = null;

function voKey(text) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 'f' + h.toString(36);
}

if (hasWindow) {
  fetch('vo/vo-manifest.json')
    .then(r => (r.ok ? r.json() : []))
    .then(keys => { for (const k of keys) voKeys.add(k); })
    .catch(() => { /* no clips shipped, or offline — TTS-only, fine */ });
}

export const Speech = {
  available() { return hasAPI; },
  isOn() { return settings.get('readAloud') !== false; },  // default on
  isAuto() { return !!settings.get('ttsAuto'); },           // default off

  setOn(on) {
    settings.set('readAloud', !!on);
    if (!on) this.stop();
  },

  setAuto(on) {
    settings.set('ttsAuto', !!on);
  },

  // Speaks the browser voice (the original behavior, unchanged) — used
  // directly when a line has no clip, and as the fallback if a clip fails.
  speakWithSynthesis(text) {
    if (!hasAPI) return;
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

  // Speak now. Cancels anything in progress so rapid taps don't pile up.
  // A recorded clip (Kokoro af_heart) plays when this exact text has one;
  // everything else — and any clip that fails to load — uses the browser
  // voice, exactly as before. Gated on the same readAloud setting either way.
  speak(text) {
    if (!this.isOn() || !text) return;
    if (voAudio) { voAudio.pause(); voAudio = null; }
    const key = voKeys.size ? voKey(text) : null;
    if (key && voKeys.has(key) && hasWindow && typeof Audio !== 'undefined') {
      const a = new Audio(`vo/${key}.wav`);
      voAudio = a;
      const fallback = () => { if (voAudio === a) voAudio = null; this.speakWithSynthesis(text); };
      a.onerror = fallback;
      a.play().catch(fallback);
      return;
    }
    this.speakWithSynthesis(text);
  },

  // Speak only when hands-free auto-read is on (used by dialogue + toasts).
  auto(text) {
    if (this.isAuto()) this.speak(text);
  },

  stop() {
    if (hasAPI) window.speechSynthesis.cancel();
    if (voAudio) { voAudio.pause(); voAudio = null; }
  },
};
