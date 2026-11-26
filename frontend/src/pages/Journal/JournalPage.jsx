import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { BookOpen, CalendarDays, Lightbulb, Pencil, Plus, Search, Tag, Trash2, X, Shuffle } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, EmptyState, Input, Modal, Page, PageHeader, Textarea, Segmented } from '../../components/common'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { EMOTIONS, emotionById } from '../../utils/emotions'
import { addDays, fmtDate, fmtTime, startOfDay } from '../../utils/date'
import { cn } from '../../utils/cn'

const PROMPTS = [
  'What am I grateful for today?',
  'What’s taking up the most space in my mind?',
  'When did I feel most like myself this week?',
  'What would I tell a friend in my situation?',
  'What drained my energy today, and what restored it?',
  'What is one small thing I can let go of?',
  'What am I avoiding, and why?',
  'What does my body need right now?',
]

function EntryEditor({ open, entry, onClose, prompt }) {
  const { saveEntry } = useData()
  const toast = useToast()
  const [tagText, setTagText] = useState('')
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (open) {
      reset(entry ? { title: entry.title, body: entry.body, mood: entry.mood || '', tags: entry.tags || [] } : { title: '', body: prompt ? `${prompt}\n\n` : '', mood: '', tags: [] })
      setTagText('')
    }
  }, [open, entry, prompt, reset])

  const addTag = (raw) => {
    const t = raw.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (!t) return
    const tags = getValues('tags') || []
    if (!tags.includes(t) && tags.length < 6) setValue('tags', [...tags, t])
    setTagText('')
  }

  const insertPrompt = () => {
    const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
    const body = getValues('body') || ''
    setValue('body', (body ? body.trimEnd() + '\n\n' : '') + p + '\n', { shouldValidate: false })
  }

  const submit = handleSubmit((v) => {
    if (tagText.trim()) addTag(tagText)
    saveEntry({ ...(entry || {}), title: v.title.trim() || fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'short' }), body: v.body.trim(), mood: v.mood || null, tags: getValues('tags') })
    toast(entry ? 'Entry updated' : 'Entry saved to your journal')
    onClose()
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={entry ? 'Edit entry' : 'New entry'}
      subtitle="Private demo entry — kept in memory only"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" type="submit" form="journal-form">
            {entry ? 'Save changes' : 'Save entry'}
          </Button>
        </div>
      }
    >
      <form id="journal-form" onSubmit={submit} className="space-y-4 pt-2" noValidate>
        <Input label="Title" placeholder="Give it a title (optional)" maxLength={80} {...register('title')} />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">
              Entry <span className="text-rose-500">*</span>
            </span>
            <button type="button" onClick={insertPrompt} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Shuffle className="size-3.5" /> Insert a prompt
            </button>
          </div>
          <Textarea
            rows={8}
            placeholder="Write freely. There’s no right way to do this."
            error={errors.body?.message}
            {...register('body', {
              required: 'Write at least a few words',
              validate: (v) => v.trim().length >= 10 || 'Write at least 10 characters',
              maxLength: { value: 5000, message: 'Max 5000 characters' },
            })}
          />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-ink">Mood</div>
          <Controller
            name="mood"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <button type="button" key={e.id} onClick={() => field.onChange(field.value === e.id ? '' : e.id)} aria-pressed={field.value === e.id} className={cn('flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold', field.value === e.id ? 'border-transparent text-ink' : 'border-line text-muted')} style={field.value === e.id ? { background: e.color + '55' } : undefined}>
                    {e.emoji} {e.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-ink">Tags</div>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2">
                {(field.value || []).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-lavender/60 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-lavender">
                    #{t}
                    <button type="button" onClick={() => field.onChange(field.value.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagText}
                  onChange={(e) => setTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTag(tagText)
                    }
                  }}
                  maxLength={20}
                  placeholder={(field.value || []).length >= 6 ? 'Max 6 tags' : 'Add tag + Enter'}
                  disabled={(field.value || []).length >= 6}
                  className="min-w-28 flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none"
                  aria-label="Add tag"
                />
              </div>
            )}
          />
        </div>
      </form>
    </Modal>
  )
}

