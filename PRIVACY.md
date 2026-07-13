# Privacy — Harvest Hollow

Harvest Hollow is built to be safe for elementary classrooms (grades 2–4) and
aligned with COPPA. Privacy is enforced by the design, not just by policy.

## What the game collects

**Nothing. No personal information is ever collected, transmitted, or stored off
the device.**

- **No accounts, no logins, no names.** Save slots are chosen by a two-word farm
  name (e.g. "Berry Hollow") picked from a fixed list and an icon — children
  cannot type their real name anywhere in the game.
- **No free-text input anywhere.** Board replies are multiple-choice, and the
  treasure-chest "password" is a sequence of pictures, not typed text. A child
  physically cannot enter personal information.
- **No network calls.** The game runs entirely in the browser from static files.
  It does not contact any server, analytics service, ad network, or third party.
  The game engine (Phaser) is bundled locally; nothing is fetched at runtime.

## What is stored, and where

- Game progress (the farm, coins, journal, etc.) is saved **only** in the
  browser's `localStorage` on that specific device, in three save slots.
- This data never leaves the device and contains no personal information — only
  the fictional farm state and the pretend picture-password for the in-game chest.
- A teacher can erase any slot from the title screen (the red ✕ on a save), and
  clearing the browser's site data removes everything.

## Audio

- Optional read-aloud uses the browser's built-in speech engine
  (`window.speechSynthesis`), which runs **on-device**. No audio is recorded and
  nothing is sent anywhere.

## Hosting note

Because the game is plain static files with no backend, hosting it does not
introduce data collection. Standard web-server request logs (if your host keeps
them) are outside the game and contain no information the game itself provides.

_Questions: this file describes the game as built. If you fork or modify it,
re-verify these claims against your changes._
