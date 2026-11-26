import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { Bookmark, CheckCircle2, Clock, Lightbulb, MessageCircleHeart, Share2 } from 'lucide-react'
import { Button, Card, DynamicIcon, ErrorState, Page, PageHeader, Skeleton } from '../../components/common'
import { useAsync } from '../../hooks/useAsync'
import { learnService } from '../../services/learn'
import { LEARN_CATEGORIES, ARTICLES } from '../../mock/learn'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { storage } from '../../utils/storage'

export default function ArticlePage() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { learned, toggleLearned } = useData()
  const { data: a, loading, error, retry } = useAsync(() => learnService.get(id), [id])
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const [saved, setSaved] = useState(() => storage.get('bookmarks', []).includes(id))
  useEffect(() => setSaved(storage.get('bookmarks', []).includes(id)), [id])

  if (loading)
    return (
      <Page className="max-w-3xl">
        <Skeleton className="mb-4 h-10 w-32" />
        <Skeleton className="mb-4 h-44" />
        <Skeleton className="h-64" />
      </Page>
    )
  if (error)
    return (
      <Page className="max-w-3xl">
        <PageHeader back="/learn" title="Lesson" />
        <ErrorState error={error} onRetry={retry} />
      </Page>
    )

  const c = LEARN_CATEGORIES.find((x) => x.id === a.category)
  const done = learned.includes(a.id)
  const related = ARTICLES.filter((x) => x.id !== a.id && (x.category === a.category || x.category === 'mindfulness')).slice(0, 2)

  const bookmark = () => {
    const list = storage.get('bookmarks', [])
    const next = saved ? list.filter((x) => x !== id) : [...list, id]
    storage.set('bookmarks', next)
    setSaved(!saved)
    toast(saved ? 'Bookmark removed' : 'Saved for later')
  }

  return (
    <>
      <motion.div className="fixed top-0 right-0 left-0 z-50 h-1 origin-left bg-gradient-to-r from-primary to-coral lg:left-[264px]" style={{ scaleX: progress }} />
      <Page className="max-w-3xl">
        <PageHeader
          back="/learn"
          title=""
          actions={
            <>
              <Button size="icon" variant="outline" onClick={bookmark} aria-label={saved ? 'Remove bookmark' : 'Bookmark'} aria-pressed={saved}>
                <Bookmark className={`size-5 ${saved ? 'fill-primary text-primary' : ''}`} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Share"
                onClick={async () => {
                  try {
                    if (navigator.share) await navigator.share({ title: a.title, url: location.href })
                    else {
                      await navigator.clipboard.writeText(location.href)
                      toast('Link copied')
                    }
                  } catch {
                    /* cancelled */
                  }
                }}
              >
                <Share2 className="size-5" />
              </Button>
            </>
          }
        />
        <div className={`${c.tint} relative mb-6 overflow-hidden rounded-[28px] p-6`}>
          <DynamicIcon name={c.icon} className="absolute -right-4 -bottom-6 size-40 opacity-20" />
          <div className="relative">
            <div className="text-xs font-bold tracking-wider uppercase opacity-80">{c.label}</div>
            <h1 className="mt-1 text-[26px] leading-tight font-extrabold sm:text-3xl">{a.title}</h1>
            <p className="mt-2 opacity-85">{a.summary}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-sm opacity-80">
              <Clock className="size-4" /> {a.minutes} min read
            </div>
          </div>
        </div>

        <article className="space-y-6">
          {a.sections.map((s, i) => (
            <motion.section key={s.h} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <h2 className="mb-2 text-lg font-extrabold text-ink">{s.h}</h2>
              {s.body.map((p, j) => (
                <p key={j} className="mb-3 text-[15.5px] leading-relaxed text-ink/85">
                  {p}
                </p>
              ))}
            </motion.section>
          ))}
          <Card className="flex gap-3 border-primary/30 bg-lavender/30 dark:bg-primary/10">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <div className="text-xs font-bold tracking-wider text-primary uppercase">Key takeaway</div>
              <p className="mt-1 font-semibold text-ink">{a.takeaway}</p>
            </div>
          </Card>
        </article>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            variant={done ? 'secondary' : 'primary'}
            icon={CheckCircle2}
            onClick={() => {
              toggleLearned(a.id)
              toast(done ? 'Marked as not completed' : 'Lesson completed 🎓')
            }}
          >
            {done ? 'Completed' : 'Mark as complete'}
          </Button>
          <Button size="lg" variant="outline" icon={MessageCircleHeart} onClick={() => nav('/ai')}>
            Discuss with Aiden
          </Button>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-bold text-ink">Read next</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Card key={r.id} interactive onClick={() => nav(`/learn/${r.id}`)}>
                  <div className="font-bold text-ink">{r.title}</div>
                  <div className="text-xs text-muted">{r.minutes} min · {r.summary}</div>
                </Card>
              ))}
            </div>
          </section>
        )}
        <p className="mt-8 text-center text-xs text-muted">Educational content only — not a substitute for professional advice.</p>
      </Page>
    </>
  )
}
