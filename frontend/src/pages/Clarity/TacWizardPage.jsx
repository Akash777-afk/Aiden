import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Check, ChevronLeft, ChevronRight, Lightbulb, Pencil, Plus, Sparkles, Trash2, X, Save, Info, ChevronDown } from 'lucide-react'
import { Button, Card, DemoBadge, EmptyState, Input, Textarea } from '../../components/common'
import { DecisionMap } from '../../components/clarity/DecisionMap'
import { CompareActions } from '../../components/clarity/CompareActions'
import { ACTION_SUGGESTIONS, CONSEQUENCE_FIELDS, THOUGHT_PROMPTS, demoReflection, demoThoughtInsight, emptyDraft, newAction } from '../../components/clarity/tac'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { delay } from '../../services/api'
import { cn } from '../../utils/cn'

const STEPS = [
  { key: 'thoughts', label: 'Thoughts', color: '#8B72C7' },
  { key: 'actions', label: 'Actions', color: '#4C8DBF' },
  { key: 'consequences', label: 'Consequences', color: '#5FA98D' },
  { key: 'map', label: 'Map', color: '#E9A86B' },
  { key: 'reflect', label: 'Reflect', color: '#F19BB8' },
]

export default function TacWizardPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { decisions, saveDecision } = useData()
  const existing = id && decisions.find((d) => d.id === id)
  const [draft, setDraft] = useState(() => (existing ? { positions: {}, ...structuredClone(existing) } : emptyDraft()))
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [openAction, setOpenAction] = useState(draft.actions[0]?.id)
  const [insight, setInsight] = useState(null)
  const [thinking, setThinking] = useState(false)

  if (id && !existing)
    return (
      <div className="mx-auto max-w-md p-6 pt-16">
        <EmptyState title="Decision not found" message="Saved decisions are kept in memory for this demo session." action="Back to Clarity" onAction={() => nav('/clarity')} />
      </div>
    )

  const setThought = (k, v) => setDraft((d) => ({ ...d, thoughts: { ...d.thoughts, [k]: v } }))
  const updateAction = (aid, patch) => setDraft((d) => ({ ...d, actions: d.actions.map((a) => (a.id === aid ? { ...a, ...patch } : a)) }))

  const addAction = (label) => {
    const l = label.trim()
    if (l.length < 2) return setErrors({ newAction: 'Describe the action (2+ characters)' })
    if (draft.actions.some((a) => a.label.toLowerCase() === l.toLowerCase())) return setErrors({ newAction: 'You already added this action' })
    if (draft.actions.length >= 6) return setErrors({ newAction: 'Up to 6 actions keeps things clear' })
    const a = newAction(l)
    setDraft((d) => ({ ...d, actions: [...d.actions, a] }))
    setNewLabel('')
    setErrors({})
    setOpenAction((o) => o || a.id)
  }

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (draft.title.trim().length < 3) e.title = 'Give your decision a short title'
      if (!draft.thoughts.happening.trim()) e.happening = 'Describe what’s happening'
    }
    if (step === 1) {
      if (draft.actions.length < 2) e.actions = 'Add at least two possible actions to compare'
      if (draft.actions.some((a) => !a.label.trim())) e.actions = 'Every action needs a name'
    }
    if (step === 2) {
      const missing = draft.actions.filter((a) => !a.benefits.trim() && !a.risks.trim())
      if (missing.length) {
        e.consequences = `Add at least a benefit or a risk for: ${missing.map((a) => a.label).join(', ')}`
        setOpenAction(missing[0].id)
      }
    }
    if (step === 4 && !draft.chosen) e.chosen = 'Choose the option you’re leaning towards (you can change it later)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const askInsight = async () => {
    setThinking(true)
    await delay(900)
    setInsight(demoThoughtInsight(draft.thoughts))
    setThinking(false)
  }

  const save = () => {
    if (!validate()) return
    const savedId = saveDecision(draft)
    toast(existing ? 'Decision updated' : 'Decision saved')
    nav(`/clarity/${savedId}`, { replace: true })
  }

  const S = STEPS[step]

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] sm:px-6 lg:px-10 lg:pt-8">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => (step === 0 ? nav('/clarity') : setStep((s) => s - 1))} className="grid size-10 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-soft" aria-label="Back">
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold tracking-wider text-primary uppercase">TAC · Thoughts → Actions → Consequences</div>
          <h1 className="truncate text-lg font-extrabold text-ink">{draft.title || (existing ? 'Edit decision' : 'New decision')}</h1>
        </div>
        {step > 0 && (
          <Button size="sm" variant="secondary" icon={Save} onClick={() => {
            if (draft.title.trim().length < 3 || draft.actions.length < 1) return toast('Add a title and at least one action before saving', { type: 'error' })
            const sid = saveDecision(draft)
            toast('Draft saved')
            if (!existing) nav(`/clarity/edit/${sid}`, { replace: true })
          }}>
            <span className="max-sm:hidden">Save draft</span>
          </Button>
        )}
      </div>

      {/* Stepper */}
      <ol className="mb-6 grid grid-cols-5 gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              onClick={() => (i < step ? setStep(i) : i === step + 1 ? next() : null)}
              className="flex w-full flex-col items-center gap-1.5"
              aria-current={i === step ? 'step' : undefined}
            >
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <motion.span className="block h-full" style={{ background: s.color }} animate={{ width: i <= step ? '100%' : '0%' }} />
              </span>
              <span className={cn('text-[11px] font-bold', i === step ? 'text-ink' : 'text-muted')}>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex-1">
          {S.key === 'thoughts' && (
            <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <Input label="What decision are you facing?" required placeholder="e.g. Should I switch teams at work?" value={draft.title} maxLength={80} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} error={errors.title} />
                {THOUGHT_PROMPTS.map((p) => (
                  <Textarea key={p.key} label={p.label} required={p.required} rows={2} placeholder={p.placeholder} maxLength={500} value={draft.thoughts[p.key]} onChange={(e) => setThought(p.key, e.target.value)} error={errors[p.key]} />
                ))}
              </div>
              <div className="lg:sticky lg:top-8 lg:self-start">
                <Card className="tint-lilac border-0 p-5">
                  <div className="flex items-center gap-2 font-bold">
                    <Brain className="size-5" /> Thinking partner <DemoBadge>Demo</DemoBadge>
                  </div>
                  <p className="mt-1 text-sm opacity-80">Aiden can reflect your thoughts back and gently question assumptions.</p>
                  <Button variant="light" size="sm" className="mt-3" icon={Sparkles} loading={thinking} onClick={askInsight}>
                    Reflect on my thoughts
                  </Button>
                  <AnimatePresence>
                    {insight && (
                      <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-2 overflow-hidden">
                        {insight.map((t, i) => (
                          <li key={i} className="flex gap-2 rounded-xl bg-white/60 p-2.5 text-[13px] dark:bg-black/20">
                            <Lightbulb className="mt-0.5 size-4 shrink-0" />
                            {t}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            </div>
          )}

          {S.key === 'actions' && (
            <div className="mx-auto max-w-2xl space-y-4">
              <p className="text-sm text-muted">List the different things you could do. Include “do nothing for now” if it’s a real option.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  addAction(newLabel)
                }}
                className="flex gap-2"
              >
                <Input className="flex-1" placeholder="Add a possible action" value={newLabel} maxLength={60} onChange={(e) => setNewLabel(e.target.value)} error={errors.newAction} aria-label="New action" />
                <Button type="submit" icon={Plus} className="h-12">
                  Add
                </Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {ACTION_SUGGESTIONS.filter((s) => !draft.actions.some((a) => a.label === s)).map((s) => (
                  <button key={s} onClick={() => addAction(s)} className="rounded-full border border-dashed border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-lavender/40">
                    + {s}
                  </button>
                ))}
              </div>
              {errors.actions && <p className="text-sm font-medium text-rose-500">{errors.actions}</p>}
              <motion.ul layout className="space-y-2.5">
                <AnimatePresence>
                  {draft.actions.map((a, i) => (
                    <motion.li layout key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-soft">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#4C8DBF]/15 text-sm font-extrabold text-[#4C8DBF]">{i + 1}</span>
                      {editingId === a.id ? (
                        <input
                          autoFocus
                          value={a.label}
                          maxLength={60}
                          onChange={(e) => updateAction(a.id, { label: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                          className="h-9 flex-1 rounded-lg border border-primary bg-bg px-2 text-sm font-semibold text-ink outline-none"
                          aria-label="Edit action"
                        />
                      ) : (
                        <span className="flex-1 text-sm font-semibold text-ink">{a.label}</span>
                      )}
                      <button onClick={() => setEditingId(editingId === a.id ? null : a.id)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={`Edit ${a.label}`}>
                        {editingId === a.id ? <Check className="size-4" /> : <Pencil className="size-4" />}
                      </button>
                      <button onClick={() => setDraft((d) => ({ ...d, actions: d.actions.filter((x) => x.id !== a.id), chosen: d.chosen === a.id ? null : d.chosen }))} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label={`Delete ${a.label}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
              {draft.actions.length === 0 && <EmptyState title="No actions yet" message="Add your first option above or tap a suggestion." />}
            </div>
          )}

          {S.key === 'consequences' && (
            <div className="mx-auto max-w-3xl space-y-3">
              <p className="flex items-start gap-2 text-sm text-muted">
                <Info className="mt-0.5 size-4 shrink-0" /> For each action, imagine what might happen. These are possibilities, not predictions.
              </p>
              {errors.consequences && <p className="text-sm font-medium text-rose-500">{errors.consequences}</p>}
              {draft.actions.map((a) => {
                const open = openAction === a.id
                const filled = CONSEQUENCE_FIELDS.filter((f) => a[f.key].trim()).length
                return (
                  <Card key={a.id} className="p-0">
                    <button onClick={() => setOpenAction(open ? null : a.id)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
                      <div className="flex-1">
                        <div className="font-bold text-ink">{a.label}</div>
                        <div className="text-xs text-muted">{filled}/5 reflections</div>
                      </div>
                      <div className="flex gap-1">
                        {CONSEQUENCE_FIELDS.map((f) => (
                          <span key={f.key} className="size-2 rounded-full" style={{ background: a[f.key].trim() ? f.color : 'var(--c-line)' }} />
                        ))}
                      </div>
                      <ChevronDown className={cn('size-5 text-muted transition', open && 'rotate-180')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
                            {CONSEQUENCE_FIELDS.map((f) => (
                              <div key={f.key} className={f.key === 'uncertainties' ? 'sm:col-span-2' : ''}>
                                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                                  <span className="size-2.5 rounded-full" style={{ background: f.color }} /> {f.label}
                                </label>
                                <textarea
                                  rows={2}
                                  maxLength={300}
                                  value={a[f.key]}
                                  onChange={(e) => updateAction(a.id, { [f.key]: e.target.value })}
                                  className="w-full resize-none rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                                />
                              </div>
                            ))}
                            <div className="sm:col-span-2">
                              <div className="mb-1.5 text-[13px] font-semibold text-ink">How do you feel about this option?</div>
                              <div className="flex gap-2">
                                {['😟', '😕', '😐', '🙂', '😊'].map((em, i) => (
                                  <button key={i} onClick={() => updateAction(a.id, { rating: i + 1 })} aria-pressed={a.rating === i + 1} aria-label={`${i + 1} of 5`} className={cn('grid size-11 place-items-center rounded-xl border text-xl transition', a.rating === i + 1 ? 'border-primary bg-lavender/50 dark:bg-primary/20' : 'border-line')}>
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
            </div>
          )}

          {S.key === 'map' && (
            <div className="space-y-6">
              <DecisionMap draft={draft} onChange={setDraft} />
              <div>
                <h3 className="mb-3 font-bold text-ink">Compare alternatives</h3>
                <CompareActions actions={draft.actions} chosen={draft.chosen} onChoose={(cid) => setDraft((d) => ({ ...d, chosen: cid }))} />
              </div>
            </div>
          )}

          {S.key === 'reflect' && (
            <div className="mx-auto max-w-2xl space-y-5">
              <div>
                <h3 className="mb-2 font-bold text-ink">Which option are you leaning towards?</h3>
                <div className="grid gap-2">
                  {draft.actions.map((a) => (
                    <button key={a.id} onClick={() => setDraft((d) => ({ ...d, chosen: a.id }))} aria-pressed={draft.chosen === a.id} className={cn('flex items-center gap-3 rounded-2xl border-2 bg-surface p-3.5 text-left transition', draft.chosen === a.id ? 'border-primary shadow-lift' : 'border-line')}>
                      <span className={cn('grid size-6 place-items-center rounded-full border-2', draft.chosen === a.id ? 'border-primary bg-primary text-white' : 'border-line')}>{draft.chosen === a.id && <Check className="size-3.5" strokeWidth={3} />}</span>
                      <span className="font-semibold text-ink">{a.label}</span>
                    </button>
                  ))}
                </div>
                {errors.chosen && <p className="mt-2 text-sm font-medium text-rose-500">{errors.chosen}</p>}
              </div>
              {draft.chosen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="tint-lilac border-0 p-5">
                    <div className="mb-2 flex items-center gap-2 font-bold">
                      <Sparkles className="size-5" /> Aiden’s reflection <DemoBadge>Demo</DemoBadge>
                    </div>
                    <p className="text-sm leading-relaxed">{demoReflection(draft)}</p>
                  </Card>
                </motion.div>
              )}
              <Textarea label="Your own reflection" rows={4} maxLength={600} placeholder="What matters most to you in this decision? What would you tell a friend?" value={draft.reflection} onChange={(e) => setDraft((d) => ({ ...d, reflection: e.target.value }))} />
              <p className="flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-xs text-muted">
                <Info className="mt-0.5 size-4 shrink-0" /> TAC helps you think clearly — it doesn’t predict the future. For decisions affecting your health or safety, consider talking to a professional.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 -mx-4 mt-8 flex gap-3 border-t border-line bg-bg/90 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        {step > 0 && (
          <Button variant="secondary" size="lg" icon={ChevronLeft} onClick={() => setStep((s) => s - 1)}>
            <span className="max-sm:hidden">Back</span>
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button size="lg" className="flex-1" iconRight={ChevronRight} onClick={next}>
            Continue to {STEPS[step + 1].label}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" icon={Check} onClick={save}>
            Save decision
          </Button>
        )}
        <Button variant="ghost" size="lg" icon={X} onClick={() => nav('/clarity')} aria-label="Exit">
          <span className="max-sm:hidden">Exit</span>
        </Button>
      </div>
    </div>
  )
}
