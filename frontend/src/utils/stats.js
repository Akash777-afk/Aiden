import { addDays, isoDay, startOfDay, weekDays } from './date'
import { emotionById } from './emotions'

export function habitsForDay(habits, date) {
  const dow = new Date(date).getDay()
  return habits.filter((h) => h.frequency?.includes(dow))
}

export function dayCompletion(habits, date) {
  const list = habitsForDay(habits, date)
  const key = isoDay(date)
  const done = list.filter((h) => h.history?.[key] === 'done').length
  return { done, total: list.length, pct: list.length ? done / list.length : 0 }
}

export function weeklyHabitSeries(habits, ref = new Date()) {
  const today = startOfDay()
  return weekDays(ref).map((d) => {
    const { done, total, pct } = dayCompletion(habits, d)
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: isoDay(d),
      done,
      total,
      pct: Math.round(pct * 100),
      future: d > today,
    }
  })
}

export function rangeHabitSeries(habits, days) {
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(startOfDay(), -(days - 1 - i))
    const { pct } = dayCompletion(habits, d)
    return { label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), short: days > 7 ? String(d.getDate()) : d.toLocaleDateString('en-IN', { weekday: 'short' }), pct: Math.round(pct * 100) }
  })
}

export function habitStreak(habit) {
  let n = 0
  for (let i = 0; i < 365; i++) {
    const d = addDays(startOfDay(), -i)
    const s = habit.history?.[isoDay(d)]
    if (s === 'done') n++
    else if (i === 0) continue // today not done yet doesn't break streak
    else if (!habit.frequency.includes(d.getDay())) continue
    else break
  }
  return n
}

export function moodSeries(checkins, days) {
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(startOfDay(), -(days - 1 - i))
    const key = isoDay(d)
    const items = checkins.filter((c) => isoDay(c.at) === key)
    const avg = items.length ? items.reduce((a, c) => a + emotionById(c.emotion).score, 0) / items.length : null
    return {
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      short: days > 7 ? String(d.getDate()) : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      mood: avg == null ? null : +avg.toFixed(1),
      count: items.length,
      top: items[0]?.emotion,
    }
  })
}

export function emotionDistribution(checkins, days) {
  const since = addDays(startOfDay(), -days + 1)
  const map = {}
  checkins.filter((c) => new Date(c.at) >= since).forEach((c) => (map[c.emotion] = (map[c.emotion] || 0) + 1))
  return Object.entries(map)
    .map(([id, value]) => ({ id, value, ...emotionById(id) }))
    .sort((a, b) => b.value - a.value)
}

export function sleepSeries(logs, days) {
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(startOfDay(), -(days - 1 - i))
    const log = logs.find((l) => l.date === isoDay(d))
    return {
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      short: days > 7 ? String(d.getDate()) : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      hours: log?.hours ?? null,
      quality: log?.quality ?? null,
    }
  })
}

export function journalSeries(entries, days) {
  const buckets = days > 7 ? 4 : 7
  if (buckets === 7) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(startOfDay(), -(6 - i))
      return { short: d.toLocaleDateString('en-IN', { weekday: 'short' }), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), entries: entries.filter((e) => isoDay(e.at) === isoDay(d)).length }
    })
  }
  return Array.from({ length: 4 }, (_, i) => {
    const end = addDays(startOfDay(), -(3 - i) * 7 + 1)
    const start = addDays(end, -7)
    return { short: `Wk ${i + 1}`, label: `Week of ${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, entries: entries.filter((e) => new Date(e.at) >= start && new Date(e.at) < end).length }
  })
}

export function checkinStreak(checkins) {
  const days = new Set(checkins.map((c) => isoDay(c.at)))
  let n = 0
  for (let i = 0; i < 365; i++) {
    const key = isoDay(addDays(startOfDay(), -i))
    if (days.has(key)) n++
    else if (i === 0) continue
    else break
  }
  return n
}
