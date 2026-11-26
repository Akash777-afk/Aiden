import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, ChevronRight } from 'lucide-react'
import { HeroScene } from '../illustrations/HeroScene'
import { Logo } from '../illustrations/Logo'
import { EmotionSelector, UserAvatar } from '../common'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { greeting } from '../../utils/date'
import { emotionById } from '../../utils/emotions'

const SUGGESTIONS = {
  calm: { text: 'Lovely. Want to capture what helped today?', cta: 'Write a note', to: '/journal' },
  happy: { text: 'Savour it — note one thing that made today good.', cta: 'Gratitude note', to: '/journal' },
  okay: { text: 'A short reset can lift an "okay" day.', cta: 'Quick reset', to: '/pause' },
  stressed: { text: 'Let’s slow things down with a 1-minute breath.', cta: 'Breathe now', to: '/pause/breathe' },
  anxious: { text: 'Grounding can help when worry speeds up.', cta: 'Try 5-4-3-2-1', to: '/pause/grounding' },
  sad: { text: 'It’s okay to feel low. Talking can help.', cta: 'Talk to Aiden', to: '/ai' },
  frustrated: { text: 'Sort it out with Thoughts → Actions → Consequences.', cta: 'Open TAC', to: '/clarity/new' },
}

export function HomeHero({ mood, onMood }) {
  const { user } = useApp()
  const { notifications } = useData()
  const nav = useNavigate()
  const unread = notifications.filter((n) => !n.read).length
  const s = mood && SUGGESTIONS[mood]

  return (
    <section className="relative overflow-hidden rounded-b-[32px] lg:rounded-[32px]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2A1F4E] via-[#5B3F8C] to-[#B0679E]" />
      <HeroScene className="absolute inset-y-0 right-0 h-full w-full md:aspect-[4/3] md:w-auto md:min-w-[55%] md:[mask-image:linear-gradient(90deg,transparent,#000_40%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2A1F4E]/70 via-[#2A1F4E]/15 to-transparent md:from-[#2A1F4E] md:from-35% md:via-[#2A1F4E]/40 md:via-55%" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#2A1F4E]/70 to-transparent" />

      <div className="relative px-5 pt-[calc(1.25rem+var(--safe-top))] pb-20 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex items-center justify-between lg:hidden">
          <Logo dark className="lg:invisible" />
          <div className="flex items-center gap-3">
            <button onClick={() => nav('/notifications')} className="relative grid size-11 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden" aria-label={`Notifications, ${unread} unread`}>
              <Bell className="size-6" />
              {unread > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2.5 size-3 rounded-full bg-coral ring-2 ring-[#3a2a62]" />
              )}
            </button>
            <button onClick={() => nav('/profile')} aria-label="Your profile" className="lg:hidden">
              <UserAvatar user={user} size={46} ring />
            </button>
          </div>
        </div>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-7 text-[27px] leading-tight font-extrabold text-white sm:text-3xl lg:mt-0 lg:text-4xl">
          {greeting()}, {user.name}{' '}
          <motion.span className="inline-block origin-[70%_70%]" animate={{ rotate: [0, 18, -6, 14, 0] }} transition={{ duration: 1.4, delay: 0.6 }}>
            👋
          </motion.span>
        </motion.h1>
        <p className="mt-1.5 text-[15px] text-white/80">How are you feeling today?</p>

        <EmotionSelector value={mood} onChange={onMood} variant="glass" className="mt-4 max-w-[560px]" />

        <AnimatePresence mode="wait">
          {s && (
            <motion.button
              key={mood}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={() => nav(s.to)}
              className="glass-dark mt-3 flex w-full max-w-[560px] items-center gap-3 rounded-2xl px-4 py-3 text-left text-white"
            >
              <span className="text-xl">{emotionById(mood).emoji}</span>
              <span className="flex-1 text-[13px] leading-snug text-white/90">{s.text}</span>
              <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-bold">
                {s.cta}
                <ChevronRight className="size-4" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
