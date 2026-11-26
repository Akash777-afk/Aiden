export const DAY = 86400000

export function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export function isoDay(d = new Date()) {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export function sameDay(a, b) {
  return isoDay(a) === isoDay(b)
}
export function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
export function fmtDate(d, opts = { day: 'numeric', month: 'short' }) {
  return new Date(d).toLocaleDateString('en-IN', opts)
}
export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}
export function fmtClock(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`
}
export function relTime(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(d)
}
export function weekDays(ref = new Date()) {
  // Monday-start week containing ref
  const d = startOfDay(ref)
  const dow = (d.getDay() + 6) % 7
  const mon = addDays(d, -dow)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
}
export function fmtDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
