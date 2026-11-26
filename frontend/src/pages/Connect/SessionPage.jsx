import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2, VolumeX, MessageSquare, SendHorizontal, Star, ChevronLeft, CalendarX2 } from 'lucide-react'
import { Button, ConfirmDialog, DemoBadge, EmptyState, Modal, PersonAvatar, UserAvatar } from '../../components/common'
import { useData } from '../../context/DataContext'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useInterval } from '../../hooks/useInterval'
import { fmtDuration, fmtTime } from '../../utils/date'
import { uid } from '../../utils/id'
import { cn } from '../../utils/cn'

function CtrlButton({ on, onClick, iconOn: On, iconOff: Off, label, danger }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={cn('grid size-14 place-items-center rounded-full transition', danger ? 'bg-rose-500 text-white shadow-lg' : on ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-navy')}
    >
      {on || danger ? <On className="size-6" /> : <Off className="size-6" />}
    </motion.button>
  )
}

const DEMO_REPLIES = [
  'Thanks for sharing that. (Demo message from a sample professional.)',
  'That sounds really hard. What do you notice in your body when that happens?',
  'Let’s explore that a little more in our session.',
]

function TextSession({ booking, user, onEnd }) {
  const [msgs, setMsgs] = useState([{ id: 'w', me: false, text: `Hi ${user.name}, I’m ${booking.proName.split(' ').slice(-2).join(' ')}. This is a demo text session — how are you today?`, at: new Date() }])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const ref = useRef(null)
  const i = useRef(0)
  useEffect(() => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }), [msgs, typing])
  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setMsgs((m) => [...m, { id: uid('m'), me: true, text: text.trim(), at: new Date() }])
    setText('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { id: uid('m'), me: false, text: DEMO_REPLIES[i.current++ % DEMO_REPLIES.length], at: new Date() }])
    }, 1400)
  }
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="glass flex items-center gap-3 border-b border-line px-4 pt-[calc(0.75rem+var(--safe-top))] pb-3">
        <PersonAvatar look={booking.avatar} size={40} />
        <div className="flex-1">
          <div className="font-bold text-ink">{booking.proName}</div>
          <div className="text-xs text-emerald-600 dark:text-mint">{typing ? 'typing…' : 'Online · simulated'}</div>
        </div>
        <DemoBadge>Simulated</DemoBadge>
        <Button size="sm" variant="danger-soft" onClick={onEnd}>
          End
        </Button>
      </header>
      <div ref={ref} className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', m.me && 'justify-end')}>
              <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm', m.me ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-line bg-surface text-ink')}>
                {m.text}
                <div className={cn('mt-1 text-[10px]', m.me ? 'text-white/70' : 'text-muted')}>{fmtTime(m.at)}</div>
              </div>
            </motion.div>
          ))}
          {typing && <div className="w-16 rounded-2xl border border-line bg-surface px-4 py-3 text-center text-muted">•••</div>}
        </div>
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line bg-surface p-3 pb-[calc(0.75rem+var(--safe-bottom))]">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" aria-label="Message" className="h-12 flex-1 rounded-2xl border border-line bg-bg px-4 text-ink outline-none focus:border-primary" />
        <button type="submit" disabled={!text.trim()} className="grid size-12 place-items-center rounded-2xl bg-primary text-white disabled:opacity-40" aria-label="Send">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  )
}

