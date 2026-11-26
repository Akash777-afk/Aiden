import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { CalendarCheck2, CalendarClock, CalendarPlus, Check, ChevronLeft, ChevronRight, MessageSquare, Phone, Video, PartyPopper } from 'lucide-react'
import { Button, Card, DemoBadge, ErrorState, PersonAvatar, Skeleton, Textarea } from '../../components/common'
import { DateStrip, SlotGrid } from '../../components/connect/Availability'
import { useAsync } from '../../hooks/useAsync'
import { bookingService, professionalsService } from '../../services/professionals'
import { CONSULT_TYPES } from '../../mock/professionals'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fmtClock, fmtDate, startOfDay } from '../../utils/date'
import { uid } from '../../utils/id'
import { cn } from '../../utils/cn'

const ICONS = { text: MessageSquare, voice: Phone, video: Video, scheduled: CalendarClock }
const STEPS = ['Type', 'Date & time', 'Review']

function downloadIcs(b) {
  const [h, m] = b.time.split(':').map(Number)
  const start = new Date(b.date)
  start.setHours(h, m, 0, 0)
  const end = new Date(start.getTime() + 50 * 60000)
  const f = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AIDEN//Demo//EN', 'BEGIN:VEVENT', `UID:${b.id}@aiden.demo`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:AIDEN session with ${b.proName} (demo)`, 'DESCRIPTION:Demonstration booking — not a real appointment.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  a.download = 'aiden-session.ics'
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function BookingPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const nav = useNavigate()
  const toast = useToast()
  const { addBooking } = useData()
  const { data: pro, loading, error, retry } = useAsync(() => professionalsService.get(id), [id])

  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)
  const [date, setDate] = useState(() => (state?.date ? new Date(state.date) : startOfDay()))
  const [time, setTime] = useState(state?.time || null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { note: '', consent: false } })

  if (loading)
    return (
      <div className="mx-auto max-w-2xl p-4 pt-8">
        <Skeleton className="mb-4 h-20" />
        <Skeleton className="h-80" />
      </div>
    )
  if (error)
    return (
      <div className="mx-auto max-w-2xl p-4 pt-8">
        <ErrorState error={error} onRetry={retry} />
      </div>
    )

  const types = CONSULT_TYPES.filter((t) => pro.modes.includes(t.id))
  const selectedType = types.find((t) => t.id === type)
  const price = selectedType ? Math.round(pro.fee * selectedType.multiplier) : 0
  const canNext = step === 0 ? !!type : step === 1 ? !!time : true

  const confirm = handleSubmit(async (form) => {
    setSubmitting(true)
    try {
      const res = await bookingService.confirm({ id: uid('b'), proId: pro.id, proName: pro.name, avatar: pro.avatar, type, date: date.toISOString(), time, price, note: form.note })
      addBooking(res)
      setDone(res)
    } catch (e) {
      toast(e.message, { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  })

  if (done)
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-mint to-[#5FB99A] text-white shadow-lift">
          <Check className="size-12" strokeWidth={3} />
          {Array.from({ length: 10 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute size-2 rounded-full"
              style={{ background: ['#8B72C7', '#F2A995', '#F6CF7E', '#8BCDB5'][i % 4] }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos((i / 10) * Math.PI * 2) * 80, y: Math.sin((i / 10) * Math.PI * 2) * 80, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            />
          ))}
        </motion.div>
        <h1 className="mt-6 text-2xl font-extrabold text-ink">Demo booking confirmed</h1>
        <p className="mt-1 text-sm text-muted">This is a demonstration — no real appointment or payment was made.</p>
        <Card className="mt-6 w-full text-left">
          <div className="flex items-center gap-3">
            <PersonAvatar look={pro.avatar} size={48} className="rounded-2xl" />
            <div>
              <div className="font-bold text-ink">{pro.name}</div>
              <div className="text-xs text-muted">{selectedType.label}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted">Date</div>
              <div className="font-semibold text-ink">{fmtDate(done.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Time</div>
              <div className="font-semibold text-ink">{fmtClock(done.time)}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Reference</div>
              <div className="font-semibold text-ink">{done.ref}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Amount (not charged)</div>
              <div className="font-semibold text-ink">₹{price.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </Card>
        <div className="mt-6 grid w-full gap-3">
          <Button size="lg" icon={PartyPopper} onClick={() => nav(`/connect/session/${done.id}`)}>
            Preview session room
          </Button>
          <Button variant="secondary" icon={CalendarPlus} onClick={() => downloadIcs(done)}>
            Add to calendar
          </Button>
          <Button variant="ghost" onClick={() => nav('/connect')}>
            Back to Connect
          </Button>
        </div>
      </div>
    )

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-[calc(1rem+var(--safe-top))] lg:pt-8">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => (step === 0 ? nav(-1) : setStep((s) => s - 1))}
          className="grid size-10 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-soft"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="text-xs font-bold tracking-wider text-primary uppercase">Book a session</div>
          <div className="text-lg font-extrabold text-ink">{STEPS[step]}</div>
        </div>
        <DemoBadge>Demo</DemoBadge>
      </div>

      {/* stepper */}
      <div className="mb-6 flex gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full bg-gradient-to-r from-primary to-[#B28BE0]" animate={{ width: i <= step ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <button onClick={() => nav(`/connect/${pro.id}`)} className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left shadow-soft">
        <PersonAvatar look={pro.avatar} size={44} className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-ink">{pro.name}</div>
          <div className="text-xs text-muted">{pro.designation}</div>
        </div>
        <span className="text-xs font-semibold text-primary">View</span>
      </button>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="grid gap-3">
                {types.map((t) => {
                  const Icon = ICONS[t.id]
                  const active = type === t.id
                  return (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      key={t.id}
                      onClick={() => setType(t.id)}
                      aria-pressed={active}
                      className={cn('flex items-center gap-4 rounded-2xl border-2 bg-surface p-4 text-left transition', active ? 'border-primary shadow-lift' : 'border-line hover:border-primary/40')}
                    >
                      <span className={cn('grid size-12 place-items-center rounded-2xl', active ? 'bg-primary text-white' : 'bg-lavender/50 text-primary-700 dark:bg-primary/20 dark:text-lavender')}>
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-ink">{t.label}</span>
                        <span className="block text-xs text-muted">
                          {t.desc} · {t.duration}
                        </span>
                      </span>
                      <span className="font-extrabold text-ink">₹{Math.round(pro.fee * t.multiplier).toLocaleString('en-IN')}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-sm font-bold text-ink">Select a date</div>
                  <DateStrip
                    value={date}
                    onChange={(d) => {
                      setDate(d)
                      setTime(null)
                    }}
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm font-bold text-ink">Available times</div>
                  <SlotGrid proId={pro.id} date={date} value={time} onChange={setTime} />
                </div>
              </div>
            )}
            {step === 2 && (
              <form onSubmit={confirm} className="space-y-4" id="booking-form">
                <Card className="divide-y divide-line p-0">
                  {[
                    ['Consultation', selectedType.label, 0],
                    ['Date', fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' }), 1],
                    ['Time', fmtClock(time), 1],
                    ['Duration', selectedType.duration, null],
                  ].map(([k, v, s]) => (
                    <div key={k} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-muted">{k}</span>
                      <span className="flex items-center gap-2 font-semibold text-ink">
                        {v}
                        {s != null && (
                          <button type="button" onClick={() => setStep(s)} className="text-xs font-semibold text-primary">
                            Edit
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-surface-2/60 px-4 py-3">
                    <span className="font-bold text-ink">Total</span>
                    <span className="text-lg font-extrabold text-ink">₹{price.toLocaleString('en-IN')}</span>
                  </div>
                </Card>
                <Textarea
                  label="Anything you'd like them to know? (optional)"
                  rows={3}
                  placeholder="e.g. I'd like to talk about work stress"
                  error={errors.note?.message}
                  {...register('note', { maxLength: { value: 300, message: 'Please keep this under 300 characters' } })}
                />
                <label className="flex items-start gap-3 rounded-2xl border border-line p-3.5 text-sm">
                  <input type="checkbox" className="mt-0.5 size-5 accent-[#8B72C7]" {...register('consent', { required: 'Please confirm to continue' })} />
                  <span className="text-ink">
                    I understand this is a <b>demonstration booking</b>. No payment is taken and no real session is scheduled.
                    {errors.consent && <span className="mt-1 block text-xs font-medium text-rose-500">{errors.consent.message}</span>}
                  </span>
                </label>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-line bg-bg/90 px-4 pt-3 pb-[calc(1rem+var(--safe-bottom))] backdrop-blur">
        {step < 2 ? (
          <Button size="lg" className="w-full" disabled={!canNext} onClick={() => setStep((s) => s + 1)} iconRight={ChevronRight}>
            Continue
          </Button>
        ) : (
          <Button size="lg" className="w-full" type="submit" form="booking-form" loading={submitting} icon={CalendarCheck2}>
            Confirm demo booking
          </Button>
        )}
      </div>
    </div>
  )
}
