import { motion } from 'framer-motion'
import { CalendarX2 } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { professionalsService } from '../../services/professionals'
import { addDays, fmtClock, isoDay, startOfDay } from '../../utils/date'
import { ErrorState, Skeleton } from '../common'
import { cn } from '../../utils/cn'

export function DateStrip({ value, onChange, days = 14 }) {
  const start = startOfDay()
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {Array.from({ length: days }, (_, i) => {
        const d = addDays(start, i)
        const active = value && isoDay(value) === isoDay(d)
        const sunday = d.getDay() === 0
        return (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            key={i}
            disabled={sunday}
            onClick={() => onChange(d)}
            aria-pressed={active}
            aria-label={d.toDateString() + (sunday ? ' (unavailable)' : '')}
            className={cn(
              'flex w-[58px] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition',
              active ? 'border-transparent bg-gradient-to-b from-primary to-[#A97FD6] text-white shadow-glow' : 'border-line bg-surface text-ink hover:border-primary/40',
              sunday && 'opacity-40',
            )}
          >
            <span className={cn('text-[11px] font-semibold', active ? 'text-white/80' : 'text-muted')}>{i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
            <span className="text-lg font-extrabold">{d.getDate()}</span>
            <span className={cn('text-[10px]', active ? 'text-white/80' : 'text-muted')}>{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

export function SlotGrid({ proId, date, value, onChange }) {
  const { data, loading, error, retry } = useAsync(() => professionalsService.slots(proId, date), [proId, date && isoDay(date)])
  if (loading)
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    )
  if (error) return <ErrorState error={error} onRetry={retry} />
  const any = data.some((s) => s.available)
  if (!any)
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
        <CalendarX2 className="size-5" /> No slots left on this day. Try another date.
      </div>
    )
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {data.map((s) => (
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          key={s.time}
          disabled={!s.available}
          onClick={() => onChange(s.time)}
          aria-pressed={value === s.time}
          className={cn(
            'h-11 rounded-xl border text-sm font-semibold transition',
            value === s.time ? 'border-primary bg-primary text-white shadow-glow' : 'border-line bg-surface text-ink hover:border-primary/50',
            !s.available && 'cursor-not-allowed border-dashed text-muted line-through opacity-50',
          )}
        >
          {fmtClock(s.time)}
        </motion.button>
      ))}
    </div>
  )
}
