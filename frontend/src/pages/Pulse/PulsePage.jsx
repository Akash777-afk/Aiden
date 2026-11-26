import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { HeartPulse, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Button, Card, Chip, ConfirmDialog, EmotionSelector, EmptyState, Modal, Page, PageHeader, SectionHeader, Textarea } from '../../components/common'
import { ChartCard, ChartTooltip, axisProps } from '../../components/insights/ChartCard'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { emotionById } from '../../utils/emotions'
import { addDays, fmtDate, fmtTime, isoDay, startOfDay } from '../../utils/date'
import { emotionDistribution, checkinStreak } from '../../utils/stats'
import { cn } from '../../utils/cn'

const TRIGGERS = ['Work', 'Sleep', 'Relationships', 'Family', 'Health', 'Money', 'Studies', 'Exercise', 'Weather', 'Social media']
const INTENSITY = ['Very mild', 'Mild', 'Moderate', 'Strong', 'Very strong']

function CheckinForm() {
  const [params] = useSearchParams()
  const { addCheckin } = useData()
  const toast = useToast()
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { emotion: params.get('emotion') || '', intensity: 3, triggers: [], note: '' } })
  const emotion = watch('emotion')
  const intensity = watch('intensity')
  const color = emotion ? emotionById(emotion).color : '#8B72C7'

  const submit = handleSubmit(async (v) => {
    await new Promise((r) => setTimeout(r, 350))
    addCheckin({ ...v, note: v.note.trim(), intensity: +v.intensity })
    toast(`Check-in saved ${emotionById(v.emotion).emoji}`)
    reset({ emotion: '', intensity: 3, triggers: [], note: '' })
  })

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <div className="mb-2 text-sm font-bold text-ink">How are you feeling right now?</div>
          <Controller name="emotion" control={control} rules={{ required: 'Pick the emotion that fits best' }} render={({ field }) => <EmotionSelector value={field.value} onChange={field.onChange} compact />} />
          {errors.emotion && <p className="mt-1 text-xs font-medium text-rose-500">{errors.emotion.message}</p>}
        </div>
        <AnimatePresence>
          {emotion && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold text-ink">Intensity</span>
                  <span className="font-semibold" style={{ color }}>
                    {INTENSITY[intensity - 1]}
                  </span>
                </div>
                <input type="range" min={1} max={5} step={1} {...register('intensity', { valueAsNumber: true })} className="aiden-range w-full" style={{ '--fill': `${((intensity - 1) / 4) * 100}%`, '--range-color': color }} aria-label="Intensity" />
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-ink">What’s influencing this? <span className="font-normal text-muted">(optional)</span></div>
                <Controller
                  name="triggers"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {TRIGGERS.map((t) => (
                        <Chip key={t} active={field.value.includes(t)} onClick={() => field.onChange(field.value.includes(t) ? field.value.filter((x) => x !== t) : [...field.value, t])}>
                          {t}
                        </Chip>
                      ))}
                    </div>
                  )}
                />
              </div>
              <Textarea label="Reflection (optional)" rows={3} placeholder="What happened? What do you need right now?" error={errors.note?.message} {...register('note', { maxLength: { value: 500, message: 'Max 500 characters' } })} />
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                Save check-in
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Card>
  )
}

