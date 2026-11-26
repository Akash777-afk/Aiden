import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ChevronRight, Moon, NotebookPen, Sprout } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Card, ProgressRing, SectionHeader } from '../common'
import { ChartTooltip, axisProps } from '../insights/ChartCard'
import { useData } from '../../context/DataContext'
import { weeklyHabitSeries, sleepSeries, checkinStreak } from '../../utils/stats'
import { addDays, isoDay, startOfDay } from '../../utils/date'
import { emotionById } from '../../utils/emotions'

const STEPS = [
  { id: 'chat', label: 'Chat' },
  { id: 'habit', label: 'Habit' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'reflect', label: 'Reflect' },
  { id: 'grow', label: 'Grow' },
]

export function GrowthStepper() {
  const { growthSteps } = useData()
  const nav = useNavigate()
  const doneCount = STEPS.filter((s) => growthSteps[s.id]).length
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint/25 text-emerald-600 dark:text-mint">
          <Sprout className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-extrabold text-ink">Your Progress</h3>
          <p className="text-[13px] text-muted">A more balanced you, step by step.</p>
        </div>
        <button onClick={() => nav('/insights')} className="flex items-center gap-0.5 text-[13px] font-medium text-muted hover:text-ink">
          This Week <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="relative mt-5 px-2">
        <div className="absolute top-[15px] right-[10%] left-[10%] h-1 rounded-full bg-line" />
        <motion.div
          className="absolute top-[15px] left-[10%] h-1 rounded-full bg-gradient-to-r from-primary to-[#B28BE0]"
          initial={{ width: 0 }}
          animate={{ width: `${(Math.max(0, doneCount - 1) / (STEPS.length - 1)) * 80}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <ol className="relative grid grid-cols-5">
          {STEPS.map((s, i) => {
            const done = growthSteps[s.id]
            return (
              <li key={s.id} className="flex flex-col items-center gap-1.5">
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className={`grid size-8 place-items-center rounded-full border-2 ${done ? 'border-primary bg-gradient-to-br from-primary to-[#B28BE0] text-white shadow-glow' : 'border-line bg-surface'}`}
                >
                  {done && <Check className="size-4" strokeWidth={3} />}
                </motion.span>
                <span className={`text-[12px] font-medium ${done ? 'text-ink' : 'text-muted'}`}>{s.label}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </Card>
  )
}

export function ProgressOverview() {
  const { habits, checkins, sleepLogs, journal } = useData()
  const nav = useNavigate()

  const week = useMemo(() => weeklyHabitSeries(habits), [habits])
  const past = week.filter((d) => !d.future)
  const weekPct = past.length ? Math.round(past.reduce((a, d) => a + d.pct, 0) / past.length) : 0

  const last7 = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfDay(), -(6 - i))
        const c = checkins.find((x) => isoDay(x.at) === isoDay(d))
        return { d, c }
      }),
    [checkins],
  )
  const streak = checkinStreak(checkins)
  const sleep = useMemo(() => sleepSeries(sleepLogs, 7), [sleepLogs])
  const sleepLogged = sleep.filter((s) => s.hours != null)
  const avgSleep = sleepLogged.length ? (sleepLogged.reduce((a, s) => a + s.hours, 0) / sleepLogged.length).toFixed(1) : '—'
  const weekAgo = addDays(startOfDay(), -6)
  const journalWeek = journal.filter((e) => new Date(e.at) >= weekAgo).length

  return (
    <section>
      <SectionHeader title="This week at a glance" action="Insights" onAction={() => nav('/insights')} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Habits */}
        <Card interactive onClick={() => nav('/rhythm')} className="col-span-2 flex items-center gap-4 p-4 lg:col-span-2">
          <ProgressRing value={weekPct / 100} size={84} stroke={9} gradient={['#8BCDB5', '#8B72C7']}>
            <div>
              <div className="text-lg font-extrabold text-ink">{weekPct}%</div>
              <div className="-mt-0.5 text-[10px] text-muted">habits</div>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink">Weekly habit completion</div>
            <div className="h-[72px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" {...axisProps} interval={0} tick={{ ...axisProps.tick, fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'var(--c-surface-2)' }} content={<ChartTooltip format={(v) => `${v}%`} />} />
                  <Bar dataKey="pct" name="Completed" radius={[4, 4, 4, 4]} maxBarSize={14}>
                    {week.map((d) => (
                      <Cell key={d.date} fill={d.future ? 'var(--c-line)' : '#8B72C7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Check-ins */}
        <Card interactive onClick={() => nav('/pulse')} className="p-4">
          <div className="text-sm font-bold text-ink">Check-ins</div>
          <div className="text-xs text-muted">{streak > 0 ? `${streak}-day streak 🔥` : 'Check in to start a streak'}</div>
          <div className="mt-3 grid grid-cols-7 gap-0.5">
            {last7.map(({ d, c }) => (
              <div key={isoDay(d)} className="flex flex-col items-center gap-1" title={c ? emotionById(c.emotion).label : 'No check-in'}>
                <span
                  className="grid size-[22px] place-items-center rounded-full text-[11px]"
                  style={{ background: c ? emotionById(c.emotion).color + '55' : 'var(--c-surface-2)' }}
                >
                  {c ? emotionById(c.emotion).emoji : ''}
                </span>
                <span className="text-[9px] text-muted">{d.toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sleep + journal */}
        <div className="grid grid-rows-2 gap-3">
          <Card interactive onClick={() => nav('/sleep')} className="flex items-center gap-3 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#5b5fb8]/15 text-[#5b5fb8] dark:text-[#a7a3f0]">
              <Moon className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] leading-tight font-extrabold text-ink">{avgSleep}h</div>
              <div className="truncate text-[11px] text-muted">avg sleep · {sleepLogged.length} logs</div>
            </div>
          </Card>
          <Card interactive onClick={() => nav('/journal')} className="flex items-center gap-3 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral/20 text-rose-500 dark:text-coral">
              <NotebookPen className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] leading-tight font-extrabold text-ink">{journalWeek}</div>
              <div className="truncate text-[11px] text-muted">journal entries</div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