export default function SessionPage() {
  const { bookingId } = useParams()
  const { bookings } = useData()
  const { user } = useApp()
  const toast = useToast()
  const nav = useNavigate()
  const booking = bookings.find((b) => b.id === bookingId)
  const [status, setStatus] = useState('connecting')
  const [secs, setSecs] = useState(0)
  const [mic, setMic] = useState(true)
  const [cam, setCam] = useState(true)
  const [speaker, setSpeaker] = useState(true)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [rateOpen, setRateOpen] = useState(false)
  const [rating, setRating] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setStatus('connected'), 2200)
    return () => clearTimeout(t)
  }, [])
  useInterval(() => setSecs((s) => s + 1), status === 'connected' ? 1000 : null)

  if (!booking)
    return (
      <div className="mx-auto max-w-md p-6 pt-16">
        <EmptyState icon={CalendarX2} title="Session not found" message="Demo bookings are kept in memory and reset when the page reloads." action="Go to Connect" onAction={() => nav('/connect')} />
      </div>
    )

  const end = () => {
    setConfirmEnd(false)
    setRateOpen(true)
  }
  const finish = () => {
    setRateOpen(false)
    toast(rating ? 'Thanks for your feedback' : 'Session ended')
    nav('/connect')
  }

  const rateModal = (
    <Modal open={rateOpen} onClose={finish} title="How was your session?" subtitle="Demo feedback — not sent anywhere">
      <div className="flex justify-center gap-2 py-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button whileTap={{ scale: 0.85 }} key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={`size-9 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-line'}`} />
          </motion.button>
        ))}
      </div>
      <Button className="w-full" onClick={finish}>
        {rating ? 'Submit' : 'Skip'}
      </Button>
    </Modal>
  )

  if (booking.type === 'text')
    return (
      <>
        <TextSession booking={booking} user={user} onEnd={() => setConfirmEnd(true)} />
        <ConfirmDialog open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={end} title="End this chat?" confirmLabel="End" />
        {rateModal}
      </>
    )

  const isVideo = booking.type !== 'voice'
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#4B3780,#211D35_70%)] text-white">
      {/* animated backdrop */}
      <motion.div className="absolute -top-20 -left-20 size-80 rounded-full bg-primary/30 blur-3xl" animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 12, repeat: Infinity }} />
      <motion.div className="absolute -right-20 bottom-20 size-80 rounded-full bg-coral/20 blur-3xl" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 14, repeat: Infinity }} />

      <header className="relative flex items-center gap-3 px-4 pt-[calc(1rem+var(--safe-top))]">
        <button onClick={() => setConfirmEnd(true)} className="grid size-10 place-items-center rounded-xl bg-white/10" aria-label="Leave session">
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="font-bold">{booking.proName}</div>
          <div className="text-xs text-white/70">{status === 'connecting' ? 'Connecting… (simulated)' : `${isVideo ? 'Video' : 'Voice'} session · ${fmtDuration(secs)}`}</div>
        </div>
        <DemoBadge className="border-white/30 bg-white/10 text-white">Simulated call</DemoBadge>
      </header>

      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="relative">
          {status === 'connected' &&
            [0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-lavender/40"
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
              />
            ))}
          <PersonAvatar look={booking.avatar} size={isVideo ? 180 : 150} className="relative shadow-2xl" />
        </div>
        <AnimatePresence>
          {status === 'connecting' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-10 text-sm text-white/80">
              Waiting for {booking.proName.split(' ')[0]} {booking.proName.split(' ')[1]} to join…
            </motion.p>
          )}
        </AnimatePresence>
        {isVideo && (
          <motion.div drag dragMomentum={false} className="absolute top-4 right-4 grid h-36 w-24 cursor-grab place-items-center overflow-hidden rounded-2xl border border-white/20 bg-navy/80 shadow-xl sm:h-44 sm:w-32">
            {cam ? <UserAvatar user={user} size={64} /> : <VideoOff className="size-6 text-white/60" />}
            <span className="absolute bottom-1.5 text-[10px] text-white/70">You {!mic && '· muted'}</span>
          </motion.div>
        )}
      </div>

      <p className="relative px-6 text-center text-[11px] text-white/60">This is a simulated call interface. No audio or video is transmitted.</p>
      <div className="relative flex items-center justify-center gap-4 px-4 pt-4 pb-[calc(1.5rem+var(--safe-bottom))]">
        <CtrlButton on={mic} onClick={() => setMic((m) => !m)} iconOn={Mic} iconOff={MicOff} label={mic ? 'Mute microphone' : 'Unmute microphone'} />
        {isVideo ? (
          <CtrlButton on={cam} onClick={() => setCam((c) => !c)} iconOn={Video} iconOff={VideoOff} label={cam ? 'Turn camera off' : 'Turn camera on'} />
        ) : (
          <CtrlButton on={speaker} onClick={() => setSpeaker((s) => !s)} iconOn={Volume2} iconOff={VolumeX} label="Toggle speaker" />
        )}
        <CtrlButton on onClick={() => toast('In-call chat will be available with the real provider (Phase 5)', { type: 'info' })} iconOn={MessageSquare} iconOff={MessageSquare} label="Open chat" />
        <CtrlButton danger onClick={() => setConfirmEnd(true)} iconOn={PhoneOff} label="End call" />
      </div>
      <ConfirmDialog open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={end} title="End this session?" confirmLabel="End session" />
      {rateModal}
    </div>
  )
}
