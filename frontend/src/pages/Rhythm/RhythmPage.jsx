import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Sparkles, ChevronRight, CalendarCheck2, PartyPopper } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, Chip, ConfirmDialog, DynamicIcon, EmptyState, Input, Modal, Page, PageHeader, ProgressRing, Segmented } from '../../components/common'
import { HabitCard } from '../../components/rhythm/HabitCard'
import { HabitFormModal } from '../../components/rhythm/HabitFormModal'
import { ChartCard, ChartTooltip, axisProps } from '../../components/insights/ChartCard'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { HABIT_CATEGORIES } from '../../mock/seed'
import { addDays, fmtClock, isoDay, startOfDay, weekDays } from '../../utils/date'
import { dayCompletion, habitsForDay, weeklyHabitSeries } from '../../utils/stats'
import { cn } from '../../utils/cn'

const STATUS_STYLE = {
  done: 'bg-mint text-white',
  skipped: 'bg-amber-200 text-amber-700 dark:bg-amber-400/30 dark:text-amber-200',
  missed: 'bg-rose-100 text-rose-400 dark:bg-rose-500/15',
}

function WeekView({ habits }) {
  const days = weekDays()
  const series = weeklyHabitSeries(habits)
  const today = startOfDay()
  return (
    <div className="space-y-4">
      <ChartCard
        title="This week"
        subtitle="Daily completion"
        value={`${Math.round(series.filter((d) => !d.future).reduce((a, d) => a + d.pct, 0) / Math.max(1, series.filter((d) => !d.future).length))}%`}
        valueLabel="average"
        table={{ columns: ['Day', 'Done', 'Scheduled', '%'], rows: series.map((d) => [d.day, d.done, d.total, d.future ? '—' : d.pct + '%']) }}
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--c-line)" strokeDasharray="3 3" />
              <XAxis dataKey="day" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} ticks={[0, 50, 100]} unit="%" />
              <Tooltip cursor={{ fill: 'var(--c-surface-2)' }} content={<ChartTooltip format={(v) => `${v}%`} />} />
              <Bar dataKey="pct" name="Completed" fill="#8B72C7" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <Card className="overflow-x-auto p-4">
        <h3 className="mb-3 text-[15px] font-bold text-ink">Weekly history</h3>
        <table className="w-full min-w-[420px] text-left">
          <thead>
            <tr>
              <th className="pb-2 text-xs font-semibold text-muted">Habit</th>
              {days.map((d) => (
                <th key={isoDay(d)} className="pb-2 text-center text-[11px] font-semibold text-muted">
                  {d.toLocaleDateString('en-IN', { weekday: 'narrow' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id} className="border-t border-line">
                <td className="max-w-[140px] truncate py-2 pr-2 text-[13px] font-semibold text-ink">{h.name}</td>
                {days.map((d) => {
                  const key = isoDay(d)
                  const scheduled = h.frequency.includes(d.getDay())
                  const s = h.history[key] || (d < today && scheduled ? 'missed' : null)
                  return (
                    <td key={key} className="py-2 text-center">
                      <span
                        className={cn('mx-auto grid size-6 place-items-center rounded-full text-[10px] font-bold', s ? STATUS_STYLE[s] : scheduled ? 'border border-dashed border-line' : 'bg-transparent')}
                        title={`${key}: ${s || (scheduled ? 'pending' : 'not scheduled')}`}
                      >
                        {s === 'done' ? '✓' : s === 'skipped' ? '–' : ''}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-mint" />Done</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-amber-200" />Skipped</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-rose-100" />Missed</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border border-dashed border-line" />Pending</span>
        </div>
      </Card>
    </div>
  )
}

function MonthView({ habits }) {
  const [offset, setOffset] = useState(0)
  const ref = new Date()
  ref.setDate(1)
  ref.setMonth(ref.getMonth() + offset)
  const first = startOfDay(ref)
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7
  const today = startOfDay()
  const cells = Array.from({ length: daysIn }, (_, i) => {
    const d = addDays(first, i)
    return { d, ...dayCompletion(habits, d), future: d > today }
  })
  const past = cells.filter((c) => !c.future && c.total)
  const avg = past.length ? Math.round((past.reduce((a, c) => a + c.pct, 0) / past.length) * 100) : 0
  const perfect = past.filter((c) => c.pct === 1).length
  // single-hue sequential ramp (light → dark purple)
  const shade = (p) => (p === 0 ? 'var(--c-surface-2)' : p < 0.34 ? '#E5DAF8' : p < 0.67 ? '#C1A9EC' : p < 1 ? '#9A7AD6' : '#6F4FB8')

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2" aria-label="Previous month">
          ‹
        </button>
        <h3 className="font-bold text-ink">{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
        <button disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2 disabled:opacity-30" aria-label="Next month">
          ›
        </button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-2 p-3">
          <div className="text-xl font-extrabold text-ink">{avg}%</div>
          <div className="text-xs text-muted">average completion</div>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3">
          <div className="text-xl font-extrabold text-ink">{perfect}</div>
          <div className="text-xs text-muted">perfect days</div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="pb-1 text-[11px] font-semibold text-muted">
            {d}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={'l' + i} />
        ))}
        {cells.map((c) => (
          <motion.div
            key={isoDay(c.d)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            title={`${c.d.toDateString()}: ${c.future ? 'upcoming' : `${c.done}/${c.total} done`}`}
            className={cn('grid aspect-square place-items-center rounded-xl text-xs font-semibold', c.future ? 'border border-dashed border-line text-muted' : c.pct >= 0.67 ? 'text-white' : 'text-ink', isoDay(c.d) === isoDay(today) && 'ring-2 ring-primary ring-offset-2 ring-offset-surface')}
            style={c.future ? undefined : { background: shade(c.pct) }}
          >
            {c.d.getDate()}
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        Less
        {[0, 0.2, 0.5, 0.8, 1].map((p) => (
          <span key={p} className="size-3.5 rounded" style={{ background: shade(p) }} />
        ))}
        More
      </div>
    </Card>
  )
}

export default function RhythmPage() {
  const { habits, addHabit, updateHabit, deleteHabit, setHabitStatus, routine } = useData()
  const toast = useToast()
  const nav = useNavigate()
  const [view, setView] = useState('today')
  const [cat, setCat] = useState('all')
  const [form, setForm] = useState({ open: false, habit: null })
  const [delId, setDelId] = useState(null)
  const [resched, setResched] = useState(null)
  const [newTime, setNewTime] = useState('')

  const today = isoDay()
  const todays = useMemo(() => habitsForDay(habits, new Date()).filter((h) => cat === 'all' || h.category === cat).sort((a, b) => a.time.localeCompare(b.time)), [habits, cat])
  const all = habitsForDay(habits, new Date())
  const done = all.filter((h) => h.history[today] === 'done').length
  const skipped = all.filter((h) => h.history[today] === 'skipped').length
  const pending = all.length - done - skipped
  const pct = all.length ? done / all.length : 0
  const pendingList = todays.filter((h) => !h.history[today])
  const doneList = todays.filter((h) => h.history[today])

  const save = (v) => {
    if (form.habit) {
      updateHabit(form.habit.id, v)
      toast('Habit updated')
    } else {
      addHabit(v)
      toast(`“${v.name}” added to your rhythm`)
    }
    setForm({ open: false, habit: null })
  }

  const setStatus = (h, s) => {
    setHabitStatus(h.id, s)
    if (s === 'done') {
      const willBe = done + 1
      if (willBe === all.length - skipped && pending === 1) toast('All done for today! 🎉 Beautiful rhythm.')
    } else if (s === 'skipped') toast('Skipped for today — that’s okay.', { type: 'info', action: { label: 'Undo', onClick: () => setHabitStatus(h.id, undefined) } })
  }

  const usedCats = HABIT_CATEGORIES.filter((c) => habits.some((h) => h.category === c.id))

  return (
    <Page>
      <PageHeader
        back="/"
        eyebrow="Rhythm"
        title="Habit Tracker"
        subtitle="Small steps, steady rhythm."
        actions={
          <Button icon={Plus} onClick={() => setForm({ open: true, habit: null })} className="max-sm:size-11 max-sm:gap-0 max-sm:px-0" aria-label="Add habit">
            <span className="max-sm:hidden">Add habit</span>
          </Button>
        }
      />

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Summary */}
          <Card className="tint-mint relative overflow-hidden border-0 p-5">
            <div className="flex items-center gap-5">
              <ProgressRing value={pct} size={108} stroke={11} color="#3FA872" track="rgba(255,255,255,0.6)">
                <div>
                  <div className="text-2xl font-extrabold">{Math.round(pct * 100)}%</div>
                  <div className="-mt-0.5 text-[11px] opacity-80">today</div>
                </div>
              </ProgressRing>
              <div className="flex-1">
                <div className="text-lg font-extrabold">{pct === 1 ? 'Rhythm complete!' : pct >= 0.5 ? 'Great momentum' : 'Let’s get going'}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Done', done],
                    ['Pending', pending],
                    ['Skipped', skipped],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-white/50 py-2 dark:bg-black/15">
                      <div className="text-lg leading-none font-extrabold">{v}</div>
                      <div className="mt-1 text-[10.5px] opacity-80">{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Segmented
            value={view}
            onChange={setView}
            className="w-full"
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />

          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {view === 'today' && (
                <div className="space-y-4">
                  {usedCats.length > 1 && (
                    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                      <Chip active={cat === 'all'} onClick={() => setCat('all')}>
                        All
                      </Chip>
                      {usedCats.map((c) => (
                        <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                          {c.label}
                        </Chip>
                      ))}
                    </div>
                  )}
                  {habits.length === 0 ? (
                    <EmptyState icon={CalendarCheck2} title="No habits yet" message="Start with one small habit you can do in under 5 minutes." action="Add your first habit" onAction={() => setForm({ open: true, habit: null })} />
                  ) : todays.length === 0 ? (
                    <EmptyState icon={CalendarCheck2} title="Nothing scheduled" message="No habits in this category today." />
                  ) : (
                    <>
                      {pendingList.length === 0 && (
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-lavender/70 to-mint/40 p-4 dark:from-primary/30 dark:to-mint/10">
                          <PartyPopper className="size-7 text-primary" />
                          <div>
                            <div className="font-bold text-ink">You’ve completed today’s rhythm</div>
                            <div className="text-xs text-muted">Rest well — consistency beats intensity.</div>
                          </div>
                        </motion.div>
                      )}
                      {pendingList.length > 0 && <h3 className="text-sm font-bold text-muted">Pending · {pendingList.length}</h3>}
                      <motion.div layout className="space-y-2.5">
                        <AnimatePresence>
                          {pendingList.map((h) => (
                            <HabitCard
                              key={h.id}
                              habit={h}
                              onStatus={(s) => setStatus(h, s)}
                              onEdit={() => setForm({ open: true, habit: h })}
                              onDelete={() => setDelId(h.id)}
                              onReschedule={() => {
                                setResched(h)
                                setNewTime(h.time)
                              }}
                              onToggleReminder={() => {
                                updateHabit(h.id, { reminder: !h.reminder })
                                toast(h.reminder ? 'Reminder turned off' : `Reminder set for ${fmtClock(h.time)} (demo)`)
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>
                      {doneList.length > 0 && <h3 className="pt-2 text-sm font-bold text-muted">Completed & skipped · {doneList.length}</h3>}
                      <motion.div layout className="space-y-2.5">
                        <AnimatePresence>
                          {doneList.map((h) => (
                            <HabitCard
                              key={h.id}
                              habit={h}
                              onStatus={(s) => setStatus(h, s)}
                              onEdit={() => setForm({ open: true, habit: h })}
                              onDelete={() => setDelId(h.id)}
                              onReschedule={() => {
                                setResched(h)
                                setNewTime(h.time)
                              }}
                              onToggleReminder={() => updateHabit(h.id, { reminder: !h.reminder })}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    </>
                  )}
                </div>
              )}
              {view === 'week' && <WeekView habits={habits} />}
              {view === 'month' && <MonthView habits={habits} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Routine recommendation */}
        <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card interactive onClick={() => nav('/rhythm/routine')} className="tint-lilac relative overflow-hidden border-0 p-5">
            <Sparkles className="absolute top-4 right-4 size-5 opacity-60" />
            <div className="text-xs font-bold tracking-wider uppercase opacity-70">Suggested for you</div>
            <div className="mt-1 text-lg font-extrabold">Your daily rhythm</div>
            <ol className="mt-3 space-y-2">
              {routine.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <span className="w-[68px] shrink-0 font-semibold opacity-75">{fmtClock(r.time)}</span>
                  <DynamicIcon name={r.icon} className="size-4 shrink-0" />
                  <span className="font-semibold">{r.label}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-center gap-1 text-sm font-bold">
              Customise routine <ChevronRight className="size-4" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold text-ink">Tip</div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">Anchor a new habit to an existing one: “After I brush my teeth, I’ll drink a glass of water.”</p>
          </Card>
        </div>
      </div>

      <HabitFormModal open={form.open} habit={form.habit} onClose={() => setForm({ open: false, habit: null })} onSave={save} />
      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={() => {
          const h = habits.find((x) => x.id === delId)
          deleteHabit(delId)
          setDelId(null)
          toast('Habit deleted', { action: { label: 'Undo', onClick: () => addHabit(h) } })
        }}
        title="Delete this habit?"
        message="Its history will be removed too."
        confirmLabel="Delete"
      />
      <Modal
        open={!!resched}
        onClose={() => setResched(null)}
        title="Reschedule"
        subtitle={resched?.name}
        footer={
          <Button
            className="w-full"
            disabled={!newTime}
            onClick={() => {
              updateHabit(resched.id, { time: newTime })
              toast(`Moved to ${fmtClock(newTime)}`)
              setResched(null)
            }}
          >
            Save new time
          </Button>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {['+30 min', '+1 hour', 'This evening'].map((l, i) => (
              <Chip
                key={l}
                onClick={() => {
                  if (i === 2) return setNewTime('19:00')
                  const [h, m] = (resched?.time || '08:00').split(':').map(Number)
                  const t = h * 60 + m + (i === 0 ? 30 : 60)
                  setNewTime(`${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
                }}
              >
                {l}
              </Chip>
            ))}
          </div>
          <Input label="New time" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
        </div>
      </Modal>
    </Page>
  )
}
