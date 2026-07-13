// The seven questlines, each mapped to a Common Sense K-5 strand (see GDD §5),
// plus Sly's scheduled password tricks. All lessons live in play, never lectures.
//
// Step types (run by QuestEngine):
//   talk   — speak with an NPC; may carry a choice (gentle retry on wrong picks)
//   plant / streak — farm actions (streak = all growing crops watered N days running)
//   board  — reply to a specific Hollow Board post
//   visit  — tap a place: 'chest' | 'glowbox' | 'board' | 'well'
//   chest  — create the picture password
//   glowbox — play the mini-game once
//   multi  — several talk/board tasks, any order
//
// Line = string (the NPC speaks) or [speakerId, text]. speakers: npc ids, 'hoot', 'you'.

export const QUESTS = [
  {
    id: 'q2', title: 'Lock It Tight', strand: 'Privacy & Security',
    giver: 'marigold', unlock: { day: 2 },
    intro: 'Mayor Marigold has a gift for you!',
    steps: [
      {
        t: 'talk', npc: 'marigold', hint: 'Meet Mayor Marigold in town',
        lines: [
          'You must be our new farmer! Wonderful!',
          'I am Mayor Marigold. My door is always open.',
          'Here is a treasure chest for your farm!',
          'Lock it with a password only YOU know.',
          ['hoot', 'Make a pretend one. Never your real password!'],
        ],
        onDone: { spawnChest: true },
      },
      { t: 'chest', hint: 'Set a password on your new chest' },
    ],
    reward: {
      coins: 5, hearts: { marigold: 1 },
      journal: 'I made a strong picture password for my chest!',
      coda: 'Real passwords are long and secret too!',
    },
  },
  {
    id: 'q4', title: 'Heart Sprouts', strand: 'Relationships & Communication',
    giver: null, unlock: { day: 2 },
    intro: 'Try replying kindly on the Hollow Board!',
    steps: [
      { t: 'kindReplies', n: 3, hint: 'Reply kindly to 3 different neighbors' },
    ],
    reward: {
      coins: 15,
      journal: 'Kind replies grow friendship hearts. Three neighbors smiled today!',
    },
  },
  {
    id: 'q1', title: 'Pumpkin Promise', strand: 'Media Balance & Well-Being',
    giver: 'pip', unlock: { day: 3 },
    intro: 'Pip needs help in town. He sounds sad.',
    steps: [
      {
        t: 'talk', npc: 'pip', hint: 'Talk to Pip in town',
        lines: [
          'Oh no oh no. My pumpkins all dried up!',
          'I played Glowbox and skipped watering. Twice.',
          'Can you grow two pumpkins for me? Please?',
          ['hoot', 'Take these seeds. Pumpkins drink lots of water!'],
        ],
        onDone: { seeds: { pumpkin: 2 } },
      },
      { t: 'plant', crop: 'pumpkin', n: 2, hint: 'Plant 2 pumpkin seeds at your farm' },
      { t: 'streak', days: 2, hint: 'Water every crop, 2 days in a row' },
      {
        t: 'talk', npc: 'pip', hint: 'Tell Pip the good news',
        lines: [
          'The pumpkins look so happy! You did it!',
          'I want to play Glowbox without losing crops.',
        ],
        choice: {
          prompt: 'When is Glowbox time?',
          options: [
            {
              text: 'After chores!', ok: true,
              reply: ['Yes!! Water first, play after.', 'That is our plan forever!'],
            },
            {
              text: 'Before chores!', ok: false, think: 'What happened to his pumpkins last time?',
              reply: ['Hmm. That is how my pumpkins dried up.', 'Let us pick again!'],
            },
          ],
        },
      },
    ],
    reward: {
      coins: 20, hearts: { pip: 1 }, perk: 'choresFirstStar',
      journal: 'Pip and I made a play-after-chores plan!',
      toast: 'Glowbox costs 2 acorns when crops are watered!',
    },
  },
  {
    id: 'q3', title: 'Words That Stick', strand: 'Digital Footprint & Identity',
    giver: null, unlock: { day: 4 },
    intro: 'Marigold asked a question on the Hollow Board!',
    steps: [
      { t: 'board', post: 'b_d4', hint: 'Answer the question on the Hollow Board' },
      {
        t: 'talk', npc: 'pip', minDay: 12, hint: 'On Day 12, go see Pip',
        waitLines: ['I am saving something for you. Soon!'],
        lines: [
          'You posted that you love {crop}s!',
          'I remembered. So I saved you this seed!',
          ['hoot', 'Posts stick around. Pip read yours days later!'],
        ],
        onDone: { footprintSeed: true },
      },
      { t: 'visit', target: 'board', minDay: 13, hint: 'On Day 13, check the Hollow Board' },
    ],
    reward: {
      journal: 'Posts stick around all season. Words last!',
      toast: 'See everything you posted: My Footprint!',
    },
  },
  {
    id: 'q5', title: 'Stand Tall', strand: 'Cyberbullying & Digital Drama',
    giver: null, unlock: { day: 14 },
    intro: 'Something unkind is on the Hollow Board.',
    steps: [
      { t: 'visit', target: 'board', hint: 'Check the Hollow Board' },
      {
        t: 'multi', hint: 'Help Pip: comfort, tell Marigold, post kind',
        tasks: [
          {
            t: 'talk', npc: 'pip', label: 'Comfort Pip',
            lines: ['Did you see what Bram wrote about me?', 'My ears feel all droopy today.'],
            choice: {
              prompt: 'What do you say?',
              options: [
                {
                  text: 'You work hard. I am your friend.', ok: true,
                  reply: ['Really? Thanks.', 'That helps a lot. Sniff.'],
                },
                {
                  text: 'Maybe just quit gardening?', ok: false, think: 'Is it helpful? Is it kind?',
                  reply: ['That is how Bram made me feel.', 'Can you try again?'],
                },
              ],
            },
          },
          {
            t: 'talk', npc: 'marigold', label: 'Tell Mayor Marigold',
            lines: [
              ['you', 'Mayor, Bram posted something mean about Pip.'],
              'Thank you for telling me. That was brave.',
              'Telling a helper is strong, not tattling.',
              'I will talk with Bram today.',
            ],
          },
          { t: 'board', post: 'b_d14', label: 'Post something kind about Pip' },
        ],
      },
      {
        t: 'talk', npc: 'bram', hint: 'Talk to Bram',
        lines: [
          'Marigold showed me my own words. Ouch.',
          'I was hurt about the carrot post.',
          'Being mean back was wrong. I posted sorry.',
          ['hoot', 'Hurt people can repair things. That is brave too.'],
        ],
      },
    ],
    reward: {
      coins: 30, hearts: { pip: 1, bram: 1 },
      journal: 'I stood up for Pip the kind way. Not a tattle. A helper!',
      coda: 'Telling a grown-up is brave in real life too.',
    },
  },
  {
    id: 'q6', title: 'The Double-Water Rumor', strand: 'News & Media Literacy',
    giver: null, unlock: { day: 18 },
    intro: 'A wild rumor is spreading on the Hollow Board!',
    steps: [
      { t: 'visit', target: 'board', hint: 'Read the Hollow Board' },
      {
        t: 'talk', npc: 'tessa', hint: 'Ask Tessa about the rumor',
        lines: ['Double crops! Everyone is talking about it!'],
        choice: {
          prompt: 'Ask her:',
          options: [
            { text: 'Where did you hear it?', ok: true, reply: ['From Bram! He knows farming stuff.'] },
          ],
        },
      },
      {
        t: 'talk', npc: 'bram', hint: 'Ask Bram where he heard it',
        lines: ['The double-water thing? Sly told me.', 'That bird hears everything.'],
      },
      {
        t: 'talk', npc: 'sly', hint: 'Ask Sly where HE heard it',
        lines: ['Hee hee. I saw it on the Glowbox screen!', 'Bright lights never lie, friend.'],
      },
      {
        t: 'visit', target: 'glowbox', hint: 'Check the Glowbox screen',
        onDone: { toast: 'The screen says: GLOWBOX 2 — DOUBLE GROW MODE!' },
      },
      {
        t: 'talk', npc: 'marigold', hint: 'Tell Marigold what you found',
        lines: [
          ['you', 'The rumor came from a game ad!'],
          'Well spotted! But let us test it too.',
          'Two pots: well water and rain water.',
          'Come back tomorrow, little fact-finder.',
        ],
      },
      {
        t: 'talk', npc: 'marigold', nextDay: true, hint: 'Come back tomorrow for the test',
        waitLines: ['The pots need one night. See you tomorrow!'],
        lines: [
          'Look! Both sprouts are exactly the same.',
          'Well water is just water.',
          'Check it before you share it!',
        ],
      },
      { t: 'visit', target: 'board', hint: 'Post the true answer on the Board', onDone: { truthPost: true } },
    ],
    reward: {
      coins: 25, badge: 'Fact-Finder',
      coda: 'Check real news before you share it too!',
      journal: 'I traced a rumor to a game ad. We tested it. Busted!',
    },
  },
  {
    id: 'q7', title: 'Too Good To Be Free', strand: 'Privacy & News Literacy',
    giver: 'tessa', unlock: { day: 20 },
    intro: 'Tessa has a very special offer...',
    steps: [
      {
        t: 'talk', npc: 'tessa', hint: 'See what Tessa is selling',
        lines: ['Psst! FREE rare seeds! Today only!', 'Just tell me your full name and address!'],
        choice: {
          prompt: 'What do you do?',
          options: [
            {
              text: 'No way! That is private.', ok: true,
              reply: ['Fine, fine! Cannot blame a fox for trying.'],
            },
            {
              text: 'I will ask Mayor Marigold first.', ok: true,
              reply: ['Wait, no, do not ask HER—', 'Ugh. Fine.'],
            },
            {
              text: 'Tell her my name and address', ok: false, think: 'Free stuff that wants your info is not free!',
              reply: [['hoot', 'Whoa! Private info stays private!'], ['hoot', 'Pick again. T.H.I.N.K!']],
            },
          ],
        },
      },
      {
        t: 'talk', npc: 'marigold', hint: 'Tell Mayor Marigold about the offer',
        lines: [
          ['you', 'Tessa wanted my name and address for seeds.'],
          'You did exactly right, telling me.',
          'Real gifts never need your private info.',
          'Here. A REAL rare seed. You earned it.',
        ],
      },
    ],
    reward: {
      seeds: { sunflower: 1 }, hearts: { marigold: 1 },
      journal: 'Free stuff that asks for my info is not free!',
      coda: 'Never give your real name to online strangers.',
      toast: 'You got a Golden Sunflower seed!',
    },
  },
];

