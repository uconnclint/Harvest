// The Hollow Board: the town's message feed. Posts persist all season.
// Replying offers 3 tones; kind replies grow hearts. My Footprint shows
// everything the player ever posted (digital footprint strand).

import { POSTS, visiblePosts, postText } from '../data/posts.js';
import { NPCS } from '../data/npcs.js';
import { gs, bus } from '../systems/GameState.js';
import { Sfx } from '../systems/Sfx.js';

const W = 960;
const INK = '#3a2a1a';
const SUB = '#6b5234';
const TONE_ICON = { kind: 'i_heart', plain: 'i_leaf', unkind: 'i_bang' };

function authorInfo(a) {
  if (a === 'you') return { name: gs.state.farmName, frame: 'player_down_0', scale: 1.1 };
  return { name: NPCS[a].name, frame: NPCS[a].frame, scale: 1.2 };
}

export function openBoard(ui) {
  const o = ui.openOverlay();
  let page = 0;
  let items = [];
  let replyView = null;

  o.add(ui.add.nineslice(W / 2, 270, 'atlas', 'panel', 880, 500, 12, 12, 12, 12));
  const title = ui.txt(W / 2, 56, 'The Hollow Board', 26).setOrigin(0.5);
  o.add(title);
  o.add(ui.add.image(W / 2 - title.width / 2 - 26, 56, 'atlas', 'i_leaf').setScale(1.2));
  const closeBtn = ui.iconBtn(884, 56, 'i_x', () => o.close());
  o.add(closeBtn.bg, closeBtn.icon);
  o.add(ui.btn(180, 56, 200, 44, 'My Footprint', () => { o.close(); openFootprint(ui); }, { frame: 'btn_cream', size: 16, icon: 'i_book' }));

  const clear = () => { items.forEach(p => p.destroy()); items = []; };
  const add = (...ps) => ps.flat().forEach(p => { items.push(p); });

  function renderList() {
    clear();
    replyView = null;
    const posts = visiblePosts(gs.state);
    const perPage = 3;
    const pages = Math.max(1, Math.ceil(posts.length / perPage));
    page = Math.min(page, pages - 1);
    const shown = posts.slice(page * perPage, page * perPage + perPage);

    shown.forEach((p, i) => {
      const y = 132 + i * 122;
      const a = authorInfo(p.author);
      add(ui.add.nineslice(W / 2, y + 28, 'atlas', 'panel', 800, 112, 12, 12, 12, 12));
      add(ui.add.image(122, y, 'atlas', a.frame).setScale(a.scale));
      add(ui.txt(152, y - 10, a.name, 17).setOrigin(0, 0.5));
      add(ui.txt(152, y + 11, `Day ${p.day}`, 13, SUB).setOrigin(0, 0.5));
      add(ui.txt(290, y - 16, postText(p, gs.state), 16).setOrigin(0, 0).setWordWrapWidth(560));

      const mine = gs.state.board[p.id];
      if (mine) {
        add(ui.add.image(304, y + 38, 'atlas', TONE_ICON[mine.tone] || 'i_leaf').setScale(0.8));
        add(ui.txt(322, y + 38, `You: ${mine.text}`, 14, SUB).setOrigin(0, 0.5));
      } else if (p.replies && p.replies.length && p.author !== 'you') {
        add(ui.btn(776, y + 38, 130, 40, 'Reply', () => renderReply(p), { size: 16 }));
        if (p.note) add(ui.txt(290, y + 38, p.note, 13, '#a04a3c').setOrigin(0, 0.5));
      } else if (p.author === 'you') {
        add(ui.txt(290, y + 38, 'Your post. Posts stay all season!', 13, SUB).setOrigin(0, 0.5));
      }
      add(ui.speakBtn(122, y + 40, () => postText(p, gs.state), 32));
    });

    if (pages > 1) {
      add(ui.btn(280, 496, 140, 44, '◂ Newer', () => { if (page > 0) { page--; renderList(); } }, { frame: 'btn_cream', size: 15 }));
      add(ui.txt(W / 2, 496, `${page + 1} / ${pages}`, 16, SUB).setOrigin(0.5));
      add(ui.btn(680, 496, 140, 44, 'Older ▸', () => { if (page < pages - 1) { page++; renderList(); } }, { frame: 'btn_cream', size: 15 }));
    }
  }

  function renderReply(p) {
    clear();
    const a = authorInfo(p.author);
    add(ui.add.nineslice(W / 2, 150, 'atlas', 'panel', 800, 110, 12, 12, 12, 12));
    add(ui.add.image(122, 142, 'atlas', a.frame).setScale(a.scale));
    add(ui.txt(152, 130, a.name + `  ·  Day ${p.day}`, 16).setOrigin(0, 0.5));
    add(ui.txt(152, 158, postText(p, gs.state), 16).setOrigin(0, 0.5).setWordWrapWidth(620));
    add(ui.speakBtn(836, 150, () => postText(p, gs.state), 34));
    add(ui.txt(W / 2 - 250, 214, 'Pick your reply:', 18, '#ffffff').setOrigin(0.5).setStroke(INK, 5));
    // T.H.I.N.K. surfaced by default, not just on hover (so every kid sees it)
    const think = ui.txt(W / 2 - 40, 246, 'THINK — is it True, Helpful, and Kind?', 14, '#6b5234').setOrigin(0.5);
    add(think);
    add(ui.add.image(W / 2 - 40 - think.width / 2 - 18, 246, 'atlas', 'i_owl').setScale(0.9));

    let hintParts = [];
    const showHint = (think) => {
      hintParts.forEach(h => h.destroy());
      hintParts = [];
      if (!think) return;
      // fixed hint slot beside the prompt — never covers the options
      const probe = ui.txt(0, 0, think, 14).setOrigin(0, 0.5);
      const w = probe.width + 70;
      probe.destroy();
      const cx = W / 2 + 170 + w / 2;
      const hp = ui.add.nineslice(cx, 226, 'atlas', 'panel', w, 42, 12, 12, 12, 12);
      const owl = ui.add.image(cx - w / 2 + 26, 226, 'atlas', 'i_owl').setScale(0.9);
      const label = ui.txt(cx - w / 2 + 46, 226, think, 14).setOrigin(0, 0.5);
      hintParts = [hp, owl, label];
      hintParts.forEach(h => { items.push(h); });
    };

    p.replies.forEach((r, i) => {
      const y = 270 + i * 62;
      const bg = ui.add.nineslice(W / 2 - 60, y, 'atlas', 'btn_cream', 560, 54, 8, 8, 8, 8)
        .setInteractive({ useHandCursor: true });
      const t = ui.txt(W / 2 - 60, y, r.text, 16).setOrigin(0.5);
      add(bg, t);
      add(ui.speakBtn(116, y, () => r.text, 32));

      let pressTimer = null, suppressed = false;
      bg.on('pointerover', () => showHint(r.think));
      bg.on('pointerout', () => { showHint(null); if (pressTimer) { pressTimer.remove(); pressTimer = null; } });
      bg.on('pointerdown', () => {
        suppressed = false;
        if (r.think) pressTimer = ui.time.delayedCall(450, () => { suppressed = true; showHint(r.think); });
      });
      bg.on('pointerup', () => {
        if (pressTimer) { pressTimer.remove(); pressTimer = null; }
        if (suppressed) { suppressed = false; return; }
        Sfx.post();
        gs.replyToPost(p.id, r, p.author, p);
        renderList();
      });
    });

    add(ui.btn(W / 2 - 60, 270 + p.replies.length * 62 + 8, 220, 46, 'Never mind', () => renderList(), { size: 15 }));
  }

  o.add({ destroy: clear });
  renderList();
}

