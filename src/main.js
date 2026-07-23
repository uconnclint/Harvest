import { C } from './config.js';
// Boots the shared clint-engine context (ctx.settings) that Sfx.js/Speech.js
// consume — see src/systems/EngineContext.js for the hh.settings adoption
// mapping (MIGRATION_PLAN.md Phase 3). Sfx.js/Speech.js already import it
// transitively; imported here too so the game's ESM entry point is the one
// obvious place engine adoption starts.
import './systems/EngineContext.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { FarmScene } from './scenes/FarmScene.js';
import { TownScene } from './scenes/TownScene.js';
import { InteriorScene } from './scenes/InteriorScene.js';
import { GlowboxScene } from './scenes/GlowboxScene.js';
import { UIScene } from './scenes/UIScene.js';
import { gs } from './systems/GameState.js';
import { Save } from './systems/SaveManager.js';
import { Sfx } from './systems/Sfx.js';
import { Speech } from './systems/Speech.js';
import { QE } from './systems/QuestEngine.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: C.GAME_W,
  height: C.GAME_H,
  backgroundColor: '#2a2018',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, FarmScene, TownScene, InteriorScene, GlowboxScene, UIScene],
});

QE.init();

// B8: if localStorage is blocked (private browsing / disabled), tell the kid once.
Save.onFail = () => { if (gs.state) gs.toast("Couldn't save — ask your teacher.", 'i_bang'); };

// Browsers only allow audio after a user gesture.
window.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });
window.addEventListener('keydown', () => Sfx.unlock(), { once: true });

// Mid-day safety: closing the lid or switching tabs never loses progress.
const flush = () => { if (gs.state) Save.flush(gs.state, gs.slot); };
window.addEventListener('pagehide', () => { Speech.stop(); flush(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { Speech.stop(); flush(); }
});

// Modules ran -> clear the startup fallback (file:// can't reach here, so it stays shown there).
if (window.HH_ok) window.HH_ok();

// Debug/test hook (also handy for teachers who know their way around).
window.HH = { game, gs };
