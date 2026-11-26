import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, GitBranch, Lightbulb, Plus, Target } from 'lucide-react'
import { Button, Card, EmptyState, Page, PageHeader, SectionHeader } from '../../components/common'
import { useData } from '../../context/DataContext'
import { relTime } from '../../utils/date'

const STAGES = [
  { t: 'Thoughts', d: 'Untangle what’s happening, what you think and feel, and the assumptions underneath.', icon: Brain, color: '#8B72C7' },
  { t: 'Actions', d: 'List every realistic option — including waiting or asking for help.', icon: Target, color: '#4C8DBF' },
  { t: 'Consequences', d: 'Explore benefits, risks, short and long-term outcomes, and what’s uncertain.', icon: GitBranch, color: '#5FA98D' },
]

export default function ClarityPage() {
  const nav = useNavigate()
  const { decisions } = useData()
  return (
    <Page>
      <PageHeader back="/" eyebrow="Clarity" title="TAC Method" subtitle="Think · Act · See Consequences" actions={<Button icon={Plus} onClick={() => nav('/clarity/new')} className="max-sm:hidden">New decision</Button>} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2A1F4E] via-[#4B3780] to-[#6E5AA8] p-5 text-white shadow-lift sm:p-7">
        <svg className="absolute -right-6 -bottom-4 h-44 w-64 opacity-40" viewBox="0 0 200 140" aria-hidden>
          <g stroke="#D8C7F4" strokeWidth="2" fill="none">
            <path d="M100 20 L50 70 M100 20 L150 70 M50 70 L25 120 M50 70 L75 120 M150 70 L125 120 M150 70 L175 120" />
          </g>
          {[[100, 20], [50, 70], [150, 70], [25, 120], [75, 120], [125, 120], [175, 120]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 ? 10 : 7} fill={i === 0 ? '#F2A995' : i < 3 ? '#D8C7F4' : '#8BCDB5'} />
          ))}
        </svg>
        <div className="relative max-w-lg">
          <h2 className="text-2xl font-extrabold">Make thoughtful decisions, step by step.</h2>
          <p className="mt-2 text-sm text-white/80">TAC turns a swirl of worries into a clear map of options — so you can choose with intention.</p>
          <Button variant="light" className="mt-5" icon={Plus} onClick={() => nav('/clarity/new')}>
            Start a new decision
          </Button>
        </div>
      </motion.div>

      <section className="mb-8">
        <SectionHeader title="How it works" />
        <div className="grid gap-3 md:grid-cols-3">
          {STAGES.map(({ t, d, icon: Icon, color }, i) => (
            <Card key={t} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: color }}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <div className="text-[11px] font-bold text-muted">STEP {i + 1}</div>
                  <div className="font-extrabold text-ink">{t}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">{d}</p>
              {i < 2 && <ArrowRight className="absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 text-muted md:block" />}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Saved decisions" subtitle="Kept in memory for this demo session" />
        {decisions.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No saved decisions" message="Your TAC sessions will appear here." action="Start one" onAction={() => nav('/clarity/new')} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {decisions.map((d) => {
              const chosen = d.actions.find((a) => a.id === d.chosen)
              return (
                <Card key={d.id} interactive onClick={() => nav(`/clarity/${d.id}`)}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lavender/60 text-primary-700 dark:bg-primary/20 dark:text-lavender">
                      <GitBranch className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-ink">{d.title}</div>
                      <div className="text-xs text-muted">
                        {d.actions.length} options · {relTime(d.updatedAt || d.createdAt)}
                      </div>
                      {chosen && <div className="mt-2 inline-flex rounded-full bg-mint/25 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-mint">Leaning: {chosen.label}</div>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
      <Button icon={Plus} size="lg" className="fixed right-4 z-30 rounded-full shadow-lift sm:hidden" style={{ bottom: 'calc(84px + var(--safe-bottom))' }} onClick={() => nav('/clarity/new')}>
        New
      </Button>
    </Page>
  )
}
