// Market upgrades — one-time purchases, effects applied in GameState.buyUpgrade.

export const UPGRADES = [
  { id: 'satchel', name: 'Acorn Satchel', desc: 'Carry 2 more acorns each day!', price: 60, icon: 'i_acorn' },
  { id: 'boots',   name: 'Comfy Boots',   desc: 'Walk faster around the farm!',  price: 50, icon: 'i_check' },
  { id: 'field',   name: 'Field Plus',    desc: 'Open 6 more growing plots!',    price: 40, icon: 'i_basket' },
  { id: 'scale',   name: 'Shiny Scale',   desc: 'Earn 2 extra coins per sale!',  price: 80, icon: 'i_coin' },
  { id: 'paint',   name: 'Paint Set',     desc: 'Paint your fences a fun color!', price: 30, icon: 'i_brush' },
];
