// Sleep + Pause content. Audio is generated live in the browser with the Web Audio API
// (no third-party recordings), so it is license-free prototype audio.

export const SLEEP_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'forest', label: 'Forest' },
  { id: 'noise', label: 'White noise' },
  { id: 'stories', label: 'Sleep stories' },
  { id: 'relax', label: 'Guided relaxation' },
  { id: 'breath', label: 'Breathing' },
]

export const SLEEP_TRACKS = [
  { id: 't1', title: 'Soft monsoon rain', category: 'rain', sound: 'rain', minutes: 60, colors: ['#3A4A8C', '#1E2756'] },
  { id: 't2', title: 'Night ocean waves', category: 'ocean', sound: 'ocean', minutes: 45, colors: ['#1F5C7A', '#122B45'] },
  { id: 't3', title: 'Western Ghats forest', category: 'forest', sound: 'forest', minutes: 40, colors: ['#235847', '#13302A'] },
  { id: 't4', title: 'Pure white noise', category: 'noise', sound: 'white', minutes: 90, colors: ['#5A577A', '#2C2A42'] },
  { id: 't5', title: 'Warm brown noise', category: 'noise', sound: 'brown', minutes: 90, colors: ['#6E4E44', '#2F2220'] },
  { id: 't6', title: 'Riverside evening', category: 'nature', sound: 'stream', minutes: 30, colors: ['#3F6C8A', '#1B2E43'] },
  {
    id: 't7',
    title: 'The lighthouse keeper',
    category: 'stories',
    sound: 'drone',
    minutes: 12,
    colors: ['#6B4FA0', '#2A1F4E'],
    script: [
      'On a quiet island, far from any city, there was a small lighthouse.',
      'Every evening, its keeper climbed the spiral stairs slowly, one step at a time.',
      'The sea below breathed in… and out… in long, unhurried waves.',
      'At the top, the keeper lit the lamp, and a soft golden beam swept across the water.',
      'There was nothing left to do tonight. The light would keep watch.',
      'The keeper sat down, wrapped in a warm blanket, listening to the waves…',
    ],
  },
  {
    id: 't8',
    title: 'Body scan for sleep',
    category: 'relax',
    sound: 'drone',
    minutes: 10,
    colors: ['#4F5AA8', '#22264E'],
    script: [
      'Let your body settle into the bed. Nothing to fix, nothing to do.',
      'Bring attention to your feet. Let them grow heavy and warm.',
      'Move up to your legs… your hips… let them soften.',
      'Notice your belly rising and falling with each breath.',
      'Relax your shoulders, your jaw, the space between your eyebrows.',
      'Your whole body is resting now. Let sleep come when it is ready.',
    ],
  },
  {
    id: 't9',
    title: '4-7-8 breathing for sleep',
    category: 'breath',
    sound: 'drone',
    minutes: 5,
    colors: ['#5E449D', '#211D35'],
    script: ['Breathe in through your nose for 4.', 'Hold gently for 7.', 'Exhale slowly through your mouth for 8.', 'Again — in for 4…', 'Hold for 7…', 'And out for 8. Let your body grow heavier.'],
  },
]