export default function JournalPage() {
  const { journal, deleteEntry } = useData()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [tag, setTag] = useState(null)
  const [range, setRange] = useState('all')
  const [month, setMonth] = useState('')
  const [editor, setEditor] = useState({ open: false, entry: null, prompt: null })
  const [view, setView] = useState(null)
  const [delId, setDelId] = useState(null)

  const tags = useMemo(() => [...new Set(journal.flatMap((e) => e.tags || []))], [journal])
  const list = useMemo(() => {
    const since = range === '7' ? addDays(startOfDay(), -6) : range === '30' ? addDays(startOfDay(), -29) : null
    return journal
      .filter((e) => (e.title + ' ' + e.body).toLowerCase().includes(q.toLowerCase()))
      .filter((e) => !tag || e.tags?.includes(tag))
      .filter((e) => !since || new Date(e.at) >= since)
      .filter((e) => !month || e.at.slice(0, 7) === month)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [journal, q, tag, range, month])

  const grouped = useMemo(() => {
    const g = {}
    list.forEach((e) => (g[fmtDate(e.at, { month: 'long', year: 'numeric' })] ||= []).push(e))
    return Object.entries(g)
  }, [list])

  const filtersActive = q || tag || range !== 'all' || month
  const todayPrompt = PROMPTS[new Date().getDate() % PROMPTS.length]

  return (
    <Page>
      <PageHeader back="/" eyebrow="Journal" title="Personal reflection" subtitle={`${journal.length} entries · private to you`} actions={<Button icon={Plus} onClick={() => setEditor({ open: true, entry: null })} className="max-sm:hidden">New entry</Button>} />

      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries" className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-ink shadow-soft outline-none focus:border-primary" aria-label="Search entries" />
            </div>
            <label className="relative grid size-12 cursor-pointer place-items-center rounded-2xl border border-line bg-surface text-ink shadow-soft" title="Filter by month">
              <CalendarDays className="size-5" />
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Filter by month" />
              {month && <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary" />}
            </label>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              value={range}
              onChange={setRange}
              options={[
                { value: 'all', label: 'All time' },
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
              ]}
            />
            {month && (
              <Chip active onClick={() => setMonth('')}>
                {fmtDate(month + '-01', { month: 'short', year: 'numeric' })} ✕
              </Chip>
            )}
          </div>
          {tags.length > 0 && (
            <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <Chip icon={Tag} active={!tag} onClick={() => setTag(null)}>
                All tags
              </Chip>
              {tags.map((t) => (
                <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                  #{t}
                </Chip>
              ))}
            </div>
          )}

          {list.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={filtersActive ? 'No entries match' : 'Your journal is empty'}
              message={filtersActive ? 'Try a different search or filter.' : 'Start with today’s prompt — even one sentence counts.'}
              action={filtersActive ? 'Clear filters' : 'Write first entry'}
              onAction={() => {
                if (filtersActive) {
                  setQ('')
                  setTag(null)
                  setRange('all')
                  setMonth('')
                } else setEditor({ open: true, entry: null })
              }}
            />
          ) : (
            <div className="space-y-6">
              {grouped.map(([m, entries]) => (
                <section key={m}>
                  <h3 className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{m}</h3>
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {entries.map((e) => {
                        const mood = e.mood && emotionById(e.mood)
                        return (
                          <motion.article layout key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <Card interactive onClick={() => setView(e)} className="flex gap-3">
                              <div className="flex w-12 shrink-0 flex-col items-center rounded-2xl bg-surface-2 py-2">
                                <span className="text-lg leading-none font-extrabold text-ink">{new Date(e.at).getDate()}</span>
                                <span className="text-[10px] text-muted uppercase">{fmtDate(e.at, { weekday: 'short' })}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="truncate font-bold text-ink">{e.title}</h4>
                                  {mood && <span title={mood.label}>{mood.emoji}</span>}
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{e.body}</p>
                                {e.tags?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {e.tags.map((t) => (
                                      <span key={t} className="text-[11px] font-semibold text-primary">
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Card>
                          </motion.article>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="tint-sun border-0 p-5">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase opacity-80">
              <Lightbulb className="size-4" /> Today’s prompt
            </div>
            <p className="mt-2 text-lg leading-snug font-extrabold">{todayPrompt}</p>
            <Button variant="light" size="sm" className="mt-4" icon={Pencil} onClick={() => setEditor({ open: true, entry: null, prompt: todayPrompt })}>
              Write about this
            </Button>
          </Card>
          <Card className="p-4">
            <div className="mb-2 text-sm font-bold text-ink">More prompts</div>
            <ul className="space-y-1">
              {PROMPTS.filter((p) => p !== todayPrompt)
                .slice(0, 4)
                .map((p) => (
                  <li key={p}>
                    <button onClick={() => setEditor({ open: true, entry: null, prompt: p })} className="w-full rounded-xl px-2 py-2 text-left text-[13px] text-ink hover:bg-surface-2">
                      {p}
                    </button>
                  </li>
                ))}
            </ul>
          </Card>
        </aside>
      </div>

      <Button icon={Plus} size="lg" className="fixed right-4 z-30 rounded-full shadow-lift sm:hidden" style={{ bottom: 'calc(84px + var(--safe-bottom))' }} onClick={() => setEditor({ open: true, entry: null })}>
        Write
      </Button>

      <EntryEditor open={editor.open} entry={editor.entry} prompt={editor.prompt} onClose={() => setEditor({ open: false, entry: null, prompt: null })} />

      <Modal open={!!view} onClose={() => setView(null)} size="lg" title={view?.title} subtitle={view && `${fmtDate(view.at, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(view.at)}`}>
        {view && (
          <div className="pt-2">
            {view.mood && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-ink" style={{ background: emotionById(view.mood).color + '55' }}>
                {emotionById(view.mood).emoji} {emotionById(view.mood).label}
              </span>
            )}
            <p className="leading-relaxed whitespace-pre-wrap text-ink">{view.body}</p>
            {view.tags?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{view.tags.map((t) => <span key={t} className="text-xs font-semibold text-primary">#{t}</span>)}</div>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                icon={Pencil}
                onClick={() => {
                  setEditor({ open: true, entry: view })
                  setView(null)
                }}
              >
                Edit
              </Button>
              <Button variant="danger-soft" icon={Trash2} onClick={() => setDelId(view.id)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={() => {
          deleteEntry(delId)
          setDelId(null)
          setView(null)
          toast('Entry deleted')
        }}
        title="Delete this entry?"
        message="This can’t be undone."
        confirmLabel="Delete"
      />
    </Page>
  )
}
