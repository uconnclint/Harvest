// EngineContext.js — creates Harvest's shared clint-engine context (ctx).
//
// Only ctx.settings is adopted this round (MIGRATION_PLAN.md Phase 3):
// Harvest's own SaveManager/GameState (3 class slots, debounce/flush) stays
// the save system of record — it was one of engine/core/save.js's OWN
// source implementations and is already excellent, so it isn't replaced
// here. createGameContext() always returns the full service bundle (save,
// settings, audio, speech, feedback, progress, random, events); everything
// but .settings is simply left unused below — harmless, since none of them
// touch storage beyond their own idle keys until something calls them.
//
// Imported by Sfx.js and Speech.js (both need ctx.settings) — keep this
// file free of any dependency on them to avoid a circular import.

import { createGameContext } from '../../engine/core/context.js';

// Mirrors SaveManager.js's own storage access (bare `localStorage`, not
// `window.localStorage`) so ctx.settings shares real storage in every
// environment that matters:
//  - real browsers: window IS globalThis there, so this is identical to
//    core/settings.js's own default resolution.
//  - Harvest's Node test harness (test/*.test.mjs): stubs a bare
//    `globalThis.localStorage` but never defines `globalThis.window` —
//    core/settings.js's own default only checks `window.localStorage` and
//    would silently (and safely) fall back to an isolated in-memory store
//    there, which would make first-run hh.settings adoption untestable.
function resolveStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch { /* ignore */ }
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* ignore */ }
  return undefined; // let core/settings.js's own probe fall back to memory
}

// hh.settings (SaveManager.js's SETTINGS_KEY) has stored three fields since
// v1.0, all written through the same read-whole/mutate-one/write-whole
// helpers (Save.settings()/saveSettings()) — so `muted` is always a real
// boolean whenever the hh.settings key exists at all (SaveManager.settings()
// 's own `|| { muted: false }` fallback guarantees it; it is never left
// `undefined` inside a saved blob):
//   muted   — Sfx master mute (Sfx.js). Historically defaulted to false
//             (unmuted) whenever never touched — matches MIGRATION_PLAN.md's
//             "24 of 25 games start unmuted today."
//   tts     — Speech read-aloud master switch (Speech.js). Absence == on.
//   ttsAuto — Speech hands-free auto-read (Speech.js). Absence == off.
//
// engine/core/settings.js owns the first two under new names:
//   muted -> muted      (same meaning; now START-MUTED by default, Q11)
//   tts   -> readAloud  (same meaning: the read-aloud master switch)
// ttsAuto has no core/settings.js equivalent — it's Harvest-specific
// hands-free behavior, genuinely distinct from readAloud (readAloud just
// shows/hides every speaker button; ttsAuto additionally auto-fires
// dialogue/toast lines with no tap at all) — so it is carried over as-is
// via the `extra` default below rather than dropped or folded in.
//
// Only an EXPLICIT prior key is adopted; a brand-new (or partial) hh.settings
// blob contributes nothing for keys it never wrote, so a first-time — or a
// returning-but-never-toggled-anything — player correctly falls through to
// the engine's start-muted / read-aloud-on / auto-off defaults instead of
// inheriting Harvest's old IMPLICIT values (Clint's Q11: "existing SAVED
// preferences honored," not implicit ones).
function readLegacyHhSettings(storage) {
  let raw;
  try { raw = storage.getItem('hh.settings'); } catch { return null; }
  if (!raw) return null;
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!parsed || typeof parsed !== 'object') return null;

  const out = {};
  if (typeof parsed.muted === 'boolean') out.muted = parsed.muted;
  if (typeof parsed.tts === 'boolean') out.readAloud = parsed.tts;
  if (typeof parsed.ttsAuto === 'boolean') out.ttsAuto = parsed.ttsAuto;
  return Object.keys(out).length ? out : null;
}

export const ctx = createGameContext({
  gameId: 'harvest',
  settings: { extra: { ttsAuto: false } },
  legacySettingsReaders: [readLegacyHhSettings],
  storage: resolveStorage(),
});

export const settings = ctx.settings;
