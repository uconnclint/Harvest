// build-voiceover.mjs — extract every fixed, authored read-aloud string from
// Harvest's content (tutorial STEPS lines, journal reward/Sly texts, Hollow
// Board reply choices), assign each a stable key, and emit (1) a Kokoro batch
// manifest to generate af_heart clips and (2) vo/vo-manifest.json (the keys
// that have clips) shipped at the repo root alongside the clips themselves
// (wrangler's [assets] directory is "./" — no public/ folder here). The
// runtime (src/systems/Speech.js) computes the same key from the spoken
// text; a hit plays the clip, a miss falls back to the browser voice
// (unchanged). Deliberately leaves out anything templated with live game
// state (postText()'s {crop} fill, the friend-letter journal line built from
// npc.name) — those stay on the browser voice. Run: node scripts/build-voiceover.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

// same tiny hash Speech.js uses at runtime (h*31, >>>0, base36) — deterministic
// across JS engines
function voKey(text) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 'f' + h.toString(36);
}

const lines = new Map(); // key -> { text, source }
function add(text, source) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length < 2) return;
  lines.set(voKey(clean), { text: clean, source });
}

// ---- 1. Tutorial STEPS[si].lines[li] (src/ui/TutorialUI.js) ----------------
// TutorialUI.js pulls in GameState.js (which expects a global Phaser stub at
// import time), so regex the source text directly instead of importing it —
// mirrors clintsgolf's build-voiceover.mjs regexing levels.ts rather than
// importing it.
{
  const src = readFileSync(resolve(ROOT, 'src/ui/TutorialUI.js'), 'utf8');
  const stepsBlock = src.match(/export const STEPS = \[([\s\S]*?)\n\];/);
  if (!stepsBlock) throw new Error('Could not find STEPS array in TutorialUI.js');
  const linesRe = /lines:\s*\[([\s\S]*?)\]/g;
  const strRe = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
  let lm;
  while ((lm = linesRe.exec(stepsBlock[1])) !== null) {
    let sm;
    strRe.lastIndex = 0;
    while ((sm = strRe.exec(lm[1])) !== null) {
      const text = (sm[1] ?? sm[2]).replace(/\\'/g, "'").replace(/\\"/g, '"');
      add(text, 'tutorial');
    }
  }
}

// ---- 2. Journal entries (src/data/quests.js) --------------------------------
// Plain data modules, no Phaser/window dependency — safe to import directly.
// Skips the one templated journal line built at runtime from npc.name
// ("${npc.name} wrote me a friend letter...", QuestEngine.js) — it never
// appears in quests.js and so is never captured here, on purpose.
{
  const { QUESTS, SLY_EVENTS, SLY_OK, SLY_BAD, SLY_RECOVERY } = await import(resolve(ROOT, 'src/data/quests.js'));
  for (const q of QUESTS) {
    if (q.reward && q.reward.journal) add(q.reward.journal, 'journal');
  }
  for (const ev of SLY_EVENTS) {
    if (ev.finale && ev.finale.journal) add(ev.finale.journal, 'journal');
  }
  if (SLY_OK.journal) add(SLY_OK.journal, 'journal');
  if (SLY_BAD.journal) add(SLY_BAD.journal, 'journal');
  if (SLY_RECOVERY.journal) add(SLY_RECOVERY.journal, 'journal');
}

// ---- 3. Hollow Board reply choices — recipe/board r.text (src/data/posts.js) --
// postText(p, gs.state) itself is left OUT: its {crop} fill is live game
// state, not a fixed string, so it stays on the browser voice.
{
  const { POSTS } = await import(resolve(ROOT, 'src/data/posts.js'));
  for (const p of POSTS) {
    for (const r of p.replies || []) {
      if (r.text) add(r.text, 'recipe');
    }
  }
}

mkdirSync(resolve(ROOT, 'vo'), { recursive: true });
const batch = [...lines].map(([key, { text }]) => ({
  text, voice: 'af_heart',
  output: resolve(ROOT, `vo/${key}.wav`),
}));
writeFileSync(resolve(ROOT, 'scripts/vo-batch.json'), JSON.stringify(batch, null, 2));
writeFileSync(resolve(ROOT, 'vo/vo-manifest.json'), JSON.stringify([...lines.keys()].sort()));

const counts = { tutorial: 0, journal: 0, recipe: 0 };
for (const { source } of lines.values()) counts[source]++;
console.log(`lines: ${lines.size} (tutorial ${counts.tutorial}, journal ${counts.journal}, recipe ${counts.recipe})`);
console.log(`batch manifest: scripts/vo-batch.json`);
console.log(`ship manifest: vo/vo-manifest.json`);