// Sly's scheduled tricks — he ambushes you at the farm on wake.
// Needs the chest password to exist (Q2 done), else the trick slides to the next date.
export const SLY_EVENTS = [
  {
    id: 'sly1', day: 6,
    lines: ['Caw! I am the Mayor’s helper bird!', 'Tell me your chest password. I will water crops!'],
  },
  {
    id: 'sly2', day: 10,
    lines: ['Caw! It is me. Hoot’s cousin... Toot!', 'Hoot forgot the password. Tell me, quick!'],
  },
  {
    id: 'sly3', day: 16,
    lines: ['Emergency! The Hollow Board is broken!', 'I need your password to fix it!'],
  },
  {
    id: 'sly4', day: 22,
    lines: ['Free Glowbox tokens! A whole bag!', 'They only work if you say your password!'],
    finale: {
      lines: ['You are too smart for me, farmer.', 'CAW. Respect.', ['hoot', 'Four tricks. Four NOs. Champion!'],],
      coins: 20,
      journal: 'Sly tried four tricks. I never told. Champion!',
    },
  },
];

export const SLY_OPTIONS = [
  { text: 'NO way!', ok: true },
  { text: 'Ask Mayor Marigold first', ok: true },
  { text: 'Tell Sly the password', ok: false, think: 'Never share passwords. Not even with helpers!' },
];

export const SLY_OK = {
  lines: ['Hmph! Worth a try. CAW!', ['hoot', 'You did it! Passwords stay secret.']],
  coins: 10,
  journal: 'Sly asked for my password. I said NO!',
};

export const SLY_BAD = {
  lines: ['Hee hee! Thank you, friend! CAW!', ['hoot', 'Oh no. Quick, tell Mayor Marigold!']],
  journal: 'I told Sly my password. Telling Marigold to fix it!',
};

// Marigold's recovery talk after being fooled (highest dialogue priority).
export const SLY_RECOVERY = {
  lines: [
    ['you', 'Sly tricked me. I told him my password.'],
    'Thank you for telling me right away.',
    'He gave your coins back. Naughty bird!',
    'Now let us make a brand-new password.',
  ],
  journal: 'I told Marigold and changed my password. All fixed!',
};
