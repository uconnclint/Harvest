# Harvest Hollow — Game Design Document (v1 · Spring)

**One line:** a cozy farm-and-town sim for grades 2–4 where every digital-citizenship lesson is a game mechanic, never a quiz.

**Session math:** one in-game day = 5–7 real minutes → a 25-minute class ≈ 3–4 days → the 28-day Spring season ≈ 8 weekly visits.

**Hard rules baked into every system below**
- Chromebook (arrows/WASD + mouse) and iPad (tap) are equal first-class inputs; touch targets ≥ 48 px.
- No backend, no network calls, localStorage only, 3 save slots.
- **No free-text input anywhere.** Farm names come from a two-word picker ("Berry" + "Hollow"), board replies are choice-based, the chest password is picture tiles. Kids physically cannot type personal info or mean words — COPPA safety and kindness safety in one design move.
- ≤12 words per dialogue line, 2nd-grade vocabulary, icon beside every key word, crop states = icon + color (never color alone), no timed reading, mute always visible.

## 1 · Scene map

```
Boot ──▶ Title (3 save-slot signs · word-picker naming · settings · hold-3s teacher reset)
              │
              ▼
   ┌──────── Farm ◀──────────▶ Town ────────────┐
   │   (12 plots, farmhouse   (Hollow Board,    │
   │    door, town path)       market, NPCs)    │
   ▼                              ▼             │
Farmhouse                      Arcade ──▶ Glowbox (20-second firefly-catch mini-game)
(bed · chest · journal)
              UI scene runs on top of everything:
   acorns · coins · day banner · mute · quest hint · dialogue
   overlays: Hollow Board · My Footprint · Shop · Journal · sleep card
```

| Scene | Job |
|---|---|
| Boot | Generates the entire pixel-art atlas in code (canvas → one texture), registers animations, reads save index |
| Title | 3 save-slot signs (farm name + icon, never real names), settings, teacher reset behind hold-3-seconds gear |
| Farm | 30×20 tiles (32 px): 12-plot field (6 unlocked at start), farmhouse door, path to town |
| Town | 36×20 tiles: plaza, Hollow Board, market stand, arcade door, NPC spots |
| Farmhouse (interior) | bed (sleep), treasure chest (picture password), journal on the table |
| Arcade (interior) | the Glowbox machine |
| Glowbox | 20-second mini-game: move a jar (arrows/drag) to catch drifting fireflies; high score earns stickers, never coins |
| UI (parallel scene) | HUD + all full-screen overlays listed above |

Tech: Phaser 3 latest stable, base 960×540, `Scale.FIT`. Tap-to-move A* on the tile grid plus keyboard. One generated atlas = one draw batch; pooled crop/popup sprites; tween juice only, no particle systems. WebAudio chiptune blips (no audio files). Autosave on sleep **and** every scene change.

## 2 · The day: acorns (energy)

No clock — a day is paced by actions, so slow readers never lose anything. Sleep restores acorns. At 0 acorns Hoot says "All out of pep!" and walks you home gently — nothing is ever lost.

| Action | Acorns |
|---|---|
| Clear a weed / rock | 1 |
| Hoe a tile | 1 |
| Water a plot | 1 |
| Plant a seed | 0 (seeds cost coins) |
| **Harvest** | **0 — the payoff is never gated** |
| Glowbox play | 3 → **2** with the Chores-First Star (Quest 1) when everything is watered |
| Walk, talk, reply, shop, quest stuff | 0 |

Base **10 acorns**, 12 with the Satchel upgrade. The squeeze *is* the media-balance lesson: one Glowbox run costs ~3 waterings, and the chores-done discount turns "play after chores" into a mechanical reward instead of a rule.

Crops droop (droopy icon + "!" bubble) after 1 missed watering day and wither after 2 in a row; withered plots clear for 1 acorn and replant. The day advances only on sleep — closing the laptop mid-day loses nothing.

