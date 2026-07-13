// All art is original, drawn in code into ONE canvas atlas -> one texture,
// one draw batch. Art thinks on a 16-unit grid; C.PX scales units to pixels.

import { C } from '../config.js';

const PAL = {
  grass: '#7cb850', grassD: '#69a342', grassL: '#8fc75f',
  soil: '#a9744a', soilD: '#8a5d3b', soilWet: '#7a5236', soilWetD: '#684430',
  path: '#cfa86e', pathD: '#b8915a',
  wood: '#8a5a33', woodL: '#a97a4a', woodD: '#5e3a20',
  cream: '#f6e7c8', creamD: '#e2cda4',
  leaf: '#4e8f3a', leafD: '#3a7029', trunk: '#7a4f2a',
  water: '#5aa7d6', waterD: '#4287b5', waterL: '#8ecdee',
  roof: '#c75b4a', roofD: '#a84538', wall: '#e9c98f', wallD: '#d4b275',
  red: '#d9534f', orange: '#e8913a', yellow: '#f2d450', white: '#ffffff',
  skin: '#f2c89a', hat: '#e2b84e', hatD: '#c49a36', shirt: '#d2694f', pants: '#4a6fb5',
  gray: '#a8a298', grayD: '#6f6a62', ui: '#3a2a1a',
  pumpkinC: '#d97a2e', pumpkinD: '#b85e1e', pumpkinL: '#f0a050',
  btn: '#6fae4a', btnD: '#4c7d33', btnL: '#8cc55e',
};

