// All tunable numbers live here — the GDD's "tuning knobs".

// Single source of truth for the build version (shown on the title screen).
export const VERSION = '1.4';

export const C = {
  GAME_W: 960,
  GAME_H: 540,
  TILE: 32,
  PX: 2,                 // art is drawn on a 16-unit grid, 2px per unit

  WALK_SPEED: 160,
  BOOTS_MULT: 1.25,

  ACORN_BASE: 10,
  SATCHEL_BONUS: 2,
  SCALE_BONUS: 2,        // Shiny Scale: +coins per item sold

  COSTS: { clear: 1, hoe: 1, water: 1, plant: 0, harvest: 0, glowbox: 3, glowboxStar: 2 },

  GLOWBOX_SECONDS: 20,

  START_COINS: 15,
  START_SEEDS: { bean: 3 },

  DROOP_AFTER: 1,        // missed watering days before the "!" warning
  WITHER_AFTER: 2,       // missed watering days before the crop withers

  SEASON: 'Spring',
  SEASON_DAYS: 28,
};

// The 12 field plots: 6 unlocked (top-left 3x2), 6 behind the Field Plus upgrade.
// start: weed | rock | grass (grass = cleared, ready to hoe)
export const PLOT_DEFS = [
  { tx: 12, ty: 8,  locked: false, start: 'weed'  },
  { tx: 13, ty: 8,  locked: false, start: 'grass' },
  { tx: 14, ty: 8,  locked: false, start: 'rock'  },
  { tx: 12, ty: 9,  locked: false, start: 'grass' },
  { tx: 13, ty: 9,  locked: false, start: 'weed'  },
  { tx: 14, ty: 9,  locked: false, start: 'grass' },
  { tx: 15, ty: 8,  locked: true,  start: 'grass' },
  { tx: 15, ty: 9,  locked: true,  start: 'grass' },
  { tx: 12, ty: 10, locked: true,  start: 'grass' },
  { tx: 13, ty: 10, locked: true,  start: 'grass' },
  { tx: 14, ty: 10, locked: true,  start: 'grass' },
  { tx: 15, ty: 10, locked: true,  start: 'grass' },
];

// Farm ground map, 30x20 tiles.
// T tree border · . grass · r path · H house footprint · D house door · W pond
export const FARM_MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T..HHHH....................r.T',
  'T..HHHH..t.................r.T',
  'T..HHHH....................r.T',
  'T..HHDH....................r.T',
  'T..........................r.T',
  'T..........................r.T',
  'T..........................r.T',
  'T..........................r.T',
  'T.......t..................rrr',
  'T..........................r.T',
  'T..........................r.T',
  'T.....................t....r.T',
  'T..WWWW....................r.T',
  'T..WWWW....................r.T',
  'T..WWWW....................r.T',
  'T..........................r.T',
  'T..........................r.T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

export const SPAWN = { tx: 7, ty: 7 };
export const DOOR_TILE = { tx: 5, ty: 5 };
export const STAND_TILES = [ { tx: 24, ty: 8 }, { tx: 25, ty: 8 } ];
export const SIGN_TILE = { tx: 26, ty: 11 };

// Farm <-> Town travel
export const FARM_GATE = { tx: 29, ty: 10 };          // step here -> Town
export const FARM_SPAWN_FROM_TOWN = { tx: 28, ty: 10 };
export const TOWN_GATE = { tx: 0, ty: 10 };           // step here -> Farm
export const TOWN_SPAWN_FROM_FARM = { tx: 1, ty: 10 };

// Town ground map, 36x20.
// T border trees · t tree · . grass · r path · c plaza cobble
// H town hall · A arcade · B Hollow Board · S Bram's stall · W Tessa's wagon spot · w well
export const TOWN_MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T...............HHHHHH.............T',
  'T...............HHHHHH.............T',
  'T...t...........HHHHHH.............T',
  'T...............HHHHHH.....AAAAA...T',
  'T...........ccccccccccccc..AAAAA...T',
  'T...........ccccccccccccc..AAAAA...T',
  'T...........cccccBBBccccc..AAAAA...T',
  'T...........ccccccccccccc..........T',
  'rrrrrrrrrrrrccccccccccccc..........T',
  'T...........ccccccccccccc..........T',
  'T...........ccccccwcccccc..........T',
  'T.....SSSS..ccccccccccccc..WWWW....T',
  'T.....SSSS..ccccccccccccc..WWWW....T',
  'T..........................WWWW....T',
  'T........t.........................T',
  'T..................................T',
  'T...............................t..T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

export const BOARD_TILES = [ { tx: 17, ty: 8 }, { tx: 18, ty: 8 }, { tx: 19, ty: 8 } ];
export const WELL_TILE = { tx: 18, ty: 12 };
export const TESSA_DAY = 18;

// Where the player lands stepping out of each interior
export const FARM_SPAWN_FROM_HOUSE = { tx: 5, ty: 6 };   // just below the farmhouse door
export const TOWN_SPAWN_FROM_ARCADE = { tx: 29, ty: 9 };  // in front of the arcade