**Minute budget (target 5–7 min):**
wake & plan 0:30 · farm chores (8–11 acorn actions) 1:30–2:30 · walk to town 0:20 · town: board + 2 chats + quest beat 2:00–2:45 · market 0:30 · walk home + sleep card 0:40 → **5:30–7:15**.
Tuning knobs: walk speed, plot count, acorn max, lines per conversation.

## 3 · Coins

Start: **15 coins + 3 bean seeds**; hoe and watering can are free forever.

| Crop | Seed | Grows | Sells | Profit/day | Role |
|---|---|---|---|---|---|
| Sprout Bean | 5 | 2 d | 8 | 1.5 | forgiving starter |
| Sunny Carrot | 8 | 3 d | 15 | 2.3 | workhorse |
| Berry Bush | 12 | 3 d, repicks every 2 d | 10/pick | ~5 | rewards daily care all season |
| Plump Pumpkin | 15 | 4 d | 30 | 3.75 | Pip's crop; thirstiest, biggest single payoff |
| Golden Sunflower | quest-only | 4 d | 40 | — | the *real* reward for refusing the scam |

Income curve: days 1–2 ≈ 0 (setup) · day 3 first harvest ≈ 25c · week 2 ≈ 30–45c/day · weeks 3–4 ≈ 45–60c/day.

Coin sinks (market shop): Acorn Satchel +2 acorns **60c** · Comfy Boots +25% walk speed **50c** · Shiny Scale +2c per sale **80c** · Field Plus +6 plots **40c** · Paint Set, fence colors **30c**. Total 260c — a kid who waters most days owns everything by ~day 20 with coins to spare. Glowbox deliberately costs **acorns, not coins**: the tradeoff kids feel is time-and-energy, and fun is its own payoff (sticker milestones, no coin prizes — otherwise the arcade becomes "productive" and the lesson dies).

## 4 · Data schemas

```js
// CROP (static content: src/data/crops.js)
{ id:"carrot", name:"Sunny Carrot", seedPrice:8, sellPrice:15,
  growDays:3, regrowDays:null,           // berry: growDays:3, regrowDays:2
  stages:4, icon:"carrot" }              // icon + color, never color alone

// PLOT (runtime, saved) — the field is a flat array of these
{ i:41, s:"grow", crop:"carrot", stage:2, wet:true, dry:0 }
// s: grass | rock | weed | tilled | grow | ready | wither ; dry = missed days

// NPC (static: src/data/npcs.js — hearts live in the save)
{ id:"pip", name:"Pip", kind:"rabbit", scene:"Town", spot:[12,8],
  lines:{ hi:[...], quest:{...}, hearts:{ 2:[...], 4:[...] } } }

// QUEST (static def: src/data/quests.js — progress in the save)
{ id:"q1", title:"Pumpkin Promise", strand:"mediaBalance", giver:"pip",
  unlock:{ day:3 },
  steps:[ {t:"talk",npc:"pip"}, {t:"plant",crop:"pumpkin",n:2},
          {t:"waterStreak",days:2}, {t:"choice",id:"playPlan"} ],
  reward:{ coins:20, hearts:{pip:1}, perk:"choresFirstStar",
           journal:"I helped Pip make a play-after-chores plan!" } }

// BOARD POST (static schedule + player replies in the save)
{ id:"b_d4", day:4, author:"marigold", icon:"sprout",
  text:"What crop do you love best?",
  replies:[ {tone:"kind",  text:"I love pumpkins! You?"},
            {tone:"plain", text:"Pumpkins, I guess."},
            {tone:"unkind",text:"Carrots are yucky."} ],
  callback:{ day:12, npc:"pip", ifTone:"kind", gift:"pumpkinSeed" } }

// SAVE SLOT (localStorage "hh.slot.0|1|2", ~4 KB; "hh.settings" is per-device)
{ v:1, farmName:"Berry Hollow", icon:"strawberry",
  day:7, season:"spring", coins:42, acornMax:10,
  seeds:{bean:2}, produce:{carrot:3}, plots:[...],
  quests:{ q1:{step:2,done:false} }, hearts:{pip:2},
  myPosts:[ {postId:"b_d4", tone:"kind", day:4} ],     // feeds My Footprint
  journal:[ {day:6, text:"I didn't tell Sly my password!"} ],
  chestCode:["mushroom","star","moon"],
  flags:{ slyRefusals:1, upgrades:["satchel"] } }
```

