// The neighbors of Harvest Hollow. Dialogue lines rotate by day.
// Every line ≤ 12 words, 2nd-grade vocabulary (enforced by test/data.test.mjs).

export const NPCS = {
  pip: {
    id: 'pip', name: 'Pip', kind: 'rabbit', frame: 'npc_pip',
    spot: [13, 9], hearts: true,
    talk: [
      ['Hi friend! Pumpkins are my favorite. Obviously.'],
      ['Glowbox later? After chores, I mean!', 'I learned that one the hard way.'],
      ['Your farm looks nicer every single day!'],
      ['I named my watering can Splashy.'],
    ],
  },
  marigold: {
    id: 'marigold', name: 'Mayor Marigold', kind: 'deer', frame: 'npc_marigold',
    spot: [18, 6], hearts: true,
    talk: [
      ['Welcome to town, little farmer.', 'My door is always open.'],
      ['A kind word grows faster than any seed.'],
      ['If anything feels wrong, come tell me.', 'That is what helpers are for.'],
      ['The Hollow Board loves good news. Post some!'],
    ],
  },
  sly: {
    id: 'sly', name: 'Sly', kind: 'crow', frame: 'npc_sly',
    spot: [33, 7], hearts: false,
    talk: [
      ['Caw! Lovely day for secrets.', 'Got any?'],
      ['Shiny things and passwords. My favorite snacks.'],
      ['Nothing sneaky here. Hee hee.'],
    ],
  },
  bram: {
    id: 'bram', name: 'Bram', kind: 'badger', frame: 'npc_bram',
    spot: [10, 13], hearts: true,
    talk: [
      ['Hmph. Carrots need quiet to grow.'],
      ['My stall is open. Crunchy carrots, fair prices.'],
      ['Grumbling helps me think. Mostly.'],
    ],
  },
  tessa: {
    id: 'tessa', name: 'Tessa', kind: 'fox', frame: 'npc_tessa',
    spot: [28, 16], hearts: true, appearsDay: 18,
    talk: [
      ['Step right up! Wonders and deals!'],
      ['A fox has to make a living, sugar.'],
      ['No hard feelings about before, hmm?'],
    ],
  },
};

// Heart milestones: gift granted next time you talk to that NPC.
export const HEART_GIFTS = {
  2: { type: 'seed', lines: ['We are getting to be good friends!', 'Here, I saved this seed for you.'] },
  4: { type: 'coins', amount: 15, lines: ['Best neighbor ever. Take this, please!'] },
  5: { type: 'letter', lines: ['I wrote you a friend letter!', 'It is in your journal forever.'] },
};

export const HEART_GIFT_SEED = { pip: 'pumpkin', marigold: 'carrot', bram: 'carrot', tessa: 'berry' };