// Decorative garden fence (Paint Set recolors these). Top + sides frame the plots.
export const FENCE_TILES = [
  { tx: 11, ty: 7 }, { tx: 12, ty: 7 }, { tx: 13, ty: 7 }, { tx: 14, ty: 7 }, { tx: 15, ty: 7 }, { tx: 16, ty: 7 },
  { tx: 11, ty: 8 }, { tx: 11, ty: 9 }, { tx: 11, ty: 10 },
  { tx: 16, ty: 8 }, { tx: 16, ty: 9 }, { tx: 16, ty: 10 },
];
export const FENCE_COLORS = [
  { name: 'Red', color: 0xd9534f },
  { name: 'Blue', color: 0x5aa7d6 },
  { name: 'Green', color: 0x6fae4a },
  { name: 'Pink', color: 0xe8788a },
  { name: 'Sunny', color: 0xf2d450 },
  { name: 'Purple', color: 0x9a7ad6 },
];

// ---- interiors (cozy single rooms; camera centers, no scroll) ----
// Object: interactive (blocks its footprint, becomes a target). Decor: visual only
// unless it carries `block`. Coords are pixels; origin defaults to bottom-center.
const ROOM = [
  '################',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#......DD......#',
  '################',
];

export const INTERIORS = {
  farmhouse: {
    bg: '#2a2018', wallFrame: 'wall_in', floorFrame: 'floor_wood',
    map: ROOM, spawn: { tx: 7, ty: 7 },
    doors: [ { tx: 7, ty: 8 }, { tx: 8, ty: 8 } ],
    exit: { to: 'Farm', spawn: FARM_SPAWN_FROM_HOUSE },
    objects: [
      { type: 'bed', frame: 'bed', x: 112, y: 96,
        tiles: [ {tx:2,ty:1},{tx:3,ty:1},{tx:4,ty:1},{tx:2,ty:2},{tx:3,ty:2},{tx:4,ty:2} ],
        reach: [ {tx:2,ty:3},{tx:3,ty:3},{tx:4,ty:3} ], block: 'tiles' },
      { type: 'chest', frame: 'chest', x: 408, y: 80, scale: 1.4, needsFlag: 'chestPlaced',
        tiles: [ {tx:12,ty:1},{tx:13,ty:1},{tx:12,ty:2},{tx:13,ty:2} ],
        reach: [ {tx:12,ty:3},{tx:13,ty:3} ], block: 'tiles' },
      { type: 'journal', frame: 'table', x: 240, y: 160,
        tiles: [ {tx:7,ty:4},{tx:8,ty:4} ],
        reach: [ {tx:6,ty:4},{tx:9,ty:4},{tx:7,ty:5},{tx:8,ty:5} ], block: 'tiles' },
    ],
    decor: [
      { frame: 'rug', x: 240, y: 176, origin: [0.5, 0.5], depth: 1 },
      { frame: 'door_in', x: 240, y: 288, depth: 290 },
      { frame: 'window_in', x: 320, y: 36, depth: 36 },
      { frame: 'potplant', x: 456, y: 256, depth: 256 },
      { frame: 'potplant', x: 56, y: 248, depth: 248 },
    ],
  },
  arcade: {
    bg: '#1a1430', wallFrame: 'wall_arc', floorFrame: 'floor_arc',
    map: ROOM, spawn: { tx: 7, ty: 7 },
    doors: [ { tx: 7, ty: 8 }, { tx: 8, ty: 8 } ],
    exit: { to: 'Town', spawn: TOWN_SPAWN_FROM_ARCADE },
    objects: [
      { type: 'machine', frame: 'machine', x: 240, y: 168, scale: 1.7,
        tiles: [ {tx:7,ty:3},{tx:8,ty:3},{tx:7,ty:4},{tx:8,ty:4} ],
        reach: [ {tx:7,ty:5},{tx:8,ty:5} ], block: 'tiles' },
      { type: 'cabinet', frame: 'cabinet', x: 80, y: 168,
        tiles: [ {tx:2,ty:3},{tx:2,ty:4} ], reach: [ {tx:2,ty:5},{tx:3,ty:4} ], block: 'tiles' },
      { type: 'cabinet', frame: 'cabinet', x: 432, y: 168,
        tiles: [ {tx:13,ty:3},{tx:13,ty:4} ], reach: [ {tx:13,ty:5},{tx:12,ty:4} ], block: 'tiles' },
    ],
    decor: [
      { frame: 'door_in', x: 240, y: 288, depth: 290 },
      { frame: 'poster', x: 240, y: 40, depth: 40 },
    ],
  },
};

// Farm-name builder (no free text anywhere — COPPA + kindness safety)
export const NAME_FIRST = ['Sunny', 'Berry', 'Maple', 'Acorn', 'Clover', 'Willow'];
export const NAME_SECOND = ['Hollow', 'Patch', 'Creek', 'Meadow', 'Grove', 'Hill'];
export const FARM_ICONS = ['i_acorn', 'i_sun', 'i_berry', 'i_star', 'i_frog', 'i_mushroom', 'i_leaf', 'i_heart'];

// Picture-password tiles (chest)
export const CODE_TILES = ['i_mushroom', 'i_star', 'i_moon', 'i_frog', 'i_key', 'i_sun', 'i_leaf', 'i_acorn', 'i_berry'];
