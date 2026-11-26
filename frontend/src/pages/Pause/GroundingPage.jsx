import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, Plus, X } from 'lucide-react'
import { Button } from '../../components/common'
import { GROUNDING_STEPS } from '../../mock/content'
import { useToast } from '../../context/ToastContext'

export default function GroundingPage() {
  const nav = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [items, setItems] = useState(GROUNDING_STEPS.map(() => []))
  const [text, setText] = useState('')
  const finished = step >= GROUNDING_STEPS.length
  const s = GROUNDING_STEPS[Math.min(step, GROUNDING_STEPS.length - 1)]
  const current = items[step] || []

  const add = (e) => {
    e?.preventDefault()
    const v = text.trim()
    if (!v || current.length >= s.n) return
    setItems((all) => all.map((l, i) => (i === step ? [...l, v] : l)))
    setText('')
  }
  const remove = (k) => setItems((all) => all.map((l, i) => (i === step ? l.filter((_, j) => j !== k) : l)))

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))] lg:pt-8">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3">
        <button onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-soft" aria-label="Back">
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="text-xs font-bold tracking-wider text-primary uppercase">Quick reset</div>
          <h1 className="text-lg font-extrabold text-ink">5-4-3-2-1 Grounding</h1>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-xl gap-2">
        {GROUNDING_STEPS.map((g, i) => (
          <div key={g.n} className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full" style={{ background: g.color }} animate={{ width: i < step ? '100%' : i === step ? `${(current.length / g.n) * 100}%` : '0%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-mint to-primary text-white shadow-lift">
                <Check className="size-12" strokeWidth={3} />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-ink">You’re here, right now.</h2>
              <p className="mt-2 text-muted">Notice how your body feels after grounding. Take one more slow breath.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep(0)
                    setItems(GROUNDING_STEPS.map(() => []))
                  }}
                >
                  Do it again
                </Button>
                <Button
                  onClick={() => {
                    toast('Grounding complete 🌿')
                    nav('/pause')
                  }}
                >
                  Finish
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="text-center">
              <motion.div className="mx-auto grid size-28 place-items-center rounded-full text-5xl font-extrabold text-white shadow-lift" style={{ background: s.color }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                {s.n}
              </motion.div>
              <h2 className="mt-5 text-2xl font-extrabold text-ink">{s.prompt}</h2>
              <p className="mt-1 text-sm text-muted">
                {current.length} of {s.n} · type them or just notice them silently
              </p>
              <form onSubmit={add} className="mt-5 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={current.length >= s.n}
                  maxLength={40}
                  placeholder={current.length >= s.n ? 'All noticed ✓' : `Something you can ${s.sense}…`}
                  aria-label={s.prompt}
                  className="h-12 flex-1 rounded-2xl border border-line bg-surface px-4 text-ink outline-none focus:border-primary disabled:opacity-60"
                />
                <Button type="submit" size="icon" className="size-12" disabled={!text.trim() || current.length >= s.n} aria-label="Add">
                  <Plus className="size-5" />
                </Button>
              </form>
              <div className="mt-4 flex min-h-10 flex-wrap justify-center gap-2">
                <AnimatePresence>
                  {current.map((it, k) => (
                    <motion.span key={it + k} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white" style={{ background: s.color }}>
                      {it}
                      <button onClick={() => remove(k)} aria-label={`Remove ${it}`}>
                        <X className="size-3.5" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!finished && (
        <div className="mx-auto flex w-full max-w-xl gap-3">
          <Button variant="secondary" size="lg" disabled={step === 0} onClick={() => setStep((x) => x - 1)}>
            Back
          </Button>
          <Button size="lg" className="flex-1" onClick={() => setStep((x) => x + 1)}>
            {current.length >= s.n ? 'Next' : 'I noticed them — next'}
          </Button>
        </div>
      )}
    </div>
  )
}
