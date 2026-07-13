// Town: the plaza, the Hollow Board, the neighbors, the Glowbox arcade,
// Bram's stall, the well, and (from day 18) Tessa's wagon.

import {
  C, TOWN_MAP, TOWN_GATE, FARM_SPAWN_FROM_TOWN, TOWN_SPAWN_FROM_FARM,
  BOARD_TILES, WELL_TILE, TESSA_DAY,
} from '../config.js';
import { NPCS } from '../data/npcs.js';
import { gs, bus } from '../systems/GameState.js';
import { WorldScene } from './WorldScene.js';

const T = C.TILE;
const FONT = '"Trebuchet MS", Verdana, sans-serif';

export class TownScene extends WorldScene {
  constructor() { super('Town'); }

  create() {
    this.map = TOWN_MAP;
    this.walkChars = '.rc';
    this.buildWorld(TOWN_SPAWN_FROM_FARM);
    this.buildBuildings();
    this.buildNpcs();

    this.addGate(TOWN_GATE, 'Farm', FARM_SPAWN_FROM_TOWN);

    this.addButterfly(100, 160, 1060, 580);
    this.addButterfly(100, 160, 1060, 580);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    bus.emit('enteredTown');
  }

  tileFrame(ch, x, y) {
    if (ch === 'H' || ch === 'A' || ch === 'S' || ch === 'W' || ch === 'B' || ch === 'w') return 'cobble';
    return super.tileFrame(ch, x, y);
  }

  buildBuildings() {
    // Town hall: tiles cols 16-21, rows 2-5
    this.add.image(16 * T - 16, 6 * T, 'atlas', 'townhall').setOrigin(0, 1).setDepth(6 * T);
    // Arcade: cols 27-31, rows 5-8 — its door leads inside to the Glowbox
    this.add.image(27 * T, 9 * T, 'atlas', 'arcade').setOrigin(0, 1).setDepth(9 * T);
    // The Hollow Board
    this.add.image(17 * T - 8, 9 * T - 2, 'atlas', 'board_obj').setOrigin(0, 1).setDepth(9 * T);
    // Bram's stall: cols 6-9, rows 13-14
    this.add.image(6 * T, 15 * T - 4, 'atlas', 'stall').setOrigin(0, 1).setDepth(15 * T);
    // Well
    this.add.image(WELL_TILE.tx * T + T / 2, (WELL_TILE.ty + 1) * T, 'atlas', 'well')
      .setOrigin(0.5, 1).setDepth((WELL_TILE.ty + 1) * T);
    // Tessa's wagon, once she has rolled into town
    if (gs.state.day >= TESSA_DAY) {
      this.add.image(27 * T, 16 * T - 4, 'atlas', 'wagon').setOrigin(0, 1).setDepth(16 * T);
    }

    this.addTarget({ type: 'board', clickTiles: BOARD_TILES, reach: BOARD_TILES.map(t => ({ tx: t.tx, ty: t.ty + 1 })) });
    this.addTarget({ type: 'well', clickTiles: [WELL_TILE], reach: [WELL_TILE] });

    // arcade entrance: the building's footprint, reached from the row in front
    const arcadeTiles = [];
    for (let y = 0; y < this.gridH; y++) for (let x = 0; x < this.gridW; x++) {
      if (TOWN_MAP[y][x] === 'A') arcadeTiles.push({ tx: x, ty: y });
    }
    const arcadeReach = arcadeTiles
      .filter(t => TOWN_MAP[t.ty + 1] && TOWN_MAP[t.ty + 1][t.tx] === '.')
      .map(t => ({ tx: t.tx, ty: t.ty + 1 }));
    this.addTarget({ type: 'arcade', clickTiles: arcadeTiles, reach: arcadeReach.length ? arcadeReach : [{ tx: 29, ty: 9 }] });

    const hallTiles = [];
    for (let y = 2; y <= 5; y++) for (let x = 16; x <= 21; x++) hallTiles.push({ tx: x, ty: y });
    this.addTarget({ type: 'hall', clickTiles: hallTiles, reach: [{ tx: 18, ty: 5 }, { tx: 19, ty: 5 }] });

    const stallTiles = [];
    for (let y = 13; y <= 14; y++) for (let x = 6; x <= 9; x++) stallTiles.push({ tx: x, ty: y });
    this.addTarget({ type: 'stall', clickTiles: stallTiles, reach: stallTiles });

    if (gs.state.day >= TESSA_DAY) {
      const wagonTiles = [];
      for (let y = 13; y <= 15; y++) for (let x = 27; x <= 30; x++) wagonTiles.push({ tx: x, ty: y });
      this.addTarget({ type: 'wagon', clickTiles: wagonTiles, reach: wagonTiles });
    }
  }

  buildNpcs() {
    this.npcSprites = {};
    Object.values(NPCS).forEach(npc => {
      if (npc.appearsDay && gs.state.day < npc.appearsDay) return;
      const [tx, ty] = npc.spot;
      if (npc.id === 'sly') {
        this.add.image(tx * T + T / 2, (ty + 1) * T, 'atlas', 'fencepost')
          .setOrigin(0.5, 1).setDepth((ty + 1) * T - 1);
      }
      const yOff = npc.id === 'sly' ? -22 : 0;
      const spr = this.add.image(tx * T + T / 2, (ty + 1) * T - 2 + yOff, 'atlas', npc.frame)
        .setOrigin(0.5, 1).setDepth((ty + 1) * T);
      this.tweens.add({
        targets: spr, y: spr.y - 2, duration: 900 + (tx * 97) % 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      // idle blinks and little gestures, staggered so the town never syncs up
      this.time.addEvent({
        delay: 2300 + (tx * 131) % 1900, loop: true,
        callback: () => {
          spr.setFrame(npc.frame + '_b');
          this.time.delayedCall(170, () => { if (spr.active) spr.setFrame(npc.frame); });
        },
      });
      const label = this.add.text(tx * T + T / 2, ty * T - 14 + yOff, npc.name, {
        fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
        stroke: '#3a2a1a', strokeThickness: 3, resolution: 2,
      }).setOrigin(0.5).setDepth(2000).setAlpha(0.95);
      this.npcSprites[npc.id] = { spr, label };
      this.walk[ty][tx] = false;
      this.addTarget({ type: 'npc', id: npc.id, clickTiles: [{ tx, ty }], reach: [{ tx, ty }] });
    });
  }

  doAction(target) {
    if (target.type === 'npc') { bus.emit('talkNpc', target.id); return; }
    if (target.type === 'board') {
      bus.emit('action', { type: 'visit', target: 'board' });
      bus.emit('openBoard');
      return;
    }
    if (target.type === 'arcade') { this.travel({ to: 'Interior', which: 'arcade' }); return; }
    if (target.type === 'well') {
      bus.emit('action', { type: 'visit', target: 'well' });
      gs.toast('Just regular water in here!', 'i_drop');
      return;
    }
    if (target.type === 'hall') { gs.toast('Town Hall. Marigold helps everyone here.', 'i_leaf'); return; }
    if (target.type === 'stall') { gs.toast('Bram’s carrot stall. Crunchy!', 'i_basket'); return; }
    if (target.type === 'wagon') { gs.toast('Tessa’s wagon. Wonders and deals!', 'i_star'); return; }
  }
}
