// Crop definitions — schema per GDD §4.
// regrowDays: after harvest the plant stays and re-readies in N watered days.
// shop: false keeps quest-only crops out of the market.

export const CROPS = {
  bean: {
    id: 'bean', name: 'Sprout Bean', seedName: 'Bean Seeds',
    seedPrice: 5, sellPrice: 8, growDays: 2, regrowDays: null,
    stages: 4, icon: 'i_seed_bean',
    shop: true,
  },
  carrot: {
    id: 'carrot', name: 'Sunny Carrot', seedName: 'Carrot Seeds',
    seedPrice: 8, sellPrice: 15, growDays: 3, regrowDays: null,
    stages: 4, icon: 'i_seed_carrot',
    shop: true,
  },
  berry: {
    id: 'berry', name: 'Berry Bush', seedName: 'Berry Seeds',
    seedPrice: 12, sellPrice: 10, growDays: 3, regrowDays: 2,
    stages: 4, icon: 'i_seed_berry',
    shop: true,
  },
  pumpkin: {
    id: 'pumpkin', name: 'Plump Pumpkin', seedName: 'Pumpkin Seeds',
    seedPrice: 15, sellPrice: 30, growDays: 4, regrowDays: null,
    stages: 4, icon: 'i_seed_pumpkin',
    shop: true,
  },
  sunflower: {
    id: 'sunflower', name: 'Golden Sunflower', seedName: 'Sunflower Seed',
    seedPrice: 0, sellPrice: 40, growDays: 4, regrowDays: null,
    stages: 4, icon: 'i_seed_sunflower',
    shop: false,   // quest reward only (Too Good To Be Free)
  },
};

export const CROP_ORDER = ['bean', 'carrot', 'berry', 'pumpkin'];
