export const LEARN_CATEGORIES = [
  { id: 'ei', label: 'Emotional intelligence', color: '#8B72C7', tint: 'tint-lilac', icon: 'Brain' },
  { id: 'emotions', label: 'Understanding emotions', color: '#F2A995', tint: 'tint-peach', icon: 'Heart' },
  { id: 'stress', label: 'Stress management', color: '#8BCDB5', tint: 'tint-mint', icon: 'Waves' },
  { id: 'patterns', label: 'Behavioural patterns', color: '#E9A86B', tint: 'tint-sun', icon: 'Repeat' },
  { id: 'relationships', label: 'Relationships', color: '#F19BB8', tint: 'tint-peach', icon: 'Users' },
  { id: 'awareness', label: 'Self-awareness', color: '#9CC3EE', tint: 'tint-sky', icon: 'Eye' },
  { id: 'sleep', label: 'Sleep education', color: '#6E68C8', tint: 'tint-lilac', icon: 'Moon' },
  { id: 'mindfulness', label: 'Mindfulness', color: '#6FBF8F', tint: 'tint-mint', icon: 'Flower2' },
]

const p = (...paras) => paras

export const ARTICLES = [
  {
    id: 'name-it-to-tame-it',
    category: 'emotions',
    title: 'Name it to tame it',
    summary: 'Why labelling a feeling precisely makes it easier to handle.',
    minutes: 4,
    sections: [
      { h: 'The idea', body: p('When we put feelings into words, we often feel a little less overwhelmed by them. Psychologists call this affect labelling.', 'It does not make the feeling disappear — it gives you some distance from it, so you can choose what to do next.') },
      { h: 'Go beyond "bad"', body: p('"Bad" could mean disappointed, embarrassed, lonely or tired. The more precise the word, the clearer the need behind it.') },
      { h: 'Try it', body: p('Next time you check in, pick the closest emotion, then ask: what else is here? Often two feelings sit side by side.') },
    ],
    takeaway: 'A precise label turns a fog into something you can work with.',
  },
  {
    id: 'stress-curve',
    category: 'stress',
    title: 'The stress curve',
    summary: 'A little pressure sharpens you. Too much flattens you.',
    minutes: 5,
    sections: [
      { h: 'Helpful stress', body: p('Short bursts of stress can increase focus and energy — think of the alertness before a presentation.') },
      { h: 'When it tips over', body: p('When pressure stays high without recovery, performance and wellbeing drop. Signs include irritability, poor sleep and difficulty concentrating.') },
      { h: 'Building recovery in', body: p('Recovery is not a reward for finishing everything. Short breaks, movement and sleep keep you on the helpful side of the curve.') },
    ],
    takeaway: 'Notice where you are on the curve — and plan recovery before you need it.',
  },
  {
    id: 'emotional-granularity',
    category: 'ei',
    title: 'Emotional intelligence, simply',
    summary: 'Four skills: noticing, understanding, managing and relating.',
    minutes: 6,
    sections: [
      { h: 'Four skills', body: p('Emotional intelligence is commonly described as perceiving emotions, understanding them, managing them and using them to relate to others.') },
      { h: 'It can grow', body: p('Like any skill, it develops with practice: check-ins, reflection and honest conversations all help.') },
    ],
    takeaway: 'You build emotional intelligence one noticed moment at a time.',
  },
  {
    id: 'habit-loops',
    category: 'patterns',
    title: 'Cue, routine, reward',
    summary: 'How habits form — and how to gently rewire them.',
    minutes: 5,
    sections: [
      { h: 'The loop', body: p('Many habits follow a pattern: a cue triggers a routine, which delivers some kind of reward.') },
      { h: 'Change the routine, keep the cue', body: p('Instead of fighting the cue, swap in a routine that meets the same need. Scrolling to unwind? Try a two-minute stretch first.') },
    ],
    takeaway: 'Make the new routine easy, obvious and satisfying.',
  },
  {
    id: 'repair-conversations',
    category: 'relationships',
    title: 'Repair after conflict',
    summary: 'Small repairs matter more than avoiding every argument.',
    minutes: 4,
    sections: [
      { h: 'Conflict is normal', body: p('Healthy relationships still have disagreements. What matters is how people reconnect afterwards.') },
      { h: 'Repair phrases', body: p('"I see your point." "Can we start over?" "I got defensive — I\'m sorry." Simple, sincere and timely.') },
    ],
    takeaway: 'Reach for repair early — it keeps small hurts from hardening.',
  },
  {
    id: 'values-compass',
    category: 'awareness',
    title: 'Your values compass',
    summary: 'Knowing what matters to you makes decisions lighter.',
    minutes: 5,
    sections: [
      { h: 'Values vs goals', body: p('Goals are things you complete. Values are directions you keep walking in — like kindness, curiosity or growth.') },
      { h: 'Exercise', body: p('Pick three values. For each, write one small action this week that moves you toward it.') },
    ],
    takeaway: 'When stuck, ask which option moves you toward your values.',
  },
  {
    id: 'sleep-pressure',
    category: 'sleep',
    title: 'Sleep pressure & your body clock',
    summary: 'Two systems decide when you feel sleepy.',
    minutes: 6,
    sections: [
      { h: 'Two forces', body: p('Sleep pressure builds the longer you are awake. Your circadian rhythm sets windows of alertness and sleepiness across the day.') },
      { h: 'Work with them', body: p('Consistent wake times, morning daylight and limiting late caffeine help both systems line up.') },
    ],
    takeaway: 'A consistent wake-up time is one of the most powerful sleep habits.',
  },
  {
    id: 'one-minute-mindfulness',
    category: 'mindfulness',
    title: 'One-minute mindfulness',
    summary: 'You do not need an hour. Start with sixty seconds.',
    minutes: 3,
    sections: [
      { h: 'The practice', body: p('Pause. Feel your feet. Notice three breaths. Notice one sound. Return to your day.') },
      { h: 'Why it works', body: p('Brief, frequent practice builds the habit of returning to the present — which is the core skill of mindfulness.') },
    ],
    takeaway: 'Frequency beats duration when you are starting out.',
  },
  {
    id: 'anxiety-alarm',
    category: 'emotions',
    title: 'Anxiety is an alarm, not a verdict',
    summary: 'Understanding the body’s protective response.',
    minutes: 5,
    sections: [
      { h: 'A protective system', body: p('Anxiety is the body preparing for a possible threat. It is useful, but sometimes it fires when no real danger is present.') },
      { h: 'Turning the volume down', body: p('Slow exhalations, grounding and naming the fear can signal safety to your nervous system.') },
    ],
    takeaway: 'The alarm is real; the danger may not be.',
  },
]
