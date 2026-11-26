import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, Check, Clock, Flame, MoreHorizontal, Pencil, SkipForward, Trash2, Undo2 } from 'lucide-react'
import { DynamicIcon } from '../common'
import { HABIT_CATEGORIES } from '../../mock/seed'
import { fmtClock, isoDay } from '../../utils/date'
import { habitStreak } from '../../utils/stats'
import { cn } from '../../utils/cn'

function Burst({ color }) {
  return (
    <span className="pointer-events-none absolute inset-0">
      {Array.from({ length: 8 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
          style={{ background: i % 2 ? color : '#F6CF7E' }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 26, y: Math.sin((i / 8) * Math.PI * 2) * 26, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </span>
  )
}

export function HabitCard({ habit, onStatus, onEdit, onDelete, onReschedule, onToggleReminder }) {
  const [menu, setMenu] = useState(false)
  const [burst, setBurst] = useState(0)
  const cat = HABIT_CATEGORIES.find((c) => c.id === habit.category) || HABIT_CATEGORIES[0]
  const status = habit.history?.[isoDay()]
  const done = status === 'done'
  const skipped = status === 'skipped'
  const streak = habitStreak(habit)

  const complete = () => {
    if (done) onStatus(undefined)
    else {
      onStatus('done')
      setBurst((b) => b + 1)
    }
  }

  const act = (fn) => () => {
    setMenu(false)
    fn()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className={cn('relative flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft transition-colors', done ? 'border-mint/50' : 'border-line/70', skipped && 'opacity-60')}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: cat.color + '2e', color: cat.color }}>
        <DynamicIcon name={cat.icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-[14.5px] font-bold', done ? 'text-muted line-through decoration-2' : 'text-ink')}>{habit.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {fmtClock(habit.time)}
          </span>
          <span>{habit.target}</span>
          {streak > 1 && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-orange-500">
              <Flame className="size-3" />
              {streak}
            </span>
          )}
          {skipped && <span className="font-semibold">Skipped today</span>}
          {habit.reminder && <Bell className="size-3" aria-label="Reminder on" />}
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink" aria-label={`Options for ${habit.name}`} aria-expanded={menu}>
          <MoreHorizontal className="size-5" />
        </button>
        <AnimatePresence>
          {menu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 z-30 mt-1 w-48 rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
              >
                {[
                  skipped
                    ? { label: 'Undo skip', icon: Undo2, fn: () => onStatus(undefined) }
                    : { label: 'Skip today', icon: SkipForward, fn: () => onStatus('skipped'), hide: done },
                  { label: 'Reschedule', icon: Clock, fn: onReschedule },
                  { label: habit.reminder ? 'Turn off reminder' : 'Set reminder', icon: habit.reminder ? BellOff : Bell, fn: onToggleReminder },
                  { label: 'Edit', icon: Pencil, fn: onEdit },
                  { label: 'Delete', icon: Trash2, fn: onDelete, danger: true },
                ]
                  .filter((x) => !x.hide)
                  .map(({ label, icon: Icon, fn, danger }) => (
                    <button
                      key={label}
                      onClick={act(fn)}
                      className={cn('flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold', danger ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-ink hover:bg-surface-2')}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={complete}
        disabled={skipped}
        aria-label={done ? `Mark ${habit.name} as not done` : `Complete ${habit.name}`}
        aria-pressed={done}
        className={cn('relative grid size-11 shrink-0 place-items-center rounded-full border-2 transition-colors', done ? 'border-transparent text-white' : 'border-line text-line hover:border-mint hover:text-mint')}
        style={done ? { background: `linear-gradient(135deg, #8BCDB5, #5FB99A)` } : undefined}
      >
        <motion.span key={String(done)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
          <Check className="size-5" strokeWidth={3} />
        </motion.span>
        {burst > 0 && <Burst key={burst} color={cat.color} />}
      </motion.button>
    </motion.div>
  )
}
