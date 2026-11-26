import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Pause, Play, RotateCcw, Check } from 'lucide-react'
import { Button, Segmented } from '../../components/common'
import { BREATH_PATTERNS } from '../../mock/content'
import { useToast } from '../../context/ToastContext'

const PHASE_COLORS = { Inhale: ['#8BCDB5', '#8B72C7'], Hold: ['#C79AE6', '#8B72C7'], Exhale: ['#9CC3EE', '#6F55B0'], Rest: ['#D8C7F4', '#8B72C7'] }
const SCALE = { Inhale: 1, Hold: 1, Exhale: 0.55, Rest: 0.55 }

export default function BreathePage() {
  const nav = useNavigate()
  const toast = useToast()
  const [patternId, setPatternId] = useState('calm')
  const [cycles, setCycles] = useState(4)
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [count, setCount] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [done, setDone] = useState(false)
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId)
  const [phaseName, phaseSecs] = pattern.phases[phaseIdx]
  const prevScale = useRef(0.55)

  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => {
      if (count + 1 < phaseSecs) return setCount((c) => c + 1)
      // next phase
      setCount(0)
      if (phaseIdx + 1 < pattern.phases.length) setPhaseIdx((p) => p + 1)
      else if (cycle + 1 < cycles) {
        setPhaseIdx(0)
        setCycle((c) => c + 1)
      } else {
        setRunning(false)
        setDone(true)
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [running, count, phaseIdx, cycle, cycles, phaseSecs, pattern])

  const reset = () => {
    setRunning(false)
    setPhaseIdx(0)
    setCount(0)
    setCycle(0)
    setDone(false)
  }

  const target = running || count > 0 || phaseIdx > 0 ? SCALE[phaseName] : 0.55
  const colors = PHASE_COLORS[phaseName]
  useEffect(() => {
    prevScale.current = target
  }, [target])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#EFE7FB,#FAF8FC_70%)] px-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))] dark:bg-[radial-gradient(circle_at_50%_40%,#2D2550,#15121F_70%)] lg:pt-8">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3">
        <button onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-soft" aria-label="Back">
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="text-xs font-bold tracking-wider text-primary uppercase">Quick reset</div>
          <h1 className="text-lg font-extrabold text-ink">Breathing</h1>
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-xl">
        <Segmented
          className="w-full"
          size="sm"
          value={patternId}
          onChange={(v) => {
            setPatternId(v)
            reset()
          }}
          options={BREATH_PATTERNS.map((p) => ({ value: p.id, label: p.label }))}
        />
        <p className="mt-2 text-center text-xs text-muted">{pattern.desc}</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-8">
        <div className="relative grid size-[280px] place-items-center sm:size-[340px]">
          {[1, 2, 3].map((r) => (
            <motion.div
              key={r}
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: colors[0] + '55' }}
              animate={{ scale: target * (0.7 + r * 0.15), opacity: running ? 0.9 - r * 0.2 : 0.3 }}
              transition={{ duration: running ? phaseSecs : 0.6, ease: 'easeInOut' }}
            />
          ))}
          <motion.div
            className="absolute inset-[10%] rounded-full shadow-[0_20px_80px_-10px_rgba(139,114,199,0.6)]"
            animate={{ scale: target, background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${colors[0]} 35%, ${colors[1]})` }}
            transition={{ duration: running ? phaseSecs : 0.6, ease: 'easeInOut' }}
          />
          <div className="relative text-center text-white drop-shadow">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <Check className="mx-auto size-10" strokeWidth={3} />
                  <div className="mt-1 text-lg font-bold">Well done</div>
                </motion.div>
              ) : (
                <motion.div key={phaseName + running} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <div className="text-2xl font-extrabold">{running || count || phaseIdx ? phaseName : 'Ready'}</div>
                  {running && <div className="text-5xl font-extrabold tabular-nums">{phaseSecs - count}</div>}
                  {!running && !done && <div className="mt-1 text-sm opacity-90">Tap start when you’re ready</div>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          {Array.from({ length: cycles }, (_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i < cycle || done ? 'w-6 bg-primary' : i === cycle && running ? 'w-6 bg-primary/50' : 'w-2 bg-line'}`} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted">Cycles</span>
          {[3, 4, 6, 8].map((c) => (
            <button
              key={c}
              disabled={running}
              onClick={() => {
                setCycles(c)
                reset()
              }}
              className={`size-9 rounded-full text-sm font-bold transition disabled:opacity-50 ${cycles === c ? 'bg-primary text-white' : 'bg-surface text-ink shadow-soft'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" icon={RotateCcw} onClick={reset} aria-label="Reset">
            <span className="max-sm:hidden">Reset</span>
          </Button>
          {done ? (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                toast('Breathing session complete 🌿')
                nav('/pause')
              }}
            >
              Finish
            </Button>
          ) : (
            <Button size="lg" className="flex-1" icon={running ? Pause : Play} onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : count || phaseIdx || cycle ? 'Resume' : 'Start'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
