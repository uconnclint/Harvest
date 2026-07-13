// localStorage persistence, 3 save slots for shared class devices.
// Writes are debounced so every mutation can call schedule() cheaply.

const SETTINGS_KEY = 'hh.settings';
const slotKey = (slot) => `hh.slot.${slot}`;
let timer = null;
let warned = false;

export const Save = {
  onFail: null,   // set by main.js to surface a one-time gentle toast (B8)

  exists(slot) {
    try { return !!localStorage.getItem(slotKey(slot)); } catch { return false; }
  },

  read(slot) {
    try {
      const raw = localStorage.getItem(slotKey(slot));
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.v) return null;
      return data;
    } catch { return null; }
  },

  // Light info for the title-screen slot signs.
  summary(slot) {
    const d = this.read(slot);
    return d ? { farmName: d.farmName, icon: d.icon, day: d.day } : null;
  },

  write(state, slot) {
    try {
      localStorage.setItem(slotKey(slot), JSON.stringify(state));
      return true;
    } catch {
      if (!warned) { warned = true; if (this.onFail) this.onFail(); }   // B8: tell the kid once, then stay quiet
      return false;
    }
  },

  schedule(state, slot) {
    clearTimeout(timer);
    timer = setTimeout(() => Save.write(state, slot), 300);
  },

  flush(state, slot) {
    clearTimeout(timer);
    if (state) Save.write(state, slot);
  },

  clear(slot) {
    try { localStorage.removeItem(slotKey(slot)); } catch { /* noop */ }
  },

  settings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { muted: false }; }
    catch { return { muted: false }; }
  },

  saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* noop */ }
  },
};
