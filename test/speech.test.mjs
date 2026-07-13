// Speech (read-aloud) — verify it no-ops safely where the Web Speech API is
// absent (Node, old browsers) and that its settings persist and merge cleanly
// alongside the sound-mute setting. Run: node test/speech.test.mjs

const store = {};
globalThis.localStorage = {
  getItem(k) { return store[k] ?? null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; },
};
// no globalThis.window -> the API is unavailable, exercising the fallback path

const { Speech } = await import('../src/systems/Speech.js');
const { Save } = await import('../src/systems/SaveManager.js');

let fails = 0;
const ok = (cond, msg) => { if (cond) console.log('ok:', msg); else { fails++; console.error('FAIL:', msg); } };

ok(Speech.available() === false, 'API reported unavailable in Node');
ok(Speech.isOn() === true, 'read-aloud defaults on');
ok(Speech.isAuto() === false, 'auto-read defaults off');

// must not throw without the API
Speech.speak('hello'); Speech.auto('hello'); Speech.stop();
ok(true, 'speak/auto/stop are safe no-ops without the API');

// settings persist
Speech.setOn(false);
ok(Speech.isOn() === false, 'read-aloud toggles off and persists');
Speech.setAuto(true);
ok(Speech.isAuto() === true, 'auto-read toggles on and persists');

// does not clobber an unrelated setting (e.g. sound mute)
const s = Save.settings(); s.muted = true; Save.saveSettings(s);
Speech.setOn(true);
ok(Save.settings().muted === true, 'toggling read-aloud preserves the mute setting');
ok(Speech.isOn() === true && Speech.isAuto() === true, 'tts + auto both still set after mute write');

if (fails) { console.error(`\n${fails} speech check(s) failed`); process.exit(1); }
console.log('ALL SPEECH CHECKS PASS');
