import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarClock, ChevronRight, Info, MessageSquare, Phone, Search, SlidersHorizontal, Video, X } from 'lucide-react'
import { Button, Chip, ConfirmDialog, EmptyState, ErrorState, Modal, Page, PageHeader, Segmented, SkeletonList, Badge } from '../../components/common'
import { ProfessionalCard } from '../../components/connect/ProfessionalCard'
import { useAsync } from '../../hooks/useAsync'
import { professionalsService } from '../../services/professionals'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fmtClock, fmtDate } from '../../utils/date'

const TOPICS = ['All', 'Anxiety', 'Stress', 'Relationships', 'Sleep routines', 'Career anxiety', 'Mindfulness', 'Depression']
const TYPE_ICON = { text: MessageSquare, voice: Phone, video: Video, scheduled: CalendarClock }

function MySessions() {
  const { bookings, cancelBooking } = useData()
  const nav = useNavigate()
  const toast = useToast()
  const [cancelId, setCancelId] = useState(null)
  if (!bookings.length) return null
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-[17px] font-bold text-ink">My sessions</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {bookings.map((b) => {
          const Icon = TYPE_ICON[b.type]
          const cancelled = b.status === 'cancelled'
          return (
            <div key={b.id} className={`w-[280px] shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-soft ${cancelled ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-lavender/60 text-primary-700 dark:bg-primary/20 dark:text-lavender">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{b.proName}</div>
                  <div className="text-xs text-muted">
                    {fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtClock(b.time)}
                  </div>
                </div>
                <Badge tone={cancelled ? 'gray' : 'mint'}>{cancelled ? 'Cancelled' : 'Confirmed'}</Badge>
              </div>
              {!cancelled && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => nav(`/connect/session/${b.id}`)}>
                    Join (demo)
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setCancelId(b.id)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => {
          cancelBooking(cancelId)
          setCancelId(null)
          toast('Demo booking cancelled')
        }}
        title="Cancel this session?"
        message="This is a demonstration booking — no payment was taken."
        confirmLabel="Cancel session"
      />
    </section>
  )
}

export default function ConnectPage() {
  const [params] = useSearchParams()
  const { data, loading, error, retry } = useAsync(() => professionalsService.list(), [])
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({ lang: 'Any', mode: 'any', maxFee: 2000, availableOnly: params.get('book') === '1' })
  const [sort, setSort] = useState('rating')

  const list = useMemo(() => {
    if (!data) return []
    return data
      .filter((p) => (p.name + p.designation + p.specializations.join(' ')).toLowerCase().includes(q.toLowerCase()))
      .filter((p) => topic === 'All' || p.specializations.includes(topic))
      .filter((p) => filters.lang === 'Any' || p.languages.includes(filters.lang))
      .filter((p) => filters.mode === 'any' || p.modes.includes(filters.mode))
      .filter((p) => p.fee <= filters.maxFee)
      .filter((p) => !filters.availableOnly || p.available)
      .sort((a, b) => (sort === 'rating' ? b.rating - a.rating : sort === 'fee' ? a.fee - b.fee : b.experience - a.experience))
  }, [data, q, topic, filters, sort])

  const activeFilterCount = (filters.lang !== 'Any') + (filters.mode !== 'any') + (filters.maxFee < 2000) + filters.availableOnly

  return (
    <Page>
      <PageHeader back="/" eyebrow="Connect" title="Talk to a Professional" subtitle="Therapists · Counsellors · Coaches" />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-[13px] text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-200">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          <b>Prototype:</b> all professionals shown are fictional sample profiles for demonstration. Registration numbers are placeholders. No real bookings, calls or payments take place.
        </p>
      </div>

      <MySessions />

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or concern"
            className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-ink shadow-soft outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="relative grid size-12 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-soft hover:border-primary/40"
          aria-label="Filters"
        >
          <SlidersHorizontal className="size-5" />
          {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">{activeFilterCount}</span>}
        </button>
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TOPICS.map((t) => (
          <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{loading ? 'Loading…' : `${list.length} professionals`}</p>
        <Segmented
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'rating', label: 'Top rated' },
            { value: 'fee', label: 'Fee' },
            { value: 'exp', label: 'Experience' },
          ]}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonList count={3} className="h-64" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No professionals match"
          message="Try removing a filter or searching for something else."
          action="Reset filters"
          onAction={() => {
            setQ('')
            setTopic('All')
            setFilters({ lang: 'Any', mode: 'any', maxFee: 2000, availableOnly: false })
          }}
        />
      ) : (
        <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => (
            <ProfessionalCard key={p.id} pro={p} index={i} />
          ))}
        </motion.div>
      )}

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" icon={X} onClick={() => setFilters({ lang: 'Any', mode: 'any', maxFee: 2000, availableOnly: false })}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)} iconRight={ChevronRight}>
              Show {list.length} results
            </Button>
          </div>
        }
      >
        <div className="space-y-5 pt-2">
          <div>
            <div className="mb-2 text-sm font-semibold text-ink">Language</div>
            <div className="flex flex-wrap gap-2">
              {['Any', 'English', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Telugu', 'Marathi'].map((l) => (
                <Chip key={l} active={filters.lang === l} onClick={() => setFilters((f) => ({ ...f, lang: l }))}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-ink">Consultation type</div>
            <div className="flex flex-wrap gap-2">
              {[
                ['any', 'Any'],
                ['text', 'Text'],
                ['voice', 'Voice'],
                ['video', 'Video'],
                ['scheduled', 'Scheduled'],
              ].map(([v, l]) => (
                <Chip key={v} active={filters.mode === v} onClick={() => setFilters((f) => ({ ...f, mode: v }))}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm font-semibold text-ink">
              <span>Max fee per session</span>
              <span className="text-primary">₹{filters.maxFee.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={500}
              max={2000}
              step={100}
              value={filters.maxFee}
              onChange={(e) => setFilters((f) => ({ ...f, maxFee: +e.target.value }))}
              className="aiden-range w-full"
              style={{ '--fill': `${((filters.maxFee - 500) / 1500) * 100}%` }}
              aria-label="Maximum fee"
            />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-line p-3">
            <input type="checkbox" checked={filters.availableOnly} onChange={(e) => setFilters((f) => ({ ...f, availableOnly: e.target.checked }))} className="size-5 accent-[#8B72C7]" />
            <span className="text-sm font-semibold text-ink">Available soon only</span>
          </label>
        </div>
      </Modal>
    </Page>
  )
}
