import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { Modal, Button, ProgressRing } from '../common'
import { useInterval } from '../../hooks/useInterval'
import { fmtDuration } from '../../utils/date'

export function RitualPlayer({ ritual, onClose, onComplete }) {
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(0)
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!ritual) return
    setI(0)
    setLeft(ritual.steps[0].s)
    setRunning(true)
    setFinished(false)
  }, [ritual])

  const go = (n) => {
    if (n >= ritual.steps.length) {
      setFinished(true)
      setRunning(false)
      return
    }
    setI(n)
    setLeft(ritual.steps[n].s)
  }
  useInterval(() => (left <= 1 ? go(i + 1) : setLeft((l) => l - 1)), ritual && running && !finished ? 1000 : null)

  if (!ritual) return null
  const step = ritual.steps[i]
  const total = ritual.steps.reduce((a, s) => a + s.s, 0)

  return (
    <Modal open={!!ritual} onClose={onClose} title={ritual.title} subtitle={`${Math.round(total / 60)} min · step ${Math.min(i + 1, ritual.steps.length)} of ${ritual.steps.length}`}>
      <div className="flex gap-1.5 pt-1 pb-5">
        {ritual.steps.map((s, k) => (
          <div key={k} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full bg-primary" animate={{ width: finished || k < i ? '100%' : k === i ? `${(1 - left / s.s) * 100}%` : '0%' }} transition={{ duration: 0.4 }} />
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {finished ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-mint text-white">
              <Check className="size-10" strokeWidth={3} />
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-ink">Ritual complete</h3>
            <p className="mt-1 text-sm text-muted">Let your body rest. Good night 🌙</p>
            <Button
              className="mt-6 w-full"
              onClick={() => {
                onComplete?.()
                onClose()
              }}
            >
              Done
            </Button>
          </motion.div>
        ) : (
          <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center text-center">
            <ProgressRing value={1 - left / step.s} size={150} stroke={10} gradient={['#8B72C7', '#5B5FB8']}>
              <div className="text-3xl font-extrabold text-ink tabular-nums">{fmtDuration(left)}</div>
            </ProgressRing>
            <h3 className="mt-5 text-xl font-extrabold text-ink">{step.t}</h3>
            <p className="mt-1 max-w-xs text-sm text-muted">{step.d}</p>
            <div className="mt-6 flex items-center gap-4">
              <Button size="icon" variant="secondary" disabled={i === 0} onClick={() => go(i - 1)} aria-label="Previous step">
                <ChevronLeft className="size-5" />
              </Button>
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setRunning((r) => !r)} className="grid size-16 place-items-center rounded-full bg-primary text-white shadow-glow" aria-label={running ? 'Pause' : 'Resume'}>
                {running ? <Pause className="size-6 fill-current" /> : <Play className="ml-1 size-6 fill-current" />}
              </motion.button>
              <Button size="icon" variant="secondary" onClick={() => go(i + 1)} aria-label="Next step">
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