## 5 · Questlines → Common Sense K–5 strands

| # | Questline | Strand | Days | What happens | The mechanic that teaches | Reward |
|---|---|---|---|---|---|---|
| 1 | Pumpkin Promise | Media Balance & Well-Being | 3–7 | Pip's pumpkins withered while he played Glowbox. Replant 2 with him, keep them watered 2 days, help him pick a "play after chores" plan | Glowbox costs 3 acorns — 2 once the plan exists and everything is watered. Balance is *felt*, then *rewarded* | 20c · Pip ❤ · Chores-First Star |
| 2 | Lock It Tight | Privacy & Security | 2, then 6/10/16/22 | Marigold gives you the chest. Build a picture-tile password (3–5 icons in order; a sprout meter grows with length — "longer is stronger"). Sly tries four costumed tricks on schedule | Refusing pays 10c + a journal line every time. If fooled, Sly takes 5c — telling Marigold gets it back plus a guided password change. Fail-forward, zero shame | 10c per refusal · 20c finale if never fooled |
| 3 | Words That Stick | Digital Footprint & Identity | 4 → 13 | Day 4 board prompt: "what crop do you love?" Day 12: an NPC read it and saved you a seed. Day 13: Pip's old "Bram grows yucky carrots" post resurfaces and stings | Posts persist all 28 days; the My Footprint page lists everything you ever posted, re-readable any time | seed gift · journal |
| 4 | Heart Sprouts | Relationships & Communication | ongoing | Every NPC post offers 3 replies (kind / plain / unkind, in kid words). Hoot shows a one-line T.H.I.N.K. hint only on hover / long-press | Kind replies grow hearts → gifts at 2❤ and 4❤, a friend letter at 5❤. Unkind: no heart loss, but the post stays in your footprint and the friendship stalls | hearts → gifts & quest gates |
| 5 | Stand Tall | Cyberbullying & Digital Drama | 14–17 | Bram, hurt by the resurfaced post, posts something mean about Pip. You can comfort Pip, tell Marigold, and post something kind. Bram apologizes and repairs | Telling the trusted adult is required to progress and framed as the strong move. Piling on is never an offered option; ignoring simply stalls the quest | 30c · ❤ Pip & Bram · journal |
| 6 | The Double-Water Rumor | News & Media Literacy | 18–21 | "Well water makes crops grow double!" sweeps the board. Trace it NPC-to-NPC back to a misread Glowbox ad, then run Marigold's two-pot test before posting the truth | A source-tracing chain plus a real in-game experiment: check it before you share it | 25c · Fact-Finder badge |
| 7 | Too Good To Be Free | News & Media Literacy + Privacy | 20 | Tessa's wagon: "FREE RARE SEEDS — just tell me your full name and where you live!" Decline, then tell Marigold | A personal-info ask dressed as a prize; declining **and** reporting earns the genuinely rare seed | Golden Sunflower seed |

Notes that tie it together:
- Quests 3 → 5 interlock causally: Pip's careless old post hurts Bram, Bram's mean post hurts Pip, and both repair — footprint and upstander become one story about words lasting and being fixable.
- The chest password is the player's own creation; opening the chest means tapping the sequence. Forgot it? Marigold resets it — asking a trusted adult is modeled even for recovery. Onboarding line: "Make a pretend password just for this chest — never your real one!"
- The **Farm Journal** auto-writes one kid-voice line per beat ("Day 6: Sly asked for my password. I said NO and told Mayor Marigold!") — the built-in reflection / exit ticket.
- **Day 28: Spring Festival** — the sleep card becomes a season recap: farm stats, journal read-through, "see you in Summer."

