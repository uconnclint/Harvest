// The Hollow Board: the town's message feed for the whole 28-day season.
// Posts persist all season (digital footprint). Reply tones: kind | plain | unkind.
// `think` is Hoot's one-line T.H.I.N.K. hint, shown only on hover / long-press.
// `requires` gates a post on game state. {crop} is filled from the day-4 answer.

export const POSTS = [
  {
    id: 'b_d1', day: 1, author: 'marigold',
    text: 'Welcome, new farmer! We are glad you came!',
    replies: [
      { tone: 'kind', text: 'Happy to be here! Hi everyone!', think: 'Kind words make great first posts.' },
      { tone: 'plain', text: 'Hi.', think: 'True and kind. Could it be warmer?' },
      { tone: 'unkind', text: 'This town looks boring.', think: 'Is it kind? Is it helpful?' },
    ],
  },
  {
    id: 'b_d2_pip', day: 2, author: 'pip',
    text: 'Carrots are yucky. And Bram grows the funniest-looking ones!',
    replies: [
      { tone: 'kind', text: 'Bram works hard on his carrots!', think: 'Sticking up for someone is kind.' },
      { tone: 'plain', text: 'I like beans more, myself.', think: 'Sharing your taste is okay!' },
      { tone: 'unkind', text: 'Carrots ARE yucky!', think: 'Would Bram feel good reading this?' },
    ],
  },
  {
    id: 'b_d2_bram', day: 2, author: 'bram',
    text: 'Carrot stall open today. Fresh and crunchy.',
    replies: [
      { tone: 'kind', text: 'Your stall is the best, Bram!', think: 'Cheering neighbors grows hearts.' },
      { tone: 'plain', text: 'Good to know.', think: 'Short and true works too.' },
      { tone: 'unkind', text: 'Who even buys carrots?', think: 'Is it necessary? Is it kind?' },
    ],
  },
  {
    id: 'b_d4', day: 4, author: 'marigold', prompt: true,
    text: 'Question of the week: what crop do you love best?',
    replies: [
      { tone: 'kind', text: 'I love pumpkins! What about you?', crop: 'pumpkin', think: 'Asking back keeps chats friendly.' },
      { tone: 'kind', text: 'Beans are the best! So squishy.', crop: 'bean', think: 'Sharing what you love is friendly!' },
      { tone: 'plain', text: 'Carrots, I guess.', crop: 'carrot', think: 'An honest answer. Posts stick around!' },
    ],
  },
  {
    id: 'b_d5', day: 5, author: 'pip',
    text: 'The Glowbox is SO fun. New high score!!',
    replies: [
      { tone: 'kind', text: 'Wow! Did you water your crops first?', think: 'Friends remind friends. Kindly!' },
      { tone: 'plain', text: 'Nice score.', think: 'True and short. That works.' },
      { tone: 'unkind', text: 'Games are a waste of time.', think: 'Is it true? Is it kind?' },
    ],
  },
  {
    id: 'b_d6', day: 6, author: 'marigold',
    text: 'Friendly reminder: water before play! Crops get thirsty.',
    replies: [
      { tone: 'kind', text: 'Good reminder! Chores first, then fun.', think: 'Agreeing kindly helps everyone.' },
      { tone: 'plain', text: 'Okay.', think: 'Simple is fine.' },
      { tone: 'unkind', text: 'Stop telling us what to do!', think: 'She is helping. Is this kind?' },
    ],
  },
  {
    id: 'b_d8', day: 8, author: 'bram',
    text: 'Someone left muddy boots on my step. Grumble.',
    replies: [
      { tone: 'kind', text: 'I will help you clean up!', think: 'Offering help is inspiring.' },
      { tone: 'plain', text: 'Muddy season, I guess.', think: 'True. Could you also help?' },
      { tone: 'unkind', text: 'Ha! Grumpy Bram strikes again.', think: 'Teasing can sting. Is it kind?' },
    ],
  },
  {
    id: 'b_d10', day: 10, author: 'pip',
    text: 'My pumpkins are growing again. Thanks, friend!',
    replies: [
      { tone: 'kind', text: 'Team work! They will be huge!', think: 'Celebrate friends. It grows hearts!' },
      { tone: 'plain', text: 'Good.', think: 'Short works. Warm works better.' },
      { tone: 'unkind', text: 'Do not lose them again.', think: 'Helpful? Or just a poke?' },
    ],
  },
  {
    id: 'b_d12', day: 12, author: 'pip',
    requires: { replied: 'b_d4' },
    text: 'My friend posted that they love {crop}s. I saved them a seed!',
    replies: [
      { tone: 'kind', text: 'You remembered! Thank you, Pip!', think: 'Saying thanks always lands well.' },
      { tone: 'plain', text: 'That was my post.', think: 'True! Posts stick around.' },
    ],
  },
  {
    id: 'b_d13', day: 13, author: 'bram',
    text: 'I just read what Pip wrote about my carrots. That stings.',
    replies: [
      { tone: 'kind', text: 'Your carrots are great, Bram.', think: 'Comfort helps a hurt heart.' },
      { tone: 'plain', text: 'Old posts stick around, huh.', think: 'True. Can you add comfort too?' },
    ],
  },
  {
    id: 'b_d14', day: 14, author: 'bram', mean: true,
    text: 'Pip is lazy! His garden is a mess. He should quit.',
    note: 'You can also tell Mayor Marigold.',
    replies: [
      { tone: 'kind', text: 'Pip works hard. And he is my friend.', think: 'Standing up kindly is brave.' },
    ],
  },
  {
    id: 'b_d15', day: 15, author: 'marigold',
    text: 'Kind words mend more than fences. Proud of this town.',
    replies: [
      { tone: 'kind', text: 'Proud to live here too!', think: 'Join the kindness!' },
      { tone: 'plain', text: 'True.', think: 'Yes it is!' },
    ],
  },
  {
    id: 'b_d16_bram', day: 16, author: 'bram',
    requires: { questDone: 'q5' },
    text: 'Pip, I am sorry. I was hurt and I was mean. Friends?',
    replies: [
      { tone: 'kind', text: 'Saying sorry is strong, Bram!', think: 'Cheer for people who repair things.' },
      { tone: 'plain', text: 'Good of you to fix it.', think: 'True and fair.' },
    ],
  },
  {
    id: 'b_d16_pip', day: 16, author: 'pip',
    requires: { questDone: 'q5' },
    text: 'Sorry about the carrot post, Bram. Carrots are cool. You are cooler.',
    replies: [
      { tone: 'kind', text: 'You two are great neighbors.', think: 'Kindness all around!' },
      { tone: 'plain', text: 'All fixed then.', think: 'A happy ending.' },
    ],
  },
  {
    id: 'b_d18', day: 18, author: 'tessa', rumor: true,
    text: 'I heard well water makes crops grow DOUBLE!! Pass it on!!',
    replies: [
      { tone: 'kind', text: 'Where did you hear that?', think: 'Check it before you share it!' },
      { tone: 'plain', text: 'Hmm. Really?', think: 'Good instinct. Ask for the source!' },
      { tone: 'unkind', text: 'That is so dumb, Tessa.', think: 'You can doubt it AND be kind.' },
    ],
  },
  {
    id: 'b_truth', day: 18, author: 'you',
    requires: { questDone: 'q6' },
    text: 'We tested it! Well water is just water. Check before you share!',
    replies: [],
  },
  {
    id: 'b_d24', day: 24, author: 'marigold',
    text: 'Spring Festival on Day 28! Bring your happiest harvest!',
    replies: [
      { tone: 'kind', text: 'I cannot wait! See everyone there!', think: 'Excitement is contagious!' },
      { tone: 'plain', text: 'Noted.', think: 'Festival mode: on.' },
    ],
  },
  {
    id: 'b_d27', day: 27, author: 'pip',
    text: 'Festival TOMORROW!! I am bringing my big pumpkin!!',
    replies: [
      { tone: 'kind', text: 'It will be the best pumpkin ever!', think: 'Hype your friends up!' },
      { tone: 'plain', text: 'See you there.', think: 'Friendly and simple.' },
    ],
  },
];

export function visiblePosts(state) {
  return POSTS.filter(p => {
    if (p.day > state.day) return false;
    if (p.requires) {
      if (p.requires.replied && !state.board[p.requires.replied]) return false;
      if (p.requires.questDone) {
        const q = state.quests[p.requires.questDone];
        if (!q || !q.done) return false;
      }
    }
    return true;
  }).sort((a, b) => b.day - a.day);
}

export function postText(p, state) {
  if (!p.text.includes('{crop}')) return p.text;
  return p.text.replace('{crop}', state.flags.footprintCrop || 'pumpkin');
}
