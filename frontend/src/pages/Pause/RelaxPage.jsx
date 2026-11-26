import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Pause, Play, SkipForward } from 'lucide-react'
import { Button, EmptyState } from '../../components/common'
import { MINDFULNESS_STEPS } from '../../mock/content'
import { useInterval } from '../../hooks/useInterval'
import { useToast } from '../../context/ToastContext'
import { fmtDuration } from '../../utils/date'

const SESSIONS = {
  grounding: {
    title: 'Guided grounding',
    secs: 20,
    bg: 'from-[#1F4C3F] via-[#2E6B57] to-[#0F2A22]',
    steps: [
      'Plant both feet flat on the floor. Feel the ground holding you.',
      'Press your heels down gently. Notice the solid support beneath you.',
      'Feel the weight of your body in the chair or wherever you are.',
      'Rest your hands on your thighs. Notice their warmth.',
      'Breathe in slowly… and let the breath out through your mouth.',
      'Say quietly to yourself: “I am here. I am safe in this moment.”',
    ],
  },
  visual: {
    title: 'Visual relaxation',
    secs: 20,
    bg: 'from-[#2A1F4E] via-[#5B3F8C] to-[#B0679E]',
    steps: ['Let your eyes rest on the glowing light.', 'Watch it slowly grow… and shrink.', 'Let your breath follow its rhythm.', 'If thoughts arrive, let them drift past like clouds.', 'Soften your shoulders. Soften your jaw.', 'Stay here as long as you like.'],
  },
  mindful: { title: 'Mindfulness minute', secs: 18, bg: 'from-[#5B5FB8] via-[#6E68C8] to-[#2A1F4E]', steps: MINDFULNESS_STEPS },
}

export default function RelaxPage() {
  const { kind } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const s = SESSIONS[kind]
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(s?.secs || 0)
  const [running, setRunning] = useState(true)
  const [done, setDone] = useState(false)

  const next = () => {
    if (i + 1 >= s.steps.length) {
      setDone(true)
      setRunning(false)
    } else {
      setI(i + 1)
      setLeft(s.secs)
    }
  }
  useInterval(() => (left <= 1 ? next() : setLeft((l) => l - 1)), s && running && !done ? 1000 : null)

  if (!s)
    return (
      <div className="mx-auto max-w-md p-6 pt-16">
        <EmptyState title="Practice not found" action="Back to Pause" onAction={() => nav('/pause')} />
      </div>
    )

  const total = s.steps.length * s.secs
  const elapsed = i * s.secs + (s.secs - left)

  return (
    <div className={`relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b ${s.bg} px-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))] text-white lg:pt-8`}>
      <motion.div className="absolute top-1/3 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative mx-auto flex w-full max-w-xl items-center gap-3">
        <button onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-2xl bg-white/15" aria-label="Back">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-lg font-extrabold">{s.title}</h1>
        <span className="text-sm text-white/70 tabular-nums">
          {fmtDuration(elapsed)} / {fmtDuration(total)}
        </span>
      </div>
      <div className="relative mx-auto mt-4 h-1 w-full max-w-xl overflow-hidden rounded-full bg-white/20">
        <motion.div className="h-full bg-white" animate={{ width: `${(elapsed / total) * 100}%` }} transition={{ ease: 'linear' }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center">
        {kind === 'visual' && !done && (
          <motion.div className="mb-10 size-40 rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFF6DA,#F6CF7E_50%,#F2A995)] shadow-[0_0_80px_30px_rgba(246,207,126,0.4)]" animate={{ scale: [0.7, 1.1, 0.7] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        )}
        <AnimatePresence mode="wait">
          <motion.p key={done ? 'done' : i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.9 }} className="text-2xl leading-snug font-semibold sm:text-3xl">
            {done ? 'Gently return to your day. Well done. 🌿' : s.steps[i]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto flex w-full max-w-xl items-center justify-center gap-4">
        {done ? (
          <Button
            variant="light"
            size="lg"
            className="w-full"
            onClick={() => {
              toast(`${s.title} complete`)
              nav('/pause')
            }}
          >
            Finish
          </Button>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRunning((r) => !r)} className="grid size-16 place-items-center rounded-full bg-white text-navy" aria-label={running ? 'Pause' : 'Play'}>
              {running ? <Pause className="size-6 fill-current" /> : <Play className="ml-1 size-6 fill-current" />}
            </motion.button>
            <button onClick={next} className="grid size-12 place-items-center rounded-full bg-white/15" aria-label="Next step">
              <SkipForward className="size-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
