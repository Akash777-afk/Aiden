import { addDays, isoDay, startOfDay } from '../utils/date'

// Deterministic pseudo-random so demo charts look the same every load
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export const HABIT_CATEGORIES = [
  { id: 'wake', label: 'Wake-up routine', icon: 'Sunrise', color: '#F6CF7E' },
  { id: 'hydration', label: 'Hydration', icon: 'Droplets', color: '#9CC3EE' },
  { id: 'activity', label: 'Physical activity', icon: 'Footprints', color: '#8BCDB5' },
  { id: 'sleep', label: 'Sleep routine', icon: 'Moon', color: '#8F86D9' },
  { id: 'mindfulness', label: 'Mindfulness', icon: 'Flower2', color: '#C79AE6' },
  { id: 'journaling', label: 'Journaling', icon: 'NotebookPen', color: '#F2A995' },
  { id: 'reading', label: 'Reading', icon: 'BookOpen', color: '#E9A86B' },
  { id: 'growth', label: 'Personal development', icon: 'Sprout', color: '#6FBF8F' },
]

export function seedHabits() {
  const today = isoDay()
  const r = rng(7)
  const base = [
    { name: 'Wake up without snoozing', category: 'wake', time: '07:00', target: 'Daily' },
    { name: 'Drink 2 glasses of water', category: 'hydration', time: '07:15', target: 'Daily' },
    { name: '20-minute walk', category: 'activity', time: '07:30', target: 'Daily' },
    { name: 'Read 10 pages', category: 'reading', time: '13:30', target: 'Weekdays' },
    { name: '5-minute breathing', category: 'mindfulness', time: '18:00', target: 'Daily' },
    { name: 'Mind declutter journal', category: 'journaling', time: '21:30', target: 'Daily' },
    { name: 'Screens off, wind down', category: 'sleep', time: '22:30', target: 'Daily' },
  ]
  return base.map((h, i) => {
    const history = {}
    for (let d = 1; d <= 34; d++) {
      const day = isoDay(addDays(new Date(), -d))
      const v = r()
      history[day] = v > 0.28 ? 'done' : v > 0.15 ? 'skipped' : 'missed'
    }
    // today: first three done
    history[today] = i < 3 ? 'done' : undefined
    return {
      id: `h${i + 1}`,
      ...h,
      frequency: h.target === 'Weekdays' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6],
      reminder: i % 2 === 0,
      history,
      createdAt: addDays(new Date(), -40).toISOString(),
    }
  })
}

export function seedCheckins() {
  const r = rng(21)
  const ids = ['calm', 'happy', 'okay', 'stressed', 'anxious', 'calm', 'happy', 'okay', 'sad', 'frustrated']
  const notes = [
    'Good sleep and a slow morning.',
    'Deadline pressure at work.',
    'Long call with an old friend.',
    'Felt a bit off after the meeting.',
    '',
    'Evening walk helped a lot.',
    '',
  ]
  const list = []
  for (let d = 1; d <= 45; d++) {
    if (r() < 0.18) continue
    const day = addDays(startOfDay(), -d)
    day.setHours(8 + Math.floor(r() * 13), Math.floor(r() * 60))
    list.push({
      id: `c${d}`,
      emotion: ids[Math.floor(r() * ids.length)],
      intensity: 1 + Math.floor(r() * 5),
      note: notes[Math.floor(r() * notes.length)],
      triggers: r() > 0.5 ? ['Work'] : r() > 0.5 ? ['Sleep'] : [],
      at: day.toISOString(),
    })
  }
  return list
}

export function seedSleepLogs() {
  const r = rng(33)
  return Array.from({ length: 21 }, (_, i) => {
    const d = addDays(startOfDay(), -(i + 1))
    const hours = +(5.6 + r() * 2.8).toFixed(1)
    return {
      id: `s${i}`,
      date: isoDay(d),
      bedtime: ['22:45', '23:10', '23:30', '00:15', '22:30'][Math.floor(r() * 5)],
      wake: ['06:45', '07:00', '07:20', '06:30'][Math.floor(r() * 4)],
      hours,
      quality: Math.max(1, Math.min(5, Math.round(hours - 3 + r()))),
      note: '',
    }
  })
}

export function seedJournal() {
  const now = new Date()
  return [
    {
      id: 'j1',
      title: 'A quieter Sunday',
      body: 'Spent the morning without my phone. It felt strange for the first hour, then surprisingly light. I want to protect more mornings like this.',
      tags: ['gratitude', 'rest'],
      mood: 'calm',
      at: addDays(now, -1).toISOString(),
    },
    {
      id: 'j2',
      title: 'Before the review meeting',
      body: 'I keep rehearsing worst-case scenarios. Writing them down makes them look smaller. What I can control: preparing my three key points and getting sleep.',
      tags: ['work', 'anxiety'],
      mood: 'anxious',
      at: addDays(now, -3).toISOString(),
    },
    {
      id: 'j3',
      title: 'Small win',
      body: 'Finished the walk four days in a row. Noticing I sleep better on walk days.',
      tags: ['habits', 'win'],
      mood: 'happy',
      at: addDays(now, -6).toISOString(),
    },
    {
      id: 'j4',
      title: 'Conversation with Amma',
      body: 'We talked about moving cities. I felt guilty but also understood. Need to give it more time.',
      tags: ['family', 'reflection'],
      mood: 'okay',
      at: addDays(now, -11).toISOString(),
    },
  ]
}

export function seedDecisions() {
  return [
    {
      id: 'd1',
      title: 'Should I switch teams at work?',
      createdAt: addDays(new Date(), -5).toISOString(),
      thoughts: {
        happening: 'A new team has an opening that matches my interests.',
        thinking: "I'm worried I'll let my current manager down.",
        feeling: 'Excited but guilty.',
        assumptions: 'That my manager will take it personally.',
        worry: 'Starting over and not being good enough.',
      },
      actions: [
        {
          id: 'a1',
          label: 'Talk to my manager openly',
          benefits: 'Clarity and goodwill; may get support.',
          risks: 'Uncomfortable conversation.',
          short: 'Some awkwardness this week.',
          long: 'Healthier relationship either way.',
          uncertainties: 'How they will react.',
          rating: 4,
        },
        {
          id: 'a2',
          label: 'Wait until next quarter',
          benefits: 'More time to think.',
          risks: 'Opening may close.',
          short: 'Relief now.',
          long: 'Possible regret.',
          uncertainties: 'Whether another role appears.',
          rating: 2,
        },
      ],
      chosen: 'a1',
      reflection: 'I value growth and honesty. Talking openly aligns with both.',
      extraNodes: [],
      extraEdges: [],
    },
  ]
}

export const SEED_NOTIFICATIONS = [
  { id: 'n1', title: 'Time for your 5-minute breathing', body: 'A short pause can reset your afternoon.', at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), read: false, to: '/pause/breathe', kind: 'reminder' },
  { id: 'n2', title: 'Weekly insight ready', body: 'You felt calmer on days you walked. Take a look.', at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), read: false, to: '/insights', kind: 'insight' },
  { id: 'n3', title: 'New in Learn: The stress curve', body: 'Why a little stress helps and too much hurts.', at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), read: true, to: '/learn/stress-curve', kind: 'content' },
]