export function openFootprint(ui) {
  const o = ui.openOverlay();
  let page = 0;
  let items = [];

  o.add(ui.add.nineslice(W / 2, 270, 'atlas', 'panel', 820, 480, 12, 12, 12, 12));
  const title = ui.txt(W / 2, 64, 'My Footprint', 26).setOrigin(0.5);
  o.add(title);
  o.add(ui.add.image(W / 2 - title.width / 2 - 26, 64, 'atlas', 'i_book').setScale(1.2));
  o.add(ui.txt(W / 2, 98, 'Everything you posted this season. Posts stick around!', 15, SUB).setOrigin(0.5));
  const closeBtn = ui.iconBtn(862, 64, 'i_x', () => { o.close(); openBoard(ui); });
  o.add(closeBtn.bg, closeBtn.icon);

  const clear = () => { items.forEach(p => p.destroy()); items = []; };

  function render() {
    clear();
    const entries = Object.entries(gs.state.board)
      .map(([postId, r]) => {
        const post = POSTS.find(p => p.id === postId);
        return { day: r.day, to: post ? post.author : 'town', text: r.text, tone: r.tone };
      });
    if (gs.state.flags.truthPosted) {
      entries.push({ day: 18, to: 'town', text: 'We tested it! Well water is just water.', tone: 'kind' });
    }
    entries.sort((a, b) => a.day - b.day);

    if (!entries.length) {
      items.push(ui.txt(W / 2, 270, 'Nothing yet. Reply to a post on the Board!', 17, SUB).setOrigin(0.5));
      return;
    }
    const perPage = 5;
    const pages = Math.ceil(entries.length / perPage);
    page = Math.min(page, pages - 1);
    entries.slice(page * perPage, page * perPage + perPage).forEach((e, i) => {
      const y = 148 + i * 62;
      items.push(ui.add.image(108, y, 'atlas', TONE_ICON[e.tone] || 'i_leaf').setScale(0.9));
      const who = e.to === 'town' ? 'everyone' : NPCS[e.to].name;
      items.push(ui.txt(134, y - 11, `Day ${e.day} · to ${who}`, 13, SUB).setOrigin(0, 0.5));
      items.push(ui.txt(134, y + 11, e.text, 16).setOrigin(0, 0.5).setWordWrapWidth(620));
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
