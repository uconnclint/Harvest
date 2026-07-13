// Generates the full art atlas in code, then hands off to the title screen.

import { buildAtlas } from '../systems/TextureFactory.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    buildAtlas(this);
    this.scene.start('Title');
  }
}