export function buildAtlas(scene) {
  const S = C.PX;
  const SIZE = 1024;
  const tex = scene.textures.createCanvas('atlas', SIZE, SIZE);
  const ctx = tex.context;
  ctx.imageSmoothingEnabled = false;

  let cx = 0, cy = 0, rowH = 0;

  function frame(name, wu, hu, fn) {
    const w = wu * S, h = hu * S;
    if (cx + w > SIZE) { cx = 0; cy += rowH + 2; rowH = 0; }
    const ox = cx, oy = cy;
    const d = {
      r(color, x, y, ww = 1, hh = 1) {
        ctx.fillStyle = color;
        ctx.fillRect(ox + x * S, oy + y * S, ww * S, hh * S);
      },
      ell(color, ecx, ecy, rx, ry) {
        ctx.fillStyle = color;
        for (let yy = -Math.ceil(ry); yy <= Math.ceil(ry); yy++) {
          const t = yy / ry;
          if (Math.abs(t) > 1) continue;
          const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - t * t)));
          ctx.fillRect(ox + (ecx - half) * S, oy + (ecy + yy) * S, (half * 2 + 1) * S, S);
        }
      },
      alpha(a, fn2) { ctx.globalAlpha = a; fn2(); ctx.globalAlpha = 1; },
      cut(ecx, ecy, rx, ry) {
        ctx.globalCompositeOperation = 'destination-out';
        d.ell('#000', ecx, ecy, rx, ry);
        ctx.globalCompositeOperation = 'source-over';
      },
    };
    fn(d);
    tex.add(name, 0, ox, oy, w, h);
    cx += w + 2;
    rowH = Math.max(rowH, h);
  }

  // ---------- ground tiles (16x16u = 32px) ----------
  const grassBase = (d) => d.r(PAL.grass, 0, 0, 16, 16);

  frame('grass0', 16, 16, d => {
    grassBase(d);
    [[1, 1], [6, 4], [12, 2], [4, 8], [10, 9], [14, 13], [7, 14]].forEach(([x, y]) => d.r(PAL.grassD, x, y, 1, 2));
    [[3, 5], [12, 11]].forEach(([x, y]) => d.r(PAL.grassL, x, y, 1, 1));
  });
  frame('grass1', 16, 16, d => {
    grassBase(d);
    [[2, 3], [9, 1], [13, 6], [5, 10], [11, 12], [3, 14]].forEach(([x, y]) => d.r(PAL.grassD, x, y, 1, 2));
    [[7, 7], [14, 3]].forEach(([x, y]) => d.r(PAL.grassL, x, y, 1, 1));
  });
  frame('grass_fl0', 16, 16, d => {
    grassBase(d);
    [[2, 12], [11, 3]].forEach(([x, y]) => d.r(PAL.grassD, x, y, 1, 2));
    d.r(PAL.leaf, 5, 7, 1, 2); d.r(PAL.red, 4, 5, 3, 2); d.r(PAL.yellow, 5, 5, 1, 1);
    d.r(PAL.leaf, 11, 11, 1, 2); d.r('#e8788a', 10, 9, 3, 2); d.r(PAL.yellow, 11, 9, 1, 1);
  });
  frame('grass_fl1', 16, 16, d => {
    grassBase(d);
    [[13, 12], [3, 2]].forEach(([x, y]) => d.r(PAL.grassD, x, y, 1, 2));
    d.r(PAL.leaf, 8, 6, 1, 2); d.r(PAL.yellow, 7, 4, 3, 2); d.r(PAL.orange, 8, 4, 1, 1);
  });
  frame('path', 16, 16, d => {
    d.r(PAL.path, 0, 0, 16, 16);
    [[2, 2], [8, 5], [13, 3], [4, 9], [10, 12], [14, 10], [6, 14]].forEach(([x, y]) => d.r(PAL.pathD, x, y, 2, 1));
    [[5, 4], [12, 8]].forEach(([x, y]) => d.r('#dbb87e', x, y, 1, 1));
  });
  frame('treewall', 16, 16, d => {
    d.r(PAL.leafD, 0, 0, 16, 16);
    [[1, 2, 5, 4], [8, 1, 6, 5], [3, 8, 6, 5], [10, 9, 5, 4], [0, 12, 4, 3]].forEach(([x, y, w, h]) => d.r(PAL.leaf, x, y, w, h));
    [[3, 3], [10, 2], [5, 9], [12, 10]].forEach(([x, y]) => d.r('#5fa04a', x, y, 2, 1));
    d.r('#2e5a20', 0, 15, 16, 1);
  });

  // ---------- plot states (16x16u) ----------
  const roughBase = (d) => {
    grassBase(d);
    [[2, 3, 4, 3], [9, 2, 4, 3], [4, 9, 5, 4], [11, 10, 4, 3]].forEach(([x, y, w, h]) => d.r('#b98a5e', x, y, w, h));
    [[3, 4], [10, 3], [6, 11], [12, 11]].forEach(([x, y]) => d.r(PAL.soilD, x, y, 1, 1));
  };
  frame('plot_rough', 16, 16, roughBase);
  frame('plot_weed', 16, 16, d => {
    roughBase(d);
    [[3, 5], [8, 3], [11, 8], [5, 10]].forEach(([x, y]) => {
      d.r(PAL.leafD, x, y, 1, 4); d.r(PAL.leafD, x - 1, y + 1, 1, 2); d.r(PAL.leafD, x + 1, y + 1, 1, 2);
    });
  });
  frame('plot_rock', 16, 16, d => {
    roughBase(d);
    d.ell(PAL.grayD, 8, 9, 5, 4);
    d.ell(PAL.gray, 8, 8, 4, 3);
    d.r('#c4beb4', 6, 6, 2, 1); d.r(PAL.grayD, 9, 9, 2, 1);
  });
  frame('soil_dry', 16, 16, d => {
    d.r(PAL.soil, 0, 0, 16, 16);
    d.r(PAL.soilD, 0, 0, 16, 1); d.r(PAL.soilD, 0, 0, 1, 16);
    [3, 7, 11].forEach(y => d.r(PAL.soilD, 2, y, 12, 1));
    [[4, 5], [10, 9], [7, 13]].forEach(([x, y]) => d.r(PAL.soilD, x, y, 2, 1));
  });
  frame('soil_wet', 16, 16, d => {
    d.r(PAL.soilWet, 0, 0, 16, 16);
    d.r(PAL.soilWetD, 0, 0, 16, 1); d.r(PAL.soilWetD, 0, 0, 1, 16);
    [3, 7, 11].forEach(y => d.r(PAL.soilWetD, 2, y, 12, 1));
    [[5, 5], [11, 9]].forEach(([x, y]) => d.r('#8a6248', x, y, 2, 1));
  });
  frame('bramble', 16, 16, d => {
    grassBase(d);
    d.r(PAL.leafD, 1, 4, 14, 2); d.r(PAL.leafD, 2, 9, 13, 2); d.r(PAL.leafD, 4, 1, 2, 14); d.r(PAL.leafD, 10, 2, 2, 13);
    [[2, 4], [7, 9], [12, 5], [5, 12], [13, 11]].forEach(([x, y]) => d.r('#2e5a20', x, y, 2, 2));
    [[6, 3], [11, 10], [3, 10]].forEach(([x, y]) => d.r(PAL.creamD, x, y, 1, 1));
  });

  // ---------- big objects ----------
  frame('house', 64, 56, d => {
    d.r(PAL.roofD, 46, 2, 6, 10); d.r('#8a3a2e', 46, 2, 6, 2);
    for (let i = 0; i < 11; i++) {
      const half = Math.min(30, 6 + Math.round(i * 2.4));
      d.r(PAL.roof, 32 - half, 4 + i * 2, half * 2, 2);
    }
    d.r(PAL.roofD, 2, 24, 60, 2);
    d.r(PAL.wall, 4, 26, 56, 26);
    d.r(PAL.wallD, 4, 26, 56, 2);
    d.r(PAL.wallD, 58, 28, 2, 24);
    const win = (x) => {
      d.r(PAL.woodD, x, 32, 10, 9);
      d.r(PAL.waterL, x + 1, 33, 8, 7);
      d.r(PAL.woodD, x + 4, 33, 1, 7); d.r(PAL.woodD, x + 1, 36, 8, 1);
      d.r(PAL.cream, x - 1, 41, 12, 2);
      d.r(PAL.red, x + 1, 43, 2, 2); d.r(PAL.yellow, x + 4, 43, 2, 2); d.r('#e8788a', x + 7, 43, 2, 2);
    };
    win(10); win(44);
    d.r(PAL.woodD, 26, 34, 12, 18);
    d.r(PAL.wood, 27, 35, 10, 17);
    d.r(PAL.cream, 30, 38, 4, 4); d.r(PAL.woodD, 31, 39, 2, 2);
    d.r(PAL.creamD, 35, 44, 1, 2);
  });

  frame('stand', 32, 30, d => {
    d.r(PAL.woodD, 2, 8, 2, 18); d.r(PAL.woodD, 28, 8, 2, 18);
    d.r(PAL.wood, 2, 16, 28, 10);
    d.r(PAL.woodL, 2, 16, 28, 2);
    d.r(PAL.woodD, 2, 25, 28, 1);
    d.r(PAL.woodL, 6, 10, 9, 7); d.r(PAL.woodD, 6, 10, 9, 1);
    d.r(PAL.orange, 7, 12, 2, 2); d.r(PAL.red, 10, 12, 2, 2); d.r(PAL.yellow, 8, 14, 2, 2); d.r(PAL.pumpkinC, 11, 14, 2, 2);
    d.r(PAL.hatD, 20, 10, 6, 6); d.r(PAL.yellow, 21, 11, 4, 4); d.r(PAL.hatD, 22, 12, 2, 2);
    for (let i = 0; i < 8; i++) {
      const col = i % 2 ? PAL.cream : PAL.roof;
      d.r(col, i * 4, 0, 4, 6);
      d.r(col, i * 4 + 1, 6, 2, 1);
    }
  });

  frame('sign', 12, 16, d => {
    d.r(PAL.woodD, 5, 7, 2, 9);
    d.r(PAL.woodD, 0, 0, 12, 8);
    d.r(PAL.cream, 1, 1, 10, 6);
    d.r(PAL.wood, 2, 3, 5, 2);
    d.r(PAL.wood, 7, 2, 1, 1); d.r(PAL.wood, 7, 5, 1, 1); d.r(PAL.wood, 7, 3, 3, 2);
  });

  frame('tree', 24, 30, d => {
    d.r(PAL.trunk, 10, 18, 4, 11);
    d.r('#5e3a20', 10, 18, 1, 11);
    d.r(PAL.trunk, 8, 27, 8, 2);
    d.ell(PAL.leafD, 12, 11, 11, 9);
    d.ell(PAL.leaf, 12, 9, 9, 7);
    [[7, 5, 2, 1], [15, 8, 2, 1], [10, 12, 2, 1]].forEach(([x, y, w, h]) => d.r(PAL.grassL, x, y, w, h));
  });

  frame('pond', 64, 40, d => {
    d.ell('#8a6a4a', 32, 20, 31, 18);
    d.ell(PAL.waterD, 32, 20, 29, 16);
    d.ell(PAL.water, 32, 19, 27, 14);
    d.alpha(0.6, () => {
      d.r(PAL.waterL, 14, 12, 7, 1); d.r(PAL.waterL, 38, 24, 9, 1); d.r(PAL.waterL, 22, 28, 5, 1); d.r(PAL.waterL, 44, 14, 5, 1);
    });
    d.r(PAL.leaf, 44, 10, 5, 3); d.r(PAL.leafD, 44, 10, 2, 1);
    d.r('#e8788a', 46, 8, 2, 2); d.r(PAL.yellow, 46, 8, 1, 1);
    d.r(PAL.leaf, 16, 24, 4, 3);
  });

  // ---------- player (16x24u = 32x48) ----------
  // step: 0 = both feet down · 1 = left stride · 2 = right stride
  // The walk cycle plays 0,1,0,2 so one new pose buys a full 4-frame walk.
  function playerDown(d, step) {
    const armY = step ? 13 : 12;
    d.r(PAL.hat, 4, 1, 8, 3); d.r(PAL.hatD, 4, 3, 8, 1); d.r(PAL.hat, 2, 4, 12, 2);
    d.r(PAL.skin, 5, 6, 6, 5);
    d.r(PAL.ui, 6, 8, 1, 1); d.r(PAL.ui, 9, 8, 1, 1);
    d.r('#eda87e', 5, 9, 1, 1); d.r('#eda87e', 10, 9, 1, 1);
    d.r(PAL.shirt, 4, 11, 8, 5);
    const armL = step === 1 ? armY + 1 : armY;
    const armR = step === 2 ? armY + 1 : armY;
    d.r(PAL.shirt, 2, armL, 2, 3); d.r(PAL.skin, 2, armL + 3, 2, 1);
    d.r(PAL.shirt, 12, armR, 2, 3); d.r(PAL.skin, 12, armR + 3, 2, 1);
    d.r(PAL.pants, 4, 16, 8, 3);
    const leg = (x, lifted) => {
      if (lifted) { d.r(PAL.pants, x, 19, 2, 2); d.r(PAL.woodD, x, 21, 2, 1); }
      else { d.r(PAL.pants, x, 19, 2, 3); d.r(PAL.woodD, x, 22, 2, 1); }
    };
    leg(5, step === 1);
    leg(9, step === 2);
  }
  function playerUp(d, step) {
    const armY = step ? 13 : 12;
    d.r(PAL.hat, 4, 1, 8, 4); d.r(PAL.hatD, 4, 4, 8, 1); d.r(PAL.hat, 2, 4, 12, 2);
    d.r(PAL.skin, 5, 6, 6, 5); d.r('#caa176', 5, 6, 6, 2);
    d.r(PAL.shirt, 4, 11, 8, 5);
    d.r(PAL.shirt, 2, armY, 2, 3); d.r(PAL.shirt, 12, armY, 2, 3);
    d.r(PAL.pants, 4, 16, 8, 3);
    const leg = (x, lifted) => {
      if (lifted) { d.r(PAL.pants, x, 19, 2, 2); d.r(PAL.woodD, x, 21, 2, 1); }
      else { d.r(PAL.pants, x, 19, 2, 3); d.r(PAL.woodD, x, 22, 2, 1); }
    };
    leg(5, step === 2);
    leg(9, step === 1);
  }
  function playerSide(d, step) {
    d.r(PAL.hat, 4, 1, 8, 3); d.r(PAL.hatD, 4, 3, 8, 1); d.r(PAL.hat, 4, 4, 11, 2);
    d.r(PAL.skin, 6, 6, 6, 5);
    d.r(PAL.ui, 10, 8, 1, 1);
    d.r(PAL.shirt, 5, 11, 7, 5);
    const armX = step === 2 ? 6 : 7;
    const armY = step ? 13 : 12;
    d.r(PAL.shirt, armX, armY, 2, 3); d.r(PAL.skin, armX, armY + 3, 2, 1);
    d.r(PAL.pants, 5, 16, 7, 3);
    const leg = (x, lifted) => {
      if (lifted) { d.r(PAL.pants, x, 19, 2, 2); d.r(PAL.woodD, x, 21, 2, 1); }
      else { d.r(PAL.pants, x, 19, 2, 3); d.r(PAL.woodD, x, 22, 2, 1); }
    };
    leg(6, step === 2);
    leg(9, step === 1);
  }
  [0, 1, 2].forEach(s => {
    frame(`player_down_${s}`, 16, 24, d => playerDown(d, s));
    frame(`player_up_${s}`, 16, 24, d => playerUp(d, s));
    frame(`player_side_${s}`, 16, 24, d => playerSide(d, s));
  });

  // ---------- crops (16x16u, plant sits low in frame) ----------
  const sprout = (d) => {
    d.r(PAL.leafD, 7, 12, 2, 2);
    d.r(PAL.leaf, 5, 9, 2, 2); d.r(PAL.leaf, 9, 9, 2, 2); d.r(PAL.leaf, 7, 10, 2, 2);
  };
  frame('bean_0', 16, 16, sprout);
  frame('bean_1', 16, 16, d => {
    d.ell(PAL.leaf, 8, 11, 4, 3); d.r(PAL.leafD, 7, 13, 2, 1); d.r(PAL.grassL, 6, 9, 1, 1);
  });
  frame('bean_2', 16, 16, d => {
    d.ell(PAL.leafD, 8, 10, 5, 4); d.ell(PAL.leaf, 8, 9, 4, 3);
    [[5, 11], [10, 10], [7, 12]].forEach(([x, y]) => d.r(PAL.grassL, x, y, 1, 2));
  });
  frame('bean_3', 16, 16, d => {
    d.ell(PAL.leafD, 8, 9, 6, 5); d.ell(PAL.leaf, 8, 8, 5, 4);
    [[4, 10], [6, 12], [10, 9], [11, 11], [8, 13]].forEach(([x, y]) => d.r('#2e5a20', x, y, 1, 2));
    d.r(PAL.grassL, 6, 6, 2, 1);
  });
  frame('carrot_0', 16, 16, sprout);
  frame('carrot_1', 16, 16, d => {
    [[5, 9, 5], [8, 8, 6], [11, 9, 5]].forEach(([x, y, h]) => d.r(PAL.leaf, x, y, 1, h));
    d.r(PAL.leafD, 5, 13, 7, 1);
  });
  frame('carrot_2', 16, 16, d => {
    [[4, 7, 7], [6, 5, 9], [9, 5, 9], [11, 7, 7]].forEach(([x, y, h]) => d.r(PAL.leaf, x, y, 1, h));
    [[5, 8, 4], [10, 8, 4]].forEach(([x, y, h]) => d.r(PAL.leafD, x, y, 1, h));
    d.r(PAL.leafD, 4, 13, 8, 1);
  });
  frame('carrot_3', 16, 16, d => {
    [[4, 6, 6], [6, 4, 8], [9, 4, 8], [11, 6, 6]].forEach(([x, y, h]) => d.r(PAL.leaf, x, y, 1, h));
    d.r(PAL.orange, 6, 12, 4, 2); d.r(PAL.pumpkinL, 6, 12, 4, 1);
  });
  frame('berry_0', 16, 16, sprout);
  frame('berry_1', 16, 16, d => {
    d.ell(PAL.leaf, 8, 11, 4, 3); d.r(PAL.leafD, 7, 13, 2, 1);
  });
  frame('berry_2', 16, 16, d => {
    d.ell(PAL.leafD, 8, 10, 5, 4); d.ell(PAL.leaf, 8, 9, 4, 3);
    [[6, 9], [10, 10], [8, 11]].forEach(([x, y]) => d.r(PAL.white, x, y, 1, 1));
  });
  frame('berry_3', 16, 16, d => {
    d.ell(PAL.leafD, 8, 9, 6, 5); d.ell(PAL.leaf, 8, 8, 5, 4);
    [[5, 9], [9, 7], [11, 10], [7, 11], [8, 9]].forEach(([x, y]) => {
      d.r(PAL.red, x, y, 2, 2); d.r('#f08a86', x, y, 1, 1);
    });
  });
  frame('pumpkin_0', 16, 16, sprout);
  frame('pumpkin_1', 16, 16, d => {
    d.r(PAL.leafD, 4, 12, 8, 1); d.r(PAL.leafD, 10, 10, 1, 3);
    d.r(PAL.leaf, 4, 9, 3, 3); d.r(PAL.leaf, 11, 8, 2, 2);
  });
  frame('pumpkin_2', 16, 16, d => {
    d.r(PAL.leafD, 3, 13, 10, 1);
    d.ell('#6fae4a', 8, 11, 3, 2);
    d.r('#4c7d33', 8, 9, 1, 3);
    d.r(PAL.leafD, 7, 8, 2, 1);
  });
  frame('pumpkin_3', 16, 16, d => {
    d.ell(PAL.pumpkinD, 8, 10, 6, 4);
    d.ell(PAL.pumpkinC, 8, 10, 5, 3);
    d.r(PAL.pumpkinD, 5, 8, 1, 5); d.r(PAL.pumpkinD, 8, 7, 1, 7); d.r(PAL.pumpkinD, 11, 8, 1, 5);
    d.r(PAL.pumpkinL, 6, 8, 1, 2);
    d.r(PAL.leafD, 7, 5, 2, 2);
  });
  frame('sunflower_0', 16, 16, sprout);
  frame('sunflower_1', 16, 16, d => {
    d.r(PAL.leaf, 7, 8, 2, 6); d.r(PAL.leaf, 5, 10, 2, 2); d.r(PAL.leaf, 9, 11, 2, 2);
  });
  frame('sunflower_2', 16, 16, d => {
    d.r(PAL.leaf, 7, 7, 2, 7); d.r(PAL.leaf, 5, 10, 2, 2); d.r(PAL.leaf, 9, 11, 2, 2);
    d.ell('#9ac24e', 8, 5, 2, 2);
  });
  frame('sunflower_3', 16, 16, d => {
    d.r(PAL.leaf, 7, 9, 2, 5); d.r(PAL.leaf, 5, 11, 2, 2); d.r(PAL.leaf, 9, 12, 2, 2);
    d.ell(PAL.yellow, 8, 5, 4, 4);
    d.ell(PAL.wood, 8, 5, 2, 2);
  });
  frame('crop_wither', 16, 16, d => {
    d.r(PAL.grayD, 7, 9, 1, 5); d.r(PAL.grayD, 6, 8, 2, 1);
    d.r(PAL.gray, 4, 10, 2, 1); d.r(PAL.gray, 10, 11, 2, 1); d.r(PAL.gray, 8, 7, 2, 1);
    d.r('#8a7a62', 5, 13, 1, 1); d.r('#8a7a62', 10, 13, 1, 1);
  });

  // ---------- icons (12x12u = 24px) ----------
  frame('i_acorn', 12, 12, d => {
    d.r(PAL.woodD, 5, 0, 2, 2);
    d.ell(PAL.woodD, 6, 4, 4, 2);
    d.ell(PAL.wood, 6, 7, 3, 3);
    d.r(PAL.woodD, 5, 10, 2, 1);
    d.r(PAL.woodL, 4, 6, 1, 2);
  });
  frame('i_acorn_g', 12, 12, d => {
    d.r(PAL.grayD, 5, 0, 2, 2);
    d.ell(PAL.grayD, 6, 4, 4, 2);
    d.ell('#c4beb4', 6, 7, 3, 3);
    d.r(PAL.grayD, 5, 10, 2, 1);
  });
  frame('i_coin', 12, 12, d => {
    d.ell(PAL.hatD, 6, 6, 5, 5);
    d.ell(PAL.yellow, 6, 6, 4, 4);
    d.r(PAL.hatD, 5, 4, 2, 4); d.r(PAL.hatD, 4, 5, 4, 2);
    d.r(PAL.white, 3, 3, 1, 1);
  });
  frame('i_drop', 12, 12, d => {
    d.r(PAL.water, 5, 2, 2, 2); d.r(PAL.water, 4, 4, 4, 2);
    d.ell(PAL.water, 6, 7, 3, 3);
    d.r(PAL.waterL, 4, 7, 1, 2);
  });
  frame('i_basket', 12, 12, d => {
    d.r(PAL.woodD, 3, 2, 1, 3); d.r(PAL.woodD, 8, 2, 1, 3); d.r(PAL.woodD, 3, 2, 6, 1);
    d.r(PAL.wood, 2, 5, 8, 5);
    d.r(PAL.woodL, 2, 5, 8, 1);
    d.r(PAL.woodD, 2, 7, 8, 1);
  });
  frame('i_gear', 12, 12, d => {
    d.r(PAL.grayD, 5, 0, 2, 3); d.r(PAL.grayD, 5, 9, 2, 3); d.r(PAL.grayD, 0, 5, 3, 2); d.r(PAL.grayD, 9, 5, 3, 2);
    d.ell(PAL.grayD, 6, 6, 4, 4);
    d.r(PAL.cream, 5, 5, 2, 2);
  });
  frame('i_snd', 12, 12, d => {
    d.r(PAL.ui, 1, 4, 3, 4);
    d.r(PAL.ui, 4, 3, 2, 6); d.r(PAL.ui, 6, 2, 1, 8);
    d.r(PAL.water, 9, 3, 1, 2); d.r(PAL.water, 10, 5, 1, 2); d.r(PAL.water, 9, 7, 1, 2);
  });
  frame('i_mute', 12, 12, d => {
    d.r(PAL.ui, 1, 4, 3, 4);
    d.r(PAL.ui, 4, 3, 2, 6); d.r(PAL.ui, 6, 2, 1, 8);
    [[8, 3], [9, 4], [10, 5], [9, 6], [8, 7]].forEach(([x, y]) => d.r(PAL.red, x, y, 1, 1));
    [[10, 3], [8, 5], [10, 7]].forEach(([x, y]) => d.r(PAL.red, x, y, 1, 1));
  });
  frame('i_zzz', 12, 12, d => {
    d.r(PAL.ui, 0, 6, 5, 1); d.r(PAL.ui, 0, 10, 5, 1); d.r(PAL.ui, 3, 7, 1, 1); d.r(PAL.ui, 2, 8, 1, 1); d.r(PAL.ui, 1, 9, 1, 1);
    d.r(PAL.ui, 6, 3, 4, 1); d.r(PAL.ui, 6, 6, 4, 1); d.r(PAL.ui, 8, 4, 1, 1); d.r(PAL.ui, 7, 5, 1, 1);
    d.r(PAL.ui, 9, 0, 3, 1); d.r(PAL.ui, 9, 2, 3, 1); d.r(PAL.ui, 10, 1, 1, 1);
  });
  frame('i_x', 12, 12, d => {
    for (let i = 0; i < 8; i++) {
      d.r(PAL.red, 2 + i, 2 + i, 2, 2);
      d.r(PAL.red, 8 - i, 2 + i, 2, 2);
    }
  });
  frame('i_check', 12, 12, d => {
    [[1, 6], [2, 7], [3, 8], [4, 7], [5, 6], [6, 5], [7, 4], [8, 3], [9, 2]].forEach(([x, y]) => d.r('#4c9a3a', x, y, 2, 2));
  });
  frame('i_star', 12, 12, d => {
    d.r(PAL.yellow, 5, 1, 2, 10);
    d.r(PAL.yellow, 1, 5, 10, 2);
    d.ell(PAL.yellow, 6, 6, 3, 3);
    d.r(PAL.white, 5, 4, 1, 1);
  });
  frame('i_bang', 12, 12, d => {
    d.ell(PAL.white, 6, 6, 5, 5);
    d.r(PAL.orange, 5, 3, 2, 4);
    d.r(PAL.orange, 5, 8, 2, 2);
  });
  frame('i_heart', 12, 12, d => {
    d.ell(PAL.red, 4, 4, 2, 2); d.ell(PAL.red, 8, 4, 2, 2);
    d.r(PAL.red, 2, 4, 8, 3);
    d.r(PAL.red, 3, 7, 6, 1); d.r(PAL.red, 4, 8, 4, 1); d.r(PAL.red, 5, 9, 2, 1);
    d.r('#f08a86', 3, 3, 1, 1);
  });
  frame('i_leaf', 12, 12, d => {
    d.ell(PAL.leaf, 6, 6, 4, 3);
    d.r(PAL.leafD, 4, 7, 1, 1); d.r(PAL.leafD, 6, 6, 1, 1); d.r(PAL.leafD, 8, 5, 1, 1);
    d.r(PAL.trunk, 9, 3, 1, 2);
  });
  const seedPacket = (band) => (d) => {
    d.r(PAL.woodD, 2, 0, 8, 12);
    d.r(PAL.cream, 3, 1, 6, 10);
    d.r(PAL.creamD, 3, 1, 6, 2);
    d.r(band, 3, 5, 6, 3);
    d.r(PAL.woodD, 5, 9, 2, 1);
  };
  frame('i_seed_bean', 12, 12, seedPacket(PAL.leaf));
  frame('i_seed_carrot', 12, 12, seedPacket(PAL.orange));
  frame('i_seed_berry', 12, 12, seedPacket(PAL.red));
  frame('i_seed_pumpkin', 12, 12, seedPacket(PAL.pumpkinC));

  frame('i_owl', 14, 14, d => {
    d.r(PAL.woodD, 2, 1, 2, 2); d.r(PAL.woodD, 10, 1, 2, 2);
    d.ell(PAL.wood, 7, 7, 6, 6);
    d.ell(PAL.cream, 7, 9, 3, 3);
    d.ell(PAL.white, 4, 5, 2, 2); d.ell(PAL.white, 10, 5, 2, 2);
    d.r(PAL.ui, 4, 5, 1, 1); d.r(PAL.ui, 10, 5, 1, 1);
    d.r(PAL.hatD, 2, 2, 3, 1); d.r(PAL.hatD, 9, 2, 3, 1);
    d.r(PAL.orange, 6, 7, 2, 2);
    d.r(PAL.orange, 4, 13, 2, 1); d.r(PAL.orange, 8, 13, 2, 1);
  });

  frame('ring', 18, 18, d => {
    d.r(PAL.white, 1, 1, 16, 1); d.r(PAL.white, 1, 16, 16, 1);
    d.r(PAL.white, 1, 1, 1, 16); d.r(PAL.white, 16, 1, 1, 16);
    d.r(PAL.yellow, 0, 0, 4, 2); d.r(PAL.yellow, 0, 0, 2, 4);
    d.r(PAL.yellow, 14, 0, 4, 2); d.r(PAL.yellow, 16, 0, 2, 4);
    d.r(PAL.yellow, 0, 16, 4, 2); d.r(PAL.yellow, 0, 14, 2, 4);
    d.r(PAL.yellow, 14, 16, 4, 2); d.r(PAL.yellow, 16, 14, 2, 4);
  });

  frame('shadow', 14, 6, d => {
    d.alpha(0.25, () => d.ell('#000000', 7, 3, 6, 2));
  });

  // ---------- UI nine-slices ----------
  frame('panel', 24, 24, d => {
    d.r(PAL.cream, 1, 1, 22, 22);
    d.r(PAL.woodD, 1, 0, 22, 1); d.r(PAL.woodD, 1, 23, 22, 1);
    d.r(PAL.woodD, 0, 1, 1, 22); d.r(PAL.woodD, 23, 1, 1, 22);
    d.r(PAL.woodD, 1, 1, 1, 1); d.r(PAL.woodD, 22, 1, 1, 1);
    d.r(PAL.woodD, 1, 22, 1, 1); d.r(PAL.woodD, 22, 22, 1, 1);
    d.r(PAL.creamD, 2, 21, 20, 1);
  });
  const button = (base, dark, light) => (d) => {
    d.r(base, 1, 1, 22, 10);
    d.r(dark, 1, 0, 22, 1); d.r(dark, 1, 11, 22, 1);
    d.r(dark, 0, 1, 1, 10); d.r(dark, 23, 1, 1, 10);
    d.r(light, 2, 1, 20, 1);
    d.r(dark, 2, 10, 20, 1);
  };
  frame('btn', 24, 12, button(PAL.btn, PAL.btnD, PAL.btnL));
  frame('btn_cream', 24, 12, button(PAL.cream, PAL.woodD, '#fff8e4'));
  frame('btn_gray', 24, 12, button('#b8b2a8', PAL.grayD, '#cac4ba'));
  frame('btn_red', 24, 12, button('#c96a5a', '#9a4a3c', '#dd8a78'));

  // ---------- town ground ----------
  frame('cobble', 16, 16, d => {
    d.r('#d8cdb2', 0, 0, 16, 16);
    [[0, 0], [8, 0], [4, 4], [12, 4], [0, 8], [8, 8], [4, 12], [12, 12]].forEach(([x, y]) => {
      d.r('#cabfa2', x, y, 7, 3);
      d.r('#e2d8bf', x, y, 7, 1);
    });
    d.r('#bfb296', 3, 6, 1, 1); d.r('#bfb296', 11, 14, 1, 1);
  });

  // ---------- interiors ----------
  frame('floor_wood', 16, 16, d => {
    d.r('#b58a5a', 0, 0, 16, 16);
    d.r('#a87b4c', 0, 0, 16, 1); d.r('#a87b4c', 0, 8, 16, 1);
    d.r('#c49a68', 0, 1, 16, 1); d.r('#c49a68', 0, 9, 16, 1);
    d.r('#a87b4c', 3, 4, 2, 1); d.r('#a87b4c', 11, 12, 2, 1);
  });
  frame('wall_in', 16, 16, d => {
    d.r('#e8d2a8', 0, 0, 16, 16);
    d.r('#dcc395', 0, 0, 16, 2);
    d.r('#cdb583', 0, 6, 16, 1); d.r('#cdb583', 0, 12, 16, 1);
  });
  frame('floor_arc', 16, 16, d => {
    d.r('#2e2742', 0, 0, 16, 16);
    d.r('#3a3252', 0, 0, 16, 1); d.r('#3a3252', 8, 0, 1, 16);
    d.r('#4a4068', 2, 2, 2, 2); d.r('#4a4068', 10, 10, 2, 2);
  });
  frame('wall_arc', 16, 16, d => {
    d.r('#3f3456', 0, 0, 16, 16);
    d.r('#4f4470', 0, 0, 16, 2);
    d.r('#7fe8e8', 0, 13, 16, 1);
  });
  frame('rug', 48, 32, d => {
    d.r('#b5544a', 0, 0, 48, 32);
    d.r('#9a3f38', 3, 3, 42, 26);
    d.r('#d98a78', 7, 6, 34, 20);
    d.r('#b5544a', 14, 11, 20, 10);
    d.r('#e8c98f', 19, 13, 10, 6);
  });
  frame('bed', 40, 28, d => {
    d.r(PAL.woodD, 1, 6, 38, 21);
    d.r(PAL.wood, 2, 8, 36, 18);
    d.r('#f4ecd8', 4, 10, 12, 12);
    d.r('#e2d6ba', 4, 10, 12, 2);
    d.r('#7fae5a', 17, 9, 21, 17);
    d.r('#6a9648', 17, 9, 21, 2);
    d.r('#8fc46a', 21, 13, 4, 11);
    d.r(PAL.woodD, 1, 2, 4, 24);
    d.r(PAL.woodD, 35, 4, 4, 22);
  });
  frame('table', 28, 22, d => {
    d.r(PAL.woodD, 2, 9, 24, 5);
    d.r(PAL.wood, 2, 9, 24, 2);
    d.r(PAL.woodD, 4, 14, 3, 8);
    d.r(PAL.woodD, 21, 14, 3, 8);
    d.r('#7a4f2a', 9, 3, 12, 6);
    d.r('#f4ecd8', 10, 4, 4, 4); d.r('#f4ecd8', 16, 4, 4, 4);
    d.r('#d8cdb2', 14, 3, 2, 6);
  });
  frame('window_in', 26, 22, d => {
    d.r(PAL.woodD, 0, 0, 26, 22);
    d.r('#aee0f4', 3, 3, 20, 16);
    d.r('#7fae5a', 3, 14, 20, 5);
    d.r(PAL.yellow, 17, 5, 4, 4);
    d.r(PAL.woodD, 12, 3, 2, 16);
    d.r(PAL.woodD, 3, 10, 20, 2);
  });
  frame('potplant', 18, 26, d => {
    d.r('#c96a4a', 4, 18, 9, 8);
    d.r('#b5543a', 4, 18, 9, 2);
    d.r(PAL.leafD, 7, 6, 2, 13);
    d.ell(PAL.leaf, 6, 8, 4, 4);
    d.ell(PAL.leaf, 12, 6, 4, 5);
    d.ell(PAL.leaf, 9, 12, 4, 4);
    d.r('#e8788a', 11, 5, 2, 2);
  });
  frame('door_in', 24, 28, d => {
    d.r(PAL.woodD, 0, 0, 24, 28);
    d.r(PAL.wood, 2, 2, 20, 26);
    d.r(PAL.woodD, 11, 2, 2, 26);
    d.r(PAL.woodL, 3, 3, 8, 9); d.r(PAL.woodL, 13, 3, 8, 9);
    d.r(PAL.hatD, 4, 15, 3, 3);
  });
  frame('cabinet', 24, 34, d => {
    d.r('#241d33', 1, 2, 22, 31);
    d.r('#5a4a78', 2, 3, 20, 29);
    d.r(PAL.cream, 3, 0, 18, 3);
    d.r('#2a2138', 5, 6, 14, 10);
    d.r('#f2d450', 6, 7, 12, 8);
    d.r('#e8913a', 7, 8, 10, 3);
    d.r('#3f3456', 4, 19, 16, 7);
    d.r(PAL.red, 6, 21, 3, 3); d.r('#7fe8e8', 13, 21, 3, 3);
    d.r('#241d33', 3, 32, 18, 2);
  });
  frame('poster', 26, 20, d => {
    d.r(PAL.cream, 0, 0, 26, 20);
    d.r('#5a4a78', 0, 0, 26, 2);
    d.r('#7fe8e8', 3, 4, 20, 9);
    d.r('#f8e88a', 11, 7, 4, 3);
    d.r(PAL.ui, 4, 15, 18, 1);
    d.r(PAL.ui, 7, 17, 12, 1);
  });
  // light-gray post so Paint Set tints read cleanly
  frame('fencepost_paint', 8, 14, d => {
    d.r('#d8d2c8', 2, 2, 4, 12);
    d.r('#ffffff', 2, 2, 4, 1);
    d.r('#bdb7ad', 5, 3, 1, 11);
    d.r('#bdb7ad', 1, 0, 6, 2);
  });

  // ---------- the neighbors ----------
  // Each has a base pose and a `_b` blink/gesture frame for idle life.
  function drawPip(d, alt) {
    d.r('#f4f0e6', 5, 0, 2, 7); d.r('#f0b8c4', 5, 1, 1, 4);
    if (alt) {
      d.r('#f4f0e6', 9, 0, 2, 7); d.r('#f0b8c4', 9, 1, 1, 4);   // bent ear perks up
    } else {
      d.r('#f4f0e6', 9, 1, 2, 5); d.r('#f4f0e6', 10, 0, 2, 2); d.r('#f0b8c4', 10, 2, 1, 3);
    }
    d.ell('#f4f0e6', 8, 9, 4, 4);
    if (alt) { d.r(PAL.ui, 5, 8, 2, 1); d.r(PAL.ui, 9, 8, 2, 1); }
    else { d.r(PAL.ui, 6, 8, 1, 1); d.r(PAL.ui, 10, 8, 1, 1); }
    d.r('#f0b8c4', 8, 10, 1, 1);
    d.r('#f4f0e6', 5, 13, 7, 6);
    d.r(PAL.leaf, 5, 13, 7, 2);
    d.r('#f4f0e6', 3, 14, 2, 3); d.r('#f4f0e6', 12, 14, 2, 3);
    d.r('#e2dcd0', 5, 19, 3, 2); d.r('#e2dcd0', 9, 19, 3, 2);
  }
  function drawMarigold(d, alt) {
    d.r(PAL.woodD, 3, 1, 2, 3); d.r(PAL.woodD, 11, 1, 2, 3);
    d.ell('#d9aa6e', 8, 7, 4, 4);
    d.r('#ecd2ac', 6, 8, 5, 3);
    if (alt) { d.r(PAL.ui, 5, 6, 2, 1); d.r(PAL.ui, 9, 6, 2, 1); }
    else { d.r(PAL.ui, 6, 6, 1, 1); d.r(PAL.ui, 10, 6, 1, 1); }
    d.r(PAL.ui, 8, 9, 1, 1);
    d.r(PAL.yellow, 11, 3, 3, 3); d.r(PAL.orange, 12, 4, 1, 1);
    d.r('#d9aa6e', 5, 12, 7, 7);
    d.r(PAL.cream, 7, 12, 3, 5);
    d.r('#d9aa6e', 3, 13, 2, 3); d.r('#d9aa6e', 12, 13, 2, 3);
    d.r('#b8884a', 5, 19, 3, 4); d.r('#b8884a', 9, 19, 3, 4);
  }
  function drawSly(d, alt) {
    d.ell('#2e2a33', 7, 7, 5, 4);
    d.ell('#2e2a33', 4, 4, 3, 3);
    d.r('#1e1b24', 8, alt ? 3 : 5, 4, 3);                        // wing lifts
    if (alt) { d.r(PAL.yellow, 3, 4, 2, 1); }                    // sly squint
    else { d.r(PAL.yellow, 3, 3, 2, 2); d.r(PAL.ui, 3, 3, 1, 1); }
    d.r(PAL.hatD, 0, 4, 3, 2);
    d.r('#1e1b24', 10, 4, 4, 2);
    d.r(PAL.hatD, 5, 11, 2, 1); d.r(PAL.hatD, 8, 11, 2, 1);
  }
  function drawBram(d, alt) {
    d.r('#8d8a94', 4, 1, 2, 2); d.r('#8d8a94', 10, 1, 2, 2);
    d.ell('#f0ede4', 8, 7, 4, 4);
    d.r('#3a3640', 5, 3, 2, 6); d.r('#3a3640', 9, 3, 2, 6);
    if (alt) { d.r(PAL.ui, 4, 7, 2, 1); d.r(PAL.ui, 10, 7, 2, 1); }
    else { d.r(PAL.ui, 5, 7, 1, 1); d.r(PAL.ui, 10, 7, 1, 1); }
    d.r('#3a3640', 7, 9, 2, 2);
    d.r('#8d8a94', 5, 12, 7, 7);
    d.r(PAL.wood, 5, 14, 7, 5); d.r(PAL.woodD, 5, 14, 7, 1);
    d.r('#8d8a94', 3, 13, 2, 3); d.r('#8d8a94', 12, 13, 2, 3);
    d.r('#6f6c76', 5, 19, 3, 2); d.r('#6f6c76', 9, 19, 3, 2);
  }
  function drawTessa(d, alt) {
    d.r('#e08a3c', 3, 0, 3, 4); d.r('#5e3a20', 3, 0, 2, 2);
    d.r('#e08a3c', 10, 0, 3, 4); d.r('#5e3a20', 11, 0, 2, 2);
    d.ell('#e08a3c', 8, 7, 4, 4);
    d.r('#fff4e2', 6, 8, 5, 3);
    if (alt) { d.r(PAL.ui, 5, 6, 2, 1); d.r(PAL.ui, 9, 6, 2, 1); }
    else { d.r(PAL.ui, 6, 6, 1, 1); d.r(PAL.ui, 10, 6, 1, 1); }
    d.r(PAL.ui, 8, 9, 1, 1);
    d.r(PAL.yellow, 3, 8, 1, 1);
    d.r('#e08a3c', 5, 12, 7, 7);
    d.r('#fff4e2', 7, 12, 3, 4);
    if (alt) { d.ell('#e08a3c', 13, 14, 2, 5); d.r('#fff4e2', 12, 10, 3, 2); }  // tail flick
    else { d.ell('#e08a3c', 13, 16, 2, 6); d.r('#fff4e2', 12, 20, 3, 2); }
    d.r('#c2702a', 5, 19, 3, 4); d.r('#c2702a', 9, 19, 3, 4);
  }
  frame('npc_pip', 16, 22, d => drawPip(d, false));
  frame('npc_pip_b', 16, 22, d => drawPip(d, true));
  frame('npc_marigold', 16, 24, d => drawMarigold(d, false));
  frame('npc_marigold_b', 16, 24, d => drawMarigold(d, true));
  frame('npc_sly', 14, 12, d => drawSly(d, false));
  frame('npc_sly_b', 14, 12, d => drawSly(d, true));
  frame('npc_bram', 16, 22, d => drawBram(d, false));
  frame('npc_bram_b', 16, 22, d => drawBram(d, true));
  frame('npc_tessa', 16, 24, d => drawTessa(d, false));
  frame('npc_tessa_b', 16, 24, d => drawTessa(d, true));

  // ---------- town buildings ----------
  frame('townhall', 96, 72, d => {
    d.r(PAL.woodD, 47, 0, 2, 8); d.r(PAL.red, 49, 0, 8, 4);
    for (let i = 0; i < 12; i++) {
      const half = Math.min(46, 10 + Math.round(i * 3.4));
      d.r(PAL.roof, 48 - half, 4 + i * 2, half * 2, 2);
    }
    d.r(PAL.roofD, 2, 26, 92, 3);
    d.r('#e9dcc0', 6, 29, 84, 39);
    d.r('#d4c4a0', 6, 29, 84, 2);
    const col = (x) => { d.r(PAL.cream, x, 32, 5, 36); d.r('#d4c4a0', x + 4, 32, 1, 36); };
    col(10); col(81);
    const win = (x) => {
      d.r(PAL.woodD, x, 36, 12, 11); d.r(PAL.waterL, x + 1, 37, 10, 9);
      d.r(PAL.woodD, x + 5, 37, 1, 9); d.r(PAL.woodD, x + 1, 41, 10, 1);
    };
    win(20); win(64);
    d.r(PAL.woodD, 39, 40, 18, 28);
    d.r(PAL.wood, 40, 41, 16, 27);
    d.r(PAL.woodD, 47, 41, 2, 27);
    d.r(PAL.cream, 42, 45, 4, 5); d.r(PAL.cream, 50, 45, 4, 5);
    d.ell(PAL.yellow, 48, 34, 4, 3); d.r(PAL.orange, 47, 33, 2, 2);
    d.r('#d4c4a0', 2, 68, 92, 4);
  });

  frame('arcade', 80, 64, d => {
    d.r('#3f3456', 4, 14, 72, 8);
    d.r('#5a4a78', 4, 22, 72, 38);
    d.r('#352a48', 4, 58, 72, 2);
    d.r(PAL.cream, 8, 2, 64, 12); d.r(PAL.woodD, 8, 2, 64, 1); d.r(PAL.woodD, 8, 13, 64, 1);
    for (let i = 0; i < 10; i++) {
      const cols = [PAL.red, PAL.yellow, '#7fe8e8'];
      d.r(cols[i % 3], 11 + i * 6, 5, 3, 3);
    }
    const glowin = (x) => {
      d.r('#2a2138', x, 28, 16, 12);
      d.r('#7fe8e8', x + 1, 29, 14, 10);
      d.r('#b8f4f4', x + 2, 30, 12, 2);
    };
    glowin(10); glowin(54);
    d.r('#2a2138', 32, 34, 16, 26);
    d.r('#7fe8e8', 35, 38, 10, 8);
    d.r('#352a48', 34, 48, 12, 12);
  });

  frame('board_obj', 48, 28, d => {
    d.r(PAL.woodD, 6, 14, 4, 14); d.r(PAL.woodD, 38, 14, 4, 14);
    d.r(PAL.woodD, 1, 1, 46, 17);
    d.r(PAL.wood, 3, 3, 42, 13);
    d.r(PAL.cream, 6, 5, 9, 7); d.r(PAL.red, 9, 4, 2, 2);
    d.r('#e8f4d8', 18, 6, 10, 8); d.r(PAL.water, 22, 5, 2, 2);
    d.r(PAL.cream, 31, 5, 9, 6); d.r(PAL.yellow, 34, 4, 2, 2);
    d.r(PAL.creamD, 7, 8, 7, 1); d.r(PAL.creamD, 7, 10, 5, 1);
    d.r('#cfdfba', 19, 9, 8, 1); d.r('#cfdfba', 19, 11, 6, 1);
  });

  frame('stall', 64, 32, d => {
    d.r(PAL.woodD, 4, 8, 3, 18); d.r(PAL.woodD, 57, 8, 3, 18);
    d.r(PAL.wood, 4, 16, 56, 10);
    d.r(PAL.woodL, 4, 16, 56, 2);
    d.r(PAL.woodD, 4, 25, 56, 1);
    for (let i = 0; i < 4; i++) {
      d.r(PAL.orange, 12 + i * 11, 12, 3, 4);
      d.r(PAL.leaf, 13 + i * 11, 10, 1, 2);
    }
    for (let i = 0; i < 8; i++) {
      const col = i % 2 ? PAL.cream : PAL.leaf;
      d.r(col, i * 8, 0, 8, 7);
      d.r(col, i * 8 + 2, 7, 4, 1);
    }
  });

  frame('wagon', 64, 48, d => {
    d.ell('#6f6a62', 16, 40, 7, 7); d.ell('#9a948a', 16, 40, 4, 4); d.r('#6f6a62', 15, 39, 2, 2);
    d.ell('#6f6a62', 48, 40, 7, 7); d.ell('#9a948a', 48, 40, 4, 4); d.r('#6f6a62', 47, 39, 2, 2);
    d.r('#b54a3c', 6, 18, 52, 18);
    d.r('#9a3a2e', 6, 34, 52, 2);
    d.r('#dd8a78', 6, 18, 52, 2);
    for (let i = 0; i < 7; i++) {
      const half = Math.min(26, 14 + i * 3);
      d.r(PAL.cream, 32 - half, 4 + i * 2, half * 2, 2);
    }
    d.r(PAL.creamD, 8, 16, 48, 2);
    d.r(PAL.yellow, 26, 22, 12, 9); d.r(PAL.hatD, 28, 24, 8, 5);
    d.r(PAL.woodD, 58, 28, 6, 2);
  });

  frame('well', 24, 26, d => {
    d.r(PAL.woodD, 3, 4, 2, 14); d.r(PAL.woodD, 19, 4, 2, 14);
    for (let i = 0; i < 5; i++) {
      const half = Math.min(12, 5 + i * 2);
      d.r(PAL.roof, 12 - half, i * 2, half * 2, 2);
    }
    d.r(PAL.ui, 11, 10, 1, 5);
    d.r(PAL.wood, 9, 14, 6, 4); d.r(PAL.woodD, 9, 14, 6, 1);
    d.r('#9a948a', 2, 18, 20, 8);
    d.r('#b8b2a8', 2, 18, 20, 2);
    d.r('#6f6a62', 6, 20, 2, 2); d.r('#6f6a62', 12, 22, 2, 2); d.r('#6f6a62', 17, 20, 2, 2);
  });

  frame('machine', 24, 32, d => {
    d.r('#352a48', 2, 2, 20, 28);
    d.r('#5a4a78', 3, 3, 18, 26);
    d.r(PAL.cream, 4, 0, 16, 3);
    d.r('#2a2138', 5, 6, 14, 11);
    d.r('#7fe8e8', 6, 7, 12, 9);
    d.r('#b8f4f4', 7, 8, 10, 2);
    d.r('#2a2138', 9, 12, 6, 2);
    d.r('#3f3456', 4, 19, 16, 6);
    d.r(PAL.red, 6, 21, 2, 2); d.r(PAL.yellow, 10, 21, 2, 2);
    d.r(PAL.ui, 15, 19, 1, 3); d.ell(PAL.red, 15, 18, 1, 1);
    d.r('#2a2138', 3, 29, 18, 3);
  });

  frame('fencepost', 8, 14, d => {
    d.r(PAL.wood, 2, 2, 4, 12);
    d.r(PAL.woodL, 2, 2, 4, 1);
    d.r(PAL.woodD, 5, 3, 1, 11);
    d.r(PAL.woodD, 1, 0, 6, 2);
  });

  frame('chest', 18, 14, d => {
    d.r(PAL.woodL, 1, 1, 16, 5);
    d.r(PAL.wood, 1, 6, 16, 7);
    d.r(PAL.woodD, 1, 5, 16, 1);
    d.r(PAL.woodD, 4, 1, 2, 12); d.r(PAL.woodD, 12, 1, 2, 12);
    d.r(PAL.yellow, 8, 5, 3, 4); d.r(PAL.hatD, 9, 7, 1, 1);
    d.r(PAL.woodD, 1, 12, 16, 1);
  });

  // ---------- glowbox mini-game ----------
  frame('jar', 20, 22, d => {
    d.r(PAL.woodL, 4, 0, 12, 3);
    d.r('#d8eef8', 2, 3, 16, 18);
    d.r('#b8d8ea', 2, 3, 16, 1);
    d.r('#ffffff', 4, 6, 2, 11);
    d.r('#b8d8ea', 17, 4, 1, 16);
    d.r('#b8d8ea', 2, 20, 16, 1);
  });

  frame('firefly', 8, 8, d => {
    d.alpha(0.5, () => d.ell('#f8e88a', 4, 4, 4, 4));
    d.ell('#f8e88a', 4, 4, 2, 2);
    d.r('#ffffff', 3, 3, 2, 2);
    d.r(PAL.grayD, 2, 1, 1, 1); d.r(PAL.grayD, 5, 1, 1, 1);
  });

  // ---------- new icons ----------
  frame('i_mushroom', 12, 12, d => {
    d.ell(PAL.red, 6, 4, 5, 3);
    d.r('#ffffff', 3, 2, 2, 2); d.r('#ffffff', 8, 3, 2, 2);
    d.r(PAL.cream, 4, 6, 4, 5); d.r(PAL.creamD, 7, 6, 1, 5);
  });
  frame('i_frog', 12, 12, d => {
    d.ell('#6fae4a', 6, 7, 5, 4);
    d.ell('#6fae4a', 3, 3, 2, 2); d.ell('#6fae4a', 9, 3, 2, 2);
    d.r('#ffffff', 2, 2, 2, 2); d.r('#ffffff', 8, 2, 2, 2);
    d.r(PAL.ui, 3, 3, 1, 1); d.r(PAL.ui, 9, 3, 1, 1);
    d.r(PAL.ui, 4, 8, 4, 1);
    d.r('#9ac24e', 4, 6, 2, 1);
  });
  frame('i_key', 12, 12, d => {
    d.ell(PAL.yellow, 4, 4, 3, 3);
    d.cut(4, 4, 1, 1);
    d.r(PAL.yellow, 6, 5, 5, 2);
    d.r(PAL.yellow, 9, 7, 2, 2); d.r(PAL.yellow, 6, 7, 1, 2);
  });
  frame('i_moon', 12, 12, d => {
    d.ell(PAL.yellow, 6, 6, 5, 5);
    d.cut(9, 5, 4, 4);
    d.r('#ffffff', 3, 4, 1, 1);
  });
  frame('i_sun', 12, 12, d => {
    d.r(PAL.yellow, 5, 0, 2, 12);
    d.r(PAL.yellow, 0, 5, 12, 2);
    d.r(PAL.yellow, 2, 2, 2, 2); d.r(PAL.yellow, 8, 2, 2, 2);
    d.r(PAL.yellow, 2, 8, 2, 2); d.r(PAL.yellow, 8, 8, 2, 2);
    d.ell(PAL.yellow, 6, 6, 3, 3);
    d.ell('#f8e88a', 6, 6, 2, 2);
  });
  frame('i_berry', 12, 12, d => {
    d.r(PAL.leaf, 5, 0, 2, 3); d.r(PAL.leaf, 3, 1, 2, 2); d.r(PAL.leaf, 7, 1, 2, 2);
    d.ell(PAL.red, 6, 7, 4, 4);
    d.r('#f08a86', 4, 5, 2, 2);
    d.r(PAL.yellow, 5, 7, 1, 1); d.r(PAL.yellow, 7, 8, 1, 1);
  });
  frame('i_book', 12, 12, d => {
    d.r(PAL.woodD, 1, 2, 10, 9);
    d.r(PAL.cream, 2, 3, 8, 7);
    d.r(PAL.woodD, 5, 3, 1, 7);
    d.r(PAL.creamD, 3, 5, 2, 1); d.r(PAL.creamD, 3, 7, 2, 1);
    d.r(PAL.creamD, 7, 5, 2, 1); d.r(PAL.creamD, 7, 7, 2, 1);
  });
  frame('i_badge', 12, 12, d => {
    d.r(PAL.red, 3, 7, 2, 5); d.r(PAL.red, 7, 7, 2, 5);
    d.ell(PAL.yellow, 6, 4, 4, 4);
    d.ell(PAL.hatD, 6, 4, 2, 2);
    d.r('#ffffff', 4, 2, 1, 1);
  });
  frame('i_quest', 12, 12, d => {
    d.r(PAL.creamD, 1, 2, 2, 8); d.r(PAL.creamD, 9, 2, 2, 8);
    d.r(PAL.cream, 3, 1, 6, 10);
    d.r(PAL.woodD, 4, 3, 4, 1); d.r(PAL.woodD, 4, 5, 4, 1); d.r(PAL.woodD, 4, 7, 3, 1);
    d.r(PAL.red, 5, 9, 2, 2);
  });
  frame('i_chest', 12, 12, d => {
    d.r(PAL.woodL, 1, 2, 10, 4);
    d.r(PAL.wood, 1, 6, 10, 5);
    d.r(PAL.woodD, 1, 5, 10, 1);
    d.r(PAL.yellow, 5, 4, 2, 4);
  });
  frame('i_heart_g', 12, 12, d => {
    d.ell('#b8b2a8', 4, 4, 2, 2); d.ell('#b8b2a8', 8, 4, 2, 2);
    d.r('#b8b2a8', 2, 4, 8, 3);
    d.r('#b8b2a8', 3, 7, 6, 1); d.r('#b8b2a8', 4, 8, 4, 1); d.r('#b8b2a8', 5, 9, 2, 1);
  });
  frame('i_seed_sunflower', 12, 12, seedPacket(PAL.yellow));
  frame('i_think', 12, 12, d => {
    d.ell('#ffffff', 6, 5, 5, 4);
    d.r('#ffffff', 3, 9, 2, 1); d.r('#ffffff', 2, 10, 1, 1);
    d.r(PAL.water, 4, 4, 1, 2); d.r(PAL.water, 6, 4, 1, 2); d.r(PAL.water, 8, 4, 1, 2);
  });
  frame('i_brush', 12, 12, d => {
    d.r(PAL.woodD, 8, 0, 3, 3);
    d.r(PAL.wood, 6, 2, 4, 4);
    d.r('#d8d2c4', 3, 5, 5, 3);
    d.r('#c96a4a', 1, 7, 5, 4);
    d.r('#b5543a', 1, 10, 5, 1);
  });
  frame('i_help', 12, 12, d => {
    d.ell(PAL.water, 6, 6, 5, 5);
    d.r('#ffffff', 4, 3, 4, 2);
    d.r('#ffffff', 7, 4, 2, 2);
    d.r('#ffffff', 5, 5, 3, 2);
    d.r('#ffffff', 5, 7, 2, 1);
    d.r('#ffffff', 5, 9, 2, 2);
  });
  // bouncing tutorial pointer — bright down-arrow with a dark outline so it
  // shows over any tile
  frame('i_point', 14, 16, d => {
    d.r(PAL.ui, 4, 0, 6, 9);
    d.r(PAL.ui, 1, 7, 12, 3);
    d.r(PAL.ui, 3, 9, 8, 2);
    d.r(PAL.ui, 5, 11, 4, 2);
    d.r(PAL.ui, 6, 13, 2, 2);
    d.r(PAL.yellow, 5, 1, 4, 7);
    d.r(PAL.yellow, 3, 7, 8, 2);
    d.r(PAL.yellow, 5, 9, 4, 2);
    d.r(PAL.yellow, 6, 11, 2, 2);
    d.r('#fff8d8', 6, 1, 1, 5);
  });
  // read-aloud button: a friendly blue speaker with three rising sound bars,
  // visibly different from the dark HUD mute speaker (i_snd)
  frame('i_speak', 12, 12, d => {
    d.r(PAL.water, 1, 4, 2, 4);
    d.r(PAL.water, 3, 3, 2, 6);
    d.r(PAL.water, 5, 2, 1, 8);
    d.r(PAL.waterD, 7, 4, 1, 4);
    d.r(PAL.waterD, 9, 3, 1, 6);
    d.r(PAL.waterD, 11, 2, 1, 8);
  });

  // ---------- ambient life ----------
  frame('puff', 10, 10, d => {
    d.alpha(0.85, () => {
      d.ell('#ddd8ce', 5, 6, 4, 3);
      d.ell('#efece5', 4, 4, 3, 3);
      d.ell('#f7f5f0', 6, 4, 2, 2);
    });
  });

  frame('sparkle', 8, 8, d => {
    d.r('#ffffff', 3, 1, 2, 6);
    d.r('#ffffff', 1, 3, 6, 2);
    d.r('#d8f2fc', 3, 3, 2, 2);
  });

  frame('butterfly_0', 10, 8, d => {
    d.r(PAL.orange, 0, 1, 4, 4); d.r(PAL.yellow, 1, 2, 2, 2);
    d.r(PAL.orange, 6, 1, 4, 4); d.r(PAL.yellow, 7, 2, 2, 2);
    d.r(PAL.orange, 1, 5, 2, 2); d.r(PAL.orange, 7, 5, 2, 2);
    d.r(PAL.ui, 4, 1, 2, 6);
    d.r(PAL.ui, 3, 0, 1, 1); d.r(PAL.ui, 6, 0, 1, 1);
  });
  frame('butterfly_1', 10, 8, d => {
    d.r(PAL.orange, 2, 1, 2, 5); d.r(PAL.yellow, 2, 2, 1, 2);
    d.r(PAL.orange, 6, 1, 2, 5); d.r(PAL.yellow, 7, 2, 1, 2);
    d.r(PAL.ui, 4, 1, 2, 6);
    d.r(PAL.ui, 3, 0, 1, 1); d.r(PAL.ui, 6, 0, 1, 1);
  });

  frame('firefly_1', 8, 8, d => {
    d.alpha(0.5, () => d.ell('#f8e88a', 4, 4, 4, 4));
    d.ell('#f8e88a', 4, 4, 2, 2);
    d.r('#ffffff', 3, 3, 2, 2);
    d.r(PAL.grayD, 1, 0, 1, 1); d.r(PAL.grayD, 6, 0, 1, 1);
  });

  tex.refresh();
}