export const SLEEP_RITUALS = [
  {
    id: 'unwind10',
    title: '10-minute unwinding',
    desc: 'A short reset to close the day.',
    steps: [
      { t: 'Dim the lights', d: 'Lower lights and put your phone face down.', s: 60 },
      { t: 'Three slow breaths', d: 'Long exhales tell your body it is safe to rest.', s: 60 },
      { t: 'Brain dump', d: 'Note anything still on your mind — it will be there tomorrow.', s: 180 },
      { t: 'Gentle stretch', d: 'Neck rolls, shoulder shrugs, a forward fold.', s: 120 },
      { t: 'Gratitude', d: 'Name one good moment from today.', s: 60 },
      { t: 'Settle in', d: 'Play a sound and let your eyes close.', s: 120 },
    ],
  },
  {
    id: 'overthinking',
    title: 'Overthinking at night',
    desc: 'When your mind will not switch off.',
    steps: [
      { t: 'Notice the loop', d: 'Say quietly: "I am having the thought that…"', s: 60 },
      { t: 'Park it', d: 'Write the worry and one next step for tomorrow.', s: 120 },
      { t: 'Cognitive shuffle', d: 'Picture random objects: a kite, a mango, a bicycle…', s: 180 },
      { t: 'Slow exhale breathing', d: 'In for 4, out for 6.', s: 120 },
    ],
  },
  {
    id: 'peaceful',
    title: 'Peaceful bedtime',
    desc: 'A calm, consistent wind-down.',
    steps: [
      { t: 'Warm drink', d: 'Caffeine-free — chamomile or warm milk.', s: 120 },
      { t: 'Read something light', d: 'Paper, not screens.', s: 300 },
      { t: 'Body scan', d: 'Relax from toes to head.', s: 180 },
    ],
  },
  {
    id: 'decompress',
    title: 'Post-work decompression',
    desc: 'Leave the workday at the door.',
    steps: [
      { t: 'Close the loop', d: 'Write tomorrow’s top 3 tasks, then close the laptop.', s: 120 },
      { t: 'Change your space', d: 'Change clothes, wash your face — a physical transition.', s: 120 },
      { t: 'Move', d: 'A 5-minute walk or stretch to release tension.', s: 300 },
      { t: 'Reconnect', d: 'Message someone you care about.', s: 60 },
    ],
  },
]

export const BREATH_PATTERNS = [
  { id: 'calm', label: 'Calm breath', desc: 'In 4 · Hold 2 · Out 6', phases: [['Inhale', 4], ['Hold', 2], ['Exhale', 6]] },
  { id: 'box', label: 'Box breathing', desc: 'In 4 · Hold 4 · Out 4 · Hold 4', phases: [['Inhale', 4], ['Hold', 4], ['Exhale', 4], ['Rest', 4]] },
  { id: '478', label: '4-7-8 relax', desc: 'In 4 · Hold 7 · Out 8', phases: [['Inhale', 4], ['Hold', 7], ['Exhale', 8]] },
]

export const CALM_MOMENTS = [
  { id: 'm1', kind: 'Nature visual', title: 'Dawn over the backwaters', minutes: 3, scene: 'dawn', text: 'Watch the light change slowly. Let your breath match the drifting colours.' },
  { id: 'm2', kind: 'Guided visualization', title: 'Your safe place', minutes: 5, scene: 'lake', text: 'Imagine a place where you feel completely safe. Notice the colours, the sounds, the temperature of the air. You can return here anytime.' },
  { id: 'm3', kind: 'Peaceful video', title: 'Fireflies at dusk', minutes: 4, scene: 'fireflies', text: 'Follow one firefly at a time. When your attention drifts, simply choose another.' },
  { id: 'm4', kind: 'Psychology', title: 'Why slow exhales calm you', minutes: 2, scene: 'waves', text: 'Longer exhalations engage the parasympathetic nervous system — the "rest and digest" mode — helping heart rate settle.' },
  { id: 'm5', kind: 'Relaxation', title: 'Progressive muscle release', minutes: 6, scene: 'aurora', text: 'Tense your hands for five seconds… then release. Notice the difference between tension and relaxation. Move through each muscle group.' },
  { id: 'm6', kind: 'Nature visual', title: 'Northern lights', minutes: 3, scene: 'aurora', text: 'Let the slow ribbons of light carry your attention. Nothing to do but watch.' },
]

export const GROUNDING_STEPS = [
  { n: 5, sense: 'see', prompt: 'Name 5 things you can see', color: '#8B72C7' },
  { n: 4, sense: 'feel', prompt: 'Name 4 things you can feel', color: '#8BCDB5' },
  { n: 3, sense: 'hear', prompt: 'Name 3 things you can hear', color: '#9CC3EE' },
  { n: 2, sense: 'smell', prompt: 'Name 2 things you can smell', color: '#F2A995' },
  { n: 1, sense: 'taste', prompt: 'Name 1 thing you can taste', color: '#F6CF7E' },
]

export const MINDFULNESS_STEPS = [
  'Sit comfortably. Let your hands rest.',
  'Notice the weight of your body where it is supported.',
  'Bring attention to your breath, without changing it.',
  'When your mind wanders, notice where it went — gently return.',
  'Widen your attention to sounds around you.',
  'Take one deeper breath, and come back to your day.',
]