function MoodCalendar({ checkins, onDay }) {
  const [offset, setOffset] = useState(0)
  const ref = new Date()
  ref.setDate(1)
  ref.setMonth(ref.getMonth() + offset)
  const first = startOfDay(ref)
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7
  const byDay = useMemo(() => {
    const m = {}
    checkins.forEach((c) => (m[isoDay(c.at)] ||= []).push(c))
    return m
  }, [checkins])
  const today = isoDay()
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </button>
        <h3 className="font-bold text-ink">{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
        <button disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 disabled:opacity-30" aria-label="Next month">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[11px] font-semibold text-muted">
            {d}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={'l' + i} />
        ))}
        {Array.from({ length: daysIn }, (_, i) => {
          const d = addDays(first, i)
          const k = isoDay(d)
          const list = byDay[k]
          const e = list && emotionById(list[0].emotion)
          return (
            <button
              key={k}
              disabled={!list}
              onClick={() => onDay(k, list)}
              className={cn('flex aspect-square flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition', list ? 'hover:scale-105' : 'text-muted', k === today && 'ring-2 ring-primary')}
              style={{ background: e ? e.color + '40' : 'var(--c-surface-2)' }}
              aria-label={`${d.toDateString()}${e ? `: ${e.label}` : ''}`}
            >
              <span className="text-base leading-none sm:text-lg">{e ? e.emoji : ''}</span>
              <span className={e ? 'text-ink/70' : ''}>{d.getDate()}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default function PulsePage() {
  const { checkins, deleteCheckin } = useData()
  const toast = useToast()
  const [range, setRange] = useState(7)
  const [dayView, setDayView] = useState(null)
  const [delId, setDelId] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const dist = useMemo(() => emotionDistribution(checkins, range), [checkins, range])
  const weekCount = checkins.filter((c) => new Date(c.at) >= addDays(startOfDay(), -6)).length
  const top = dist[0]
  const sorted = [...checkins].sort((a, b) => new Date(b.at) - new Date(a.at))
  const history = showAll ? sorted : sorted.slice(0, 6)

  return (
    <Page>
      <PageHeader back="/" eyebrow="Pulse" title="Emotional check-ins" subtitle="Notice, name and understand your feelings." />
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <CheckinForm />
          <section>
            <SectionHeader title="Mood calendar" subtitle="Tap a day to see its check-ins" />
            <MoodCalendar checkins={checkins} onDay={(k, list) => setDayView({ k, list })} />
          </section>
        </div>
        <div className="space-y-6">
          <section>
            <SectionHeader title="Summary" />
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                ['Check-ins', weekCount, 'this week'],
                ['Streak', checkinStreak(checkins), 'days'],
                ['Most felt', top ? top.emoji : '—', top ? top.label : ''],
              ].map(([k, v, s]) => (
                <Card key={k} className="p-3 text-center">
                  <div className="text-xl font-extrabold text-ink">{v}</div>
                  <div className="text-[11px] text-muted">
                    {k}
                    <br />
                    {s}
                  </div>
                </Card>
              ))}
            </div>
            <ChartCard
              title="Emotions felt"
              subtitle={`Last ${range} days`}
              table={{ columns: ['Emotion', 'Check-ins'], rows: dist.map((d) => [d.label, d.value]) }}
            >
              <div className="mb-2 flex justify-end gap-1">
                {[7, 30].map((r) => (
                  <button key={r} onClick={() => setRange(r)} className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold', range === r ? 'bg-primary text-white' : 'text-muted hover:bg-surface-2')}>
                    {r}d
                  </button>
                ))}
              </div>
              {dist.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No check-ins in this period.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dist} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="var(--c-line)" strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} {...axisProps} />
                      <YAxis type="category" dataKey="label" width={78} {...axisProps} />
                      <Tooltip cursor={{ fill: 'var(--c-surface-2)' }} content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Check-ins" radius={[0, 4, 4, 0]} maxBarSize={18}>
                        {dist.map((d) => (
                          <Cell key={d.id} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </section>
          <section>
            <SectionHeader title="History" />
            {sorted.length === 0 ? (
              <EmptyState icon={HeartPulse} title="No check-ins yet" message="Your first check-in will appear here." />
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {history.map((c) => {
                    const e = emotionById(c.emotion)
                    return (
                      <motion.div layout key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: e.color + '40' }}>
                          {e.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-ink">
                            {e.label} <span className="font-normal text-muted">· {INTENSITY[(c.intensity || 3) - 1].toLowerCase()}</span>
                          </div>
                          <div className="text-[11px] text-muted">
                            {fmtDate(c.at, { weekday: 'short', day: 'numeric', month: 'short' })}, {fmtTime(c.at)}
                            {c.triggers?.length ? ` · ${c.triggers.join(', ')}` : ''}
                          </div>
                          {c.note && <p className="mt-1 text-[13px] text-ink/80">{c.note}</p>}
                        </div>
                        <button onClick={() => setDelId(c.id)} className="rounded-lg p-1.5 text-muted hover:text-rose-500" aria-label="Delete check-in">
                          <Trash2 className="size-4" />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {sorted.length > 6 && (
                  <button onClick={() => setShowAll((s) => !s)} className="w-full py-2 text-sm font-semibold text-primary">
                    {showAll ? 'Show less' : `Show all ${sorted.length}`}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal open={!!dayView} onClose={() => setDayView(null)} title={dayView && fmtDate(dayView.k, { weekday: 'long', day: 'numeric', month: 'long' })}>
        <div className="space-y-2 pt-2">
          {dayView?.list.map((c) => {
            const e = emotionById(c.emotion)
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                <span className="text-2xl">{e.emoji}</span>
                <div>
                  <div className="text-sm font-bold text-ink">
                    {e.label} · {fmtTime(c.at)}
                  </div>
                  {c.note && <div className="text-xs text-muted">{c.note}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={() => {
          deleteCheckin(delId)
          setDelId(null)
          toast('Check-in deleted')
        }}
        title="Delete this check-in?"
        confirmLabel="Delete"
      />
    </Page>
  )
}

