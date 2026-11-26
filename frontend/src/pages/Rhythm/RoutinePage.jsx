import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Plus, RotateCcw, Save, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { Button, Card, DemoBadge, DynamicIcon, ICON_NAMES, Page, PageHeader } from '../../components/common'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fmtClock } from '../../utils/date'
import { uid } from '../../utils/id'

const SUGGESTED = [
  { id: 's1', time: '07:00', label: 'Wake up', icon: 'Sunrise' },
  { id: 's2', time: '07:15', label: 'Hydration', icon: 'Droplets' },
  { id: 's3', time: '07:30', label: 'Physical movement', icon: 'Footprints' },
  { id: 's4', time: '21:30', label: 'Mind declutter', icon: 'NotebookPen' },
  { id: 's5', time: '22:30', label: 'Wind down', icon: 'Moon' },
]

const CAT_FOR_ICON = { Sunrise: 'wake', Droplets: 'hydration', Footprints: 'activity', Dumbbell: 'activity', Moon: 'sleep', Flower2: 'mindfulness', NotebookPen: 'journaling', BookOpen: 'reading', Sprout: 'growth' }

function RoutineStep({ s, error, update, cycleIcon, remove }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={s}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative flex items-center gap-3"
    >
      <button
        type="button"
        onClick={() => cycleIcon(s)}
        className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-surface bg-gradient-to-br from-primary to-[#A97FD6] text-white shadow-glow"
        aria-label={`Change icon for ${s.label || 'step'}`}
      >
        <DynamicIcon name={s.icon} className="size-6" />
      </button>
      <div className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl border bg-surface p-2 pl-3 shadow-soft ${error ? 'border-rose-400' : 'border-line'}`}>
        <input
          type="time"
          value={s.time}
          onChange={(e) => update(s.id, { time: e.target.value })}
          aria-label="Time"
          className="w-[96px] shrink-0 rounded-lg bg-surface-2 px-1.5 py-1.5 text-sm font-semibold text-ink outline-none sm:w-[120px]"
        />
        <input
          value={s.label}
          onChange={(e) => update(s.id, { label: e.target.value })}
          maxLength={40}
          aria-label="Step name"
          placeholder="Step name"
          className="min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold text-ink outline-none"
        />
        <button type="button" onClick={remove} className="rounded-lg p-1.5 text-muted hover:text-rose-500" aria-label={`Remove ${s.label || 'step'}`}>
          <Trash2 className="size-4" />
        </button>
        <span onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none p-1 text-muted active:cursor-grabbing" aria-label="Drag to reorder">
          <GripVertical className="size-4" />
        </span>
      </div>
    </Reorder.Item>
  )
}

export default function RoutinePage() {
  const { routine, setRoutine, habits, addHabit } = useData()
  const toast = useToast()
  const nav = useNavigate()
  const [draft, setDraft] = useState(routine)
  const [errors, setErrors] = useState({})

  const update = (id, patch) => setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const cycleIcon = (s) => update(s.id, { icon: ICON_NAMES[(ICON_NAMES.indexOf(s.icon) + 1) % ICON_NAMES.length] })

  const validate = () => {
    const e = {}
    draft.forEach((s) => {
      if (!s.label.trim()) e[s.id] = 'Add a name'
      else if (!s.time) e[s.id] = 'Pick a time'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return toast('Please fix the highlighted steps', { type: 'error' })
    const sorted = [...draft].sort((a, b) => a.time.localeCompare(b.time))
    setDraft(sorted)
    setRoutine(sorted)
    toast('Routine saved')
  }

  const apply = () => {
    if (!validate()) return
    let n = 0
    draft.forEach((s) => {
      if (!habits.some((h) => h.name.toLowerCase() === s.label.toLowerCase())) {
        addHabit({ name: s.label, category: CAT_FOR_ICON[s.icon] || 'growth', time: s.time, frequency: [0, 1, 2, 3, 4, 5, 6], target: 'Daily', reminder: true })
        n++
      }
    })
    setRoutine(draft)
    toast(n ? `${n} step${n > 1 ? 's' : ''} added as daily habits` : 'All steps are already in your habits', { type: n ? 'success' : 'info' })
    if (n) nav('/rhythm')
  }

  return (
    <Page className="max-w-3xl">
      <PageHeader back="/rhythm" eyebrow="Rhythm" title="Your daily rhythm" subtitle="Drag to reorder, tap the icon to change it." />

      <Card className="tint-lilac mb-5 flex items-start gap-3 border-0">
        <Wand2 className="mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <div className="flex items-center gap-2 font-bold">
            Intelligent suggestion <DemoBadge>Demo</DemoBadge>
          </div>
          <p className="mt-0.5 opacity-80">Based on your check-ins, mornings with movement tend to feel calmer. This routine front-loads energy and protects your wind-down. (Demonstration logic — personalised recommendations arrive with the AI backend.)</p>
        </div>
      </Card>

      <div className="relative">
        <div className="absolute top-4 bottom-4 left-[27px] w-0.5 rounded-full bg-gradient-to-b from-sun via-primary to-[#3a3584] opacity-40" />
        <Reorder.Group axis="y" values={draft} onReorder={setDraft} className="space-y-3">
          <AnimatePresence initial={false}>
            {draft.map((s) => (
              <RoutineStep key={s.id} s={s} error={errors[s.id]} update={update} cycleIcon={cycleIcon} remove={() => setDraft((d) => d.filter((x) => x.id !== s.id))} />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
      {draft.length === 0 && <p className="py-8 text-center text-sm text-muted">Your routine is empty. Add a step to begin.</p>}

      <button
        onClick={() => setDraft((d) => [...d, { id: uid('r'), time: '12:00', label: '', icon: 'Sparkles' }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-3.5 text-sm font-semibold text-muted hover:border-primary hover:text-primary"
      >
        <Plus className="size-4" /> Add step
      </button>

      <Card className="mt-6 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <Sparkles className="size-4 text-primary" /> Preview
        </div>
        <p className="text-sm text-muted">
          {draft.length ? [...draft].sort((a, b) => a.time.localeCompare(b.time)).map((s) => `${fmtClock(s.time)} ${s.label || '…'}`).join(' → ') : '—'}
        </p>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button variant="secondary" icon={RotateCcw} onClick={() => setDraft(SUGGESTED.map((s) => ({ ...s, id: uid('r') })))}>
          Reset to suggested
        </Button>
        <Button variant="outline" icon={Save} onClick={save}>
          Save routine
        </Button>
        <Button icon={Plus} onClick={apply}>
          Add to my habits
        </Button>
      </div>
    </Page>
  )
}
