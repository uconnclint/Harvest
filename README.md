# Harvest Hollow 🌰

A cozy farming and town-life sim for 2nd–4th graders that teaches digital citizenship
through play — never through quizzes. Full design in [GDD.md](GDD.md).

**The whole Spring season is playable:** 28 days, the town of Harvest Hollow, five
neighbors, the Hollow Board social feed, the Glowbox arcade, the picture-password
chest, all seven digital-citizenship questlines, and the Spring Festival.

## Run it

Plain static files, but ES modules need http (not `file://`):

```bash
cd Harvest
python3 -m http.server 8000
# open http://localhost:8000
```

**Deploy:** upload the whole folder to any static host (Dreamhost: drop into the site
directory). No build step, no backend, no network calls — Phaser 3.90.0 is bundled in
`lib/`. Saves live in localStorage only. **No free-text input anywhere** (names, posts,
and passwords are all built from pickers) — COPPA-safe by construction.

## Controls

| | Chromebook | iPad |
|---|---|---|
| Move | Arrow keys or WASD | Tap where to go |
| Do the thing | Space / Enter / E (glowing tile) | Tap the thing |
| Journal | J or the book button | Book button |
| Help | the ? button | ? button |
| Mute | M or the speaker button | Speaker button |

## First-day tutorial

A brand-new farm opens with Professor Hoot coaching the kid through their *real*
first crop cycle — a bouncing arrow points at what to tap, and each step waits for
them to actually do it: walk → clear a weed → hoe → plant → water. It teaches both
input styles ("tap, or use arrow keys"), reads every line aloud, and has a **Skip**
for teachers. It only runs once (new farms). The **? Help button** re-opens a quick
picture-and-text directions card anytime — handy for kids returning the next week.

One contextual action per tile. The **farmhouse door** opens a cozy interior — walk
to the bed to sleep, the chest for your password, the table for your journal. The
**arcade door** in town opens the Glowbox room. The road east of the farm leads to town.

## Read-aloud (for emerging readers)

A blue speaker button sits beside text everywhere there's reading — dialogue lines,
Hollow Board posts and reply choices, journal entries, footprint entries — and the
quest goal at the top reads aloud when tapped. Hearing each kind/plain/unkind reply
before choosing is part of the kindness lesson for kids who can't yet read it.

Two toggles in Settings (gear icon):
- **Read aloud** (default on) — the master switch; off hides every speaker button.
  Teacher control for shared rooms without headphones.
- **Auto-read** (default off) — hands-free; each new dialogue line and Hoot message
  reads itself, so the kids who need it most don't hunt for a button.

It uses the browser's built-in Web Speech API: entirely on-device, **no network calls,
nothing collected** — COPPA-safe, and it works offline on school Chromebooks and iPads.
Where a browser lacks the API, the buttons simply don't appear and the game plays on.

## The season (teacher's map)

| Days | What happens | Common Sense K–5 strand |
|---|---|---|
| 2 | Marigold gives the chest; build a picture password | Privacy & Security |
| 2+ | Hollow Board replies (kind/plain/unkind) grow hearts | Relationships & Communication |
| 3–7 | Pip's withered pumpkins; the play-after-chores plan | Media Balance & Well-Being |
| 6/10/16/22 | Sly's four password tricks (refusing pays; slipping is fixable via Marigold) | Privacy & Security |
| 4→13 | The day-4 post comes back around — kindly, then awkwardly | Digital Footprint & Identity |
| 14–17 | The mean post about Pip: comfort, tell Marigold, post kind. Bram repairs | Cyberbullying & Digital Drama |
| 18–19 | Trace the "double water" rumor to a game ad; test it; post the truth | News & Media Literacy |
| 20 | "FREE seeds — just tell me your name and address!" Decline + report | Privacy + News Literacy |
| 28 | Spring Festival: season stats + journal read-through (built-in exit ticket) |  |

The **Farm Journal** (book button) auto-logs every moment in kid language — works as
a reflection sheet or exit ticket. **My Footprint** (on the Hollow Board) lists
everything the player ever posted.

**Teacher reset:** Title screen → the red ✕ on a slot → "Erase it". Three save slots
per device, farm names from a word picker (never real names).

## Project layout

```
index.html
lib/phaser.min.js        Phaser 3.90.0, pinned (no CDN at runtime)
src/
  main.js                game config + save-on-hide safety
  config.js              ALL tuning knobs: costs, prices, maps, day length
  data/                  crops, upgrades, npcs, posts, quests (all content as data)
  systems/
    TextureFactory.js    every sprite drawn in code into one atlas
    GameState.js         rules: acorns, plots, market, hearts, board, the night pass
    QuestEngine.js       quest unlocks/steps, dialogue resolution, Sly scheduling
    SaveManager.js       localStorage, 3 slots, debounced autosave, v1->v2 migration
    Sfx.js               WebAudio blips, persistent mute
    Speech.js            read-aloud via Web Speech API (on-device, no network)
    astar.js             tap-to-move pathfinding
  scenes/
    BootScene  TitleScene  WorldScene (base)  FarmScene  TownScene
    InteriorScene (farmhouse + arcade, data-driven)  GlowboxScene  UIScene
  ui/
    DialogueUI  BoardUI (+Footprint)  JournalUI  ChestUI (password builder)
    TutorialUI (first-day Hoot coaching)
test/
  data.test.mjs          content guards: ≤12-word lines, valid refs, map shape
  logic.test.mjs         full-season quest simulation in Node
  speech.test.mjs        read-aloud graceful-degradation + settings persistence
```

Run `npm test` (or `node test/<name>.test.mjs` individually) for the whole suite:
data integrity, the full-season quest sim, read-aloud fallback, and core mechanics
(pathfinding, market, wither/regrow, the Glowbox discount rule).

**Deploy note (Apache/Dreamhost):** the included `.htaccess` tells the browser to
revalidate the game's JS/CSS so replacing the folder takes effect immediately. If
you ever see an old version after updating, hard-refresh once (Ctrl/Cmd+Shift+R).

## Extending to Summer

Quests, posts, NPCs, and crops are plain data modules — a new season is new data
files plus a palette swap, not new engine. The save schema is versioned (`v: 2`)
with a migration path.
