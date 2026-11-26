import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarClock, Check, ChevronRight, Video } from 'lucide-react'
import { HomeHero } from '../../components/dashboard/HomeHero'
import { ChatCard } from '../../components/dashboard/ChatCard'
import { SupportCards } from '../../components/dashboard/SupportCards'
import { ToolkitGrid } from '../../components/dashboard/ToolkitGrid'
import { GrowthStepper, ProgressOverview } from '../../components/dashboard/ProgressOverview'
import { Card, DynamicIcon, SectionHeader } from '../../components/common'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { emotionById } from '../../utils/emotions'
import { HABIT_CATEGORIES } from '../../mock/seed'
import { habitsForDay } from '../../utils/stats'
import { fmtClock, fmtDate, isoDay } from '../../utils/date'

function TodayRoutine() {
  const { habits, setHabitStatus } = useData()
  const nav = useNavigate()
  const today = isoDay()
  const list = habitsForDay(habits, new Date()).sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5)
  return (
    <section>
      <SectionHeader title="Today’s rhythm" action="Open" onAction={() => nav('/rhythm')} />
      <Card className="divide-y divide-line p-2">
        {list.map((h) => {
          const cat = HABIT_CATEGORIES.find((c) => c.id === h.category)
          const done = h.history[today] === 'done'
          return (
            <div key={h.id} className="flex items-center gap-3 px-2 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: cat.color + '33', color: cat.color }}>
                <DynamicIcon name={cat.icon} className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-semibold ${done ? 'text-muted line-through' : 'text-ink'}`}>{h.name}</div>
                <div className="text-[11px] text-muted">{fmtClock(h.time)}</div>
              </div>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setHabitStatus(h.id, done ? undefined : 'done')}
                aria-label={done ? `Mark ${h.name} not done` : `Mark ${h.name} done`}
                className={`grid size-8 place-items-center rounded-full border-2 transition ${done ? 'border-mint bg-mint text-white' : 'border-line text-transparent hover:border-mint'}`}
              >
                <Check className="size-4" strokeWidth={3} />
              </motion.button>
            </div>
          )
        })}
      </Card>
    </section>
  )
}

function UpcomingSession() {
  const { bookings } = useData()
  const nav = useNavigate()
  const next = bookings.find((b) => b.status === 'confirmed')
  if (!next) return null
  return (
    <Card interactive onClick={() => nav(`/connect/session/${next.id}`)} className="flex items-center gap-3 border-primary/30 bg-gradient-to-r from-lavender/40 to-transparent">
      <span className="grid size-11 place-items-center rounded-2xl bg-primary text-white">
        {next.type === 'video' ? <Video className="size-5" /> : <CalendarClock className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-primary">Upcoming session · Demo</div>
        <div className="truncate text-sm font-bold text-ink">{next.proName}</div>
        <div className="text-xs text-muted">
          {fmtDate(next.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtClock(next.time)}
        </div>
      </div>
      <ChevronRight className="size-5 text-muted" />
    </Card>
  )
}

export default function HomePage() {
  const { addCheckin, todayCheckin } = useData()
  const toast = useToast()
  const nav = useNavigate()
  const [mood, setMood] = useState(todayCheckin?.emotion || null)

  const onMood = (id) => {
    setMood(id)
    addCheckin({ emotion: id, intensity: 3 })
    toast(`Checked in: ${emotionById(id).label} ${emotionById(id).emoji}`, { action: { label: 'Add details', onClick: () => nav(`/pulse?emotion=${id}`) } })
  }

  return (
    <div className="mx-auto w-full max-w-7xl lg:px-10 lg:pt-8">
      <HomeHero mood={mood} onMood={onMood} />
      <div className="relative z-10 -mt-14 grid gap-6 px-4 sm:px-6 lg:mt-6 lg:grid-cols-12 lg:px-0">
        <div className="space-y-6 lg:col-span-8">
          <ChatCard />
          <SupportCards />
          <ToolkitGrid />
          <ProgressOverview />
        </div>
        <div className="space-y-6 lg:col-span-4">
          <GrowthStepper />
          <UpcomingSession />
          <TodayRoutine />
        </div>
      </div>
    </div>
  )
}
