import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronRight, UserRound } from 'lucide-react'

const ITEMS = [
  { title: 'Talk to a Professional', sub: 'Therapists · Coaches · Counsellors', icon: UserRound, to: '/connect' },
  { title: 'Book a Session', sub: '1-on-1 counselling & guidance', icon: CalendarDays, to: '/connect?book=1' },
]

export function SupportCards({ className = '' }) {
  const nav = useNavigate()
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {ITEMS.map(({ title, sub, icon: Icon, to }, i) => (
        <motion.button
          key={title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.05 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav(to)}
          className="group flex items-start gap-2.5 rounded-[22px] border border-white/70 bg-gradient-to-br from-[#FBEFFA] to-[#EDE4FB] p-3 text-left shadow-soft dark:border-line dark:from-[#2D2550] dark:to-[#251f3d] sm:items-center sm:p-4"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#E7D6FB] to-[#F6D5E7] text-primary-700 sm:size-12 dark:from-primary/40 dark:to-primary/20 dark:text-lavender">
            <Icon className="size-5 sm:size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] leading-tight font-extrabold text-ink sm:text-base">{title}</span>
            <span className="mt-1 block text-[11.5px] leading-snug text-muted sm:text-xs">{sub}</span>
          </span>
          <ChevronRight className="mt-1 size-4 shrink-0 text-ink/70 transition group-hover:translate-x-0.5 sm:mt-0" />
        </motion.button>
      ))}
    </div>
  )
}
