import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarCheck2, ChevronRight, GitBranch, GraduationCap, HeartPulse, LifeBuoy, MessageCircleHeart, Moon, NotebookPen, Search, Users, Flower2, LineChart } from 'lucide-react'
import { Page, PageHeader } from '../../components/common'
import { openSupport } from '../../components/layout/SupportSheet'

const MODULES = [
  { to: '/ai', title: 'AIDEN AI', desc: 'Your personal emotional companion', icon: MessageCircleHeart, tint: 'tint-lilac', tag: 'Understand' },
  { to: '/connect', title: 'Connect', desc: 'Therapists, counsellors & coaches', icon: Users, tint: 'tint-peach', tag: 'Support' },
  { to: '/rhythm', title: 'Rhythm', desc: 'Intelligent habit tracker', icon: CalendarCheck2, tint: 'tint-mint', tag: 'Act' },
  { to: '/sleep', title: 'Sleep', desc: 'Sounds, stories & rituals', icon: Moon, tint: 'tint-night', tag: 'Improve' },
  { to: '/pause', title: 'Pause', desc: 'Quick resets & calm play', icon: Flower2, tint: 'tint-lotus', tag: 'Support' },
  { to: '/clarity', title: 'Clarity', desc: 'TAC decision framework', icon: GitBranch, tint: 'tint-sky', tag: 'Act' },
  { to: '/pulse', title: 'Pulse', desc: 'Emotional check-ins & mood calendar', icon: HeartPulse, tint: 'tint-peach', tag: 'Understand' },
  { to: '/journal', title: 'Journal', desc: 'Guided personal reflection', icon: NotebookPen, tint: 'tint-sun', tag: 'Understand' },
  { to: '/insights', title: 'Insights', desc: 'Your wellbeing analytics', icon: LineChart, tint: 'tint-lilac', tag: 'Improve' },
  { to: '/learn', title: 'Learn', desc: 'Psychology made simple', icon: GraduationCap, tint: 'tint-mint', tag: 'Improve' },
]

export default function ExplorePage() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const list = MODULES.filter((m) => (m.title + m.desc + m.tag).toLowerCase().includes(q.toLowerCase()))
  return (
    <Page>
      <PageHeader title="Explore" subtitle="Understand → Support → Act → Improve" />
      <div className="relative mb-5">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools, e.g. sleep, habits, decisions"
          className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-ink shadow-soft outline-none focus:border-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {list.map(({ to, title, desc, icon: Icon, tint, tag }, i) => (
          <motion.button
            key={to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => nav(to)}
            className={`${tint} flex min-h-[140px] flex-col rounded-[22px] p-4 text-left shadow-soft`}
          >
            <div className="flex items-start justify-between">
              <Icon className="size-7" />
              <span className="rounded-full bg-white/40 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase dark:bg-black/20">{tag}</span>
            </div>
            <div className="mt-auto pt-3">
              <div className="text-base font-extrabold">{title}</div>
              <div className="text-xs leading-snug opacity-80">{desc}</div>
            </div>
          </motion.button>
        ))}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted">No tools match “{q}”.</p>}
      <button onClick={openSupport} className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-left dark:border-rose-500/20 dark:bg-rose-500/5">
        <span className="grid size-11 place-items-center rounded-xl bg-rose-500 text-white">
          <LifeBuoy className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-bold text-ink">Need urgent help?</span>
          <span className="block text-xs text-muted">Helplines and immediate support options</span>
        </span>
        <ChevronRight className="size-5 text-muted" />
      </button>
    </Page>
  )
}
