// The Farm Journal: auto-written, kid-voice log of every digital-citizenship
// moment. Doubles as a built-in reflection / exit ticket for teachers.

import { gs } from '../systems/GameState.js';

const W = 960;
const SUB = '#6b5234';

export function openJournal(ui) {
  const o = ui.openOverlay();
  let page = 0;
  let items = [];

  o.add(ui.add.nineslice(W / 2, 270, 'atlas', 'panel', 820, 480, 12, 12, 12, 12));
  const title = ui.txt(W / 2, 64, 'My Farm Journal', 26).setOrigin(0.5);
  o.add(title);
  o.add(ui.add.image(W / 2 - title.width / 2 - 26, 64, 'atlas', 'i_book').setScale(1.2));
  const closeBtn = ui.iconBtn(862, 64, 'i_x', () => o.close());
  o.add(closeBtn.bg, closeBtn.icon);

  if (gs.state.flags.badges.length) {
    let bx = 150;
    gs.state.flags.badges.forEach(b => {
      o.add(ui.add.image(bx, 100, 'atlas', 'i_badge'));
      const t = ui.txt(bx + 16, 100, b, 14, SUB).setOrigin(0, 0.5);
      o.add(t);
      bx += t.width + 50;
    });
  }

  const clear = () => { items.forEach(p => p.destroy()); items = []; };

  function render() {
    clear();
    const entries = gs.state.journal;
    if (!entries.length) {
      items.push(ui.txt(W / 2, 270, 'Your story starts soon!', 18, SUB).setOrigin(0.5));
      return;
    }
    const perPage = 5;
    const pages = Math.ceil(entries.length / perPage);
    page = Math.min(page, pages - 1);
    entries.slice(page * perPage, page * perPage + perPage).forEach((e, i) => {
      const y = 152 + i * 62;
      items.push(ui.add.image(112, y, 'atlas', e.icon || 'i_leaf').setScale(0.95));
      items.push(ui.txt(140, y - 12, `Day ${e.day}`, 13, SUB).setOrigin(0, 0.5));
      items.push(ui.txt(140, y + 10, e.text, 16).setOrigin(0, 0.5).setWordWrapWidth(620));
      ui.speakBtn(844, y, () => e.text, 32).forEach(p => items.push(p));
    });
    if (pages > 1) {
      items.push(...ui.btn(300, 478, 130, 42, '◂ Back', () => { if (page > 0) { page--; render(); } }, { frame: 'btn_cream', size: 15 }));
      items.push(ui.txt(W / 2, 478, `${page + 1} / ${pages}`, 15, SUB).setOrigin(0.5));
      items.push(...ui.btn(660, 478, 130, 42, 'More ▸', () => { if (page < pages - 1) { page++; render(); } }, { frame: 'btn_cream', size: 15 }));
    }
  }

  o.add({ destroy: clear });
  render();
}