## 6 · NPCs

| NPC | Who | Role | Enters |
|---|---|---|---|
| Pip | rabbit kid | Quest 1 giver; pumpkin superfan; target of the mean post | phase 2 |
| Mayor Marigold | deer, the trusted adult | password help, reporting, the rumor experiment — never lectures | phase 2 |
| Sly | charming crow | four scripted password tricks; comic and harmless, never scary | phase 2 |
| Bram | gruff badger farmer | footprint sting → mean post → models apology and repair | phase 3 |
| Tessa | flashy fox merchant | arrives day 18; spreads the rumor; runs the free-seeds scam | phase 3 |
| Professor Hoot | tiny owl living in the UI | T.H.I.N.K. hints on hover / long-press only, ≤12 words, never lectures | phase 2 |

The market stand is an interactable object, not an NPC — so the vertical slice can sell produce with zero dialogue systems.

## 7 · Build order (per the brief)

1. **Vertical slice** — Farm scene, acorn day, full bean cycle (clear → hoe → plant → water → harvest → sell), sleep card, autosave/load (slot 0 implicit).
2. **Town** — Pip, Marigold, Sly; Hollow Board with 3-choice replies; hearts.
3. **Questlines** — Q1–Q2 first (the Glowbox mini-game ships here — Q1 depends on it), then Q3–Q7 with Bram and Tessa.
4. **Polish** — title screen + slot picker, tweens/juice, WebAudio sound, My Footprint and Journal pages, Spring Festival recap.

Code layout: `src/scenes/`, `src/data/` (crops/npcs/quests/posts as plain data modules), `src/systems/` (save, economy, questEngine, board), so Summer = new data files, not new engine.

## Build notes

**v1.2 — full scope.** Everything in §1–§6 is now built and browser-verified.

- **Interiors restored.** The farmhouse door opens a cozy single-room interior
  (bed → sleep, chest → picture-password, journal table → the log) and the arcade
  door opens its neon room (the playable Glowbox machine + decorative cabinets).
  Both are one small `InteriorScene` driven by `INTERIORS` data; the camera centers
  on the room (no scroll). Rooms are deliberately tiny (~5 tiles to cross) so the
  5–7 minute day budget holds. The journal also stays on a HUD button (and `J`) so
  the teacher exit-ticket is always one tap away.
- **Paint Set** (30c) completes the §3 economy (260c of sinks): buying it opens a
  6-color picker that recolors the decorative fence framing the garden, live.
- **Out of pep.** When the day's acorns run out, Hoot toasts and gently walks the
  player to the farmhouse door (GDD §2) — no forced sleep, agency preserved.
- Sly still ambushes on the farm on scheduled mornings (when you step outside),
  so no quest beat depends on entering any optional room.
- Teacher reset is a per-slot erase-with-confirm on the title screen (a clearer,
  protected variant of the "hold-3s gear" in §1).
- **First-day tutorial** (`TutorialUI`): on a new farm, Professor Hoot coaches the
  kid through one real crop cycle (walk → clear → hoe → plant → water) with a
  bouncing in-world pointer; each step waits for the actual action. Teaches both
  input styles, reads aloud, skippable. Learn-by-doing, not a lecture screen. A
  persistent **? Help** button re-opens a quick directions card any time.

## Open questions before scaffolding

1. **Wither rule** — droop after 1 missed day, wither after 2 — keeps Pip's story honest and gives media balance real stakes. OK, or do you want a never-die mode?
2. **Sly's sting** — if a kid shares the password, Sly takes 5 coins; telling Marigold recovers them and walks through changing the password. OK to let kids fail forward like this?
3. **Picture-tile passwords** (tap 3–5 icons in order) instead of typed words — recommended for iPad typing and COPPA. Good?
