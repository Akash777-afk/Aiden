import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, GraduationCap, Search } from 'lucide-react'
import { Card, Chip, DynamicIcon, EmptyState, ErrorState, Page, PageHeader, ProgressRing, SectionHeader, SkeletonList } from '../../components/common'
import { useAsync } from '../../hooks/useAsync'
import { learnService } from '../../services/learn'
import { useData } from '../../context/DataContext'

export default function LearnPage() {
  const nav = useNavigate()
  const { learned } = useData()
  const { data, loading, error, retry } = useAsync(() => learnService.list(), [])
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    if (!data) return []
    return data.articles.filter((a) => (cat === 'all' || a.category === cat) && (a.title + a.summary).toLowerCase().includes(q.toLowerCase()))
  }, [data, cat, q])

  return (
    <Page>
      <PageHeader back="/" eyebrow="Learn" title="Psychology, made simple" subtitle="Short reads to understand yourself better." />
      {loading ? (
        <SkeletonList count={4} className="h-28" />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : (
        <>
          <Card className="tint-mint mb-6 flex items-center gap-4 border-0 p-5">
            <ProgressRing value={learned.length / data.articles.length} size={72} stroke={8} color="#3FA872" track="rgba(255,255,255,0.6)">
              <span className="text-sm font-extrabold">
                {learned.length}/{data.articles.length}
              </span>
            </ProgressRing>
            <div>
              <div className="font-extrabold">Your learning journey</div>
              <div className="text-sm opacity-80">{learned.length === 0 ? 'Start with any topic that speaks to you.' : `${learned.length} lesson${learned.length > 1 ? 's' : ''} completed — keep going!`}</div>
            </div>
          </Card>

          <section className="mb-6">
            <SectionHeader title="Topics" />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {data.categories.map((c, i) => {
                const count = data.articles.filter((a) => a.category === c.id).length
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCat(cat === c.id ? 'all' : c.id)}
                    aria-pressed={cat === c.id}
                    className={`${c.tint} flex items-center gap-2.5 rounded-2xl p-3 text-left transition ${cat === c.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg' : ''}`}
                  >
                    <DynamicIcon name={c.icon} className="size-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-tight font-bold">{c.label}</span>
                      <span className="text-[11px] opacity-70">{count} read{count === 1 ? '' : 's'}</span>
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons" aria-label="Search lessons" className="h-11 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-ink outline-none focus:border-primary" />
            </div>
            {cat !== 'all' && (
              <Chip active onClick={() => setCat('all')}>
                {data.categories.find((c) => c.id === cat)?.label} ✕
              </Chip>
            )}
          </div>

          {list.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No lessons found" message="Try another topic or search term." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((a, i) => {
                const c = data.categories.find((x) => x.id === a.category)
                const done = learned.includes(a.id)
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card interactive onClick={() => nav(`/learn/${a.id}`)} className="flex h-full flex-col overflow-hidden p-0">
                      <div className={`${c.tint} relative h-24 p-4`}>
                        <DynamicIcon name={c.icon} className="absolute -right-2 -bottom-3 size-24 opacity-20" />
                        <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">{c.label}</span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="font-extrabold text-ink">{a.title}</h3>
                        <p className="mt-1 flex-1 text-[13px] text-muted">{a.summary}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" /> {a.minutes} min read
                          </span>
                          {done && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-mint">
                              <CheckCircle2 className="size-4" /> Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}
    </Page>
  )
}
