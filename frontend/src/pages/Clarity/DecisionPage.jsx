import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Sparkles, Quote } from 'lucide-react'
import { Button, Card, ConfirmDialog, DemoBadge, EmptyState, Page, PageHeader, Segmented } from '../../components/common'
import { DecisionMap } from '../../components/clarity/DecisionMap'
import { CompareActions } from '../../components/clarity/CompareActions'
import { THOUGHT_PROMPTS, demoReflection } from '../../components/clarity/tac'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fmtDate } from '../../utils/date'

export default function DecisionPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { decisions, saveDecision, deleteDecision } = useData()
  const d = decisions.find((x) => x.id === id)
  const [tab, setTab] = useState('summary')
  const [del, setDel] = useState(false)

  if (!d)
    return (
      <Page>
        <PageHeader back="/clarity" title="Decision" />
        <EmptyState title="Decision not found" message="Saved decisions are kept in memory and reset when the page reloads." action="Back to Clarity" onAction={() => nav('/clarity')} />
      </Page>
    )

  const chosen = d.actions.find((a) => a.id === d.chosen)
  return (
    <Page>
      <PageHeader
        back="/clarity"
        eyebrow={`Saved ${fmtDate(d.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}`}
        title={d.title}
        actions={
          <>
            <Button size="icon" variant="outline" onClick={() => nav(`/clarity/edit/${d.id}`)} aria-label="Edit decision">
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => setDel(true)} aria-label="Delete decision">
              <Trash2 className="size-4 text-rose-500" />
            </Button>
          </>
        }
      />

      {/* Final reflection hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2A1F4E] via-[#4B3780] to-[#B0679E] p-6 text-white shadow-lift">
        <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="text-xs font-bold tracking-wider text-lavender uppercase">Your direction</div>
          <h2 className="mt-1 text-2xl font-extrabold">{chosen ? chosen.label : 'Still deciding'}</h2>
          {d.reflection && (
            <p className="mt-3 flex gap-2 text-sm text-white/85">
              <Quote className="size-4 shrink-0 opacity-70" /> {d.reflection}
            </p>
          )}
          <div className="mt-4 rounded-2xl bg-white/10 p-3.5 text-[13px] leading-relaxed text-white/90 backdrop-blur">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <Sparkles className="size-4" /> Aiden’s reflection <DemoBadge className="border-white/30 bg-white/10 text-white">Demo</DemoBadge>
            </div>
            {demoReflection(d)}
          </div>
        </div>
      </motion.div>

      <Segmented
        className="mb-5 w-full sm:w-auto"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'summary', label: 'Thoughts' },
          { value: 'map', label: 'Decision map' },
          { value: 'compare', label: 'Compare' },
        ]}
      />

      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        {tab === 'summary' && (
          <div className="grid gap-3 md:grid-cols-2">
            {THOUGHT_PROMPTS.filter((p) => d.thoughts[p.key]?.trim()).map((p) => (
              <Card key={p.key}>
                <div className="text-xs font-bold text-primary">{p.label}</div>
                <p className="mt-1 text-sm text-ink">{d.thoughts[p.key]}</p>
              </Card>
            ))}
          </div>
        )}
        {tab === 'map' && (
          <DecisionMap
            draft={{ positions: {}, extraNodes: [], extraEdges: [], ...d }}
            onChange={(nd) => {
              saveDecision(nd)
            }}
          />
        )}
        {tab === 'compare' && (
          <CompareActions
            actions={d.actions}
            chosen={d.chosen}
            onChoose={(cid) => {
              saveDecision({ ...d, chosen: cid })
              toast('Updated your choice')
            }}
          />
        )}
      </motion.div>

      <ConfirmDialog
        open={del}
        onClose={() => setDel(false)}
        onConfirm={() => {
          deleteDecision(d.id)
          toast('Decision deleted')
          nav('/clarity')
        }}
        title="Delete this decision?"
        message="This can’t be undone."
        confirmLabel="Delete"
      />
    </Page>
  )
}
