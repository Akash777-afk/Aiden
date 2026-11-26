import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, BookOpen, CircleCheck, GitFork, Moon, Flower2 } from 'lucide-react'
import { LeavesArt, LotusArt, NightArt } from '../illustrations/TileArt'
import { SectionHeader } from '../common'

const TILES = [
  { title: 'Habit Tracker', sub: 'Build your rhythm', icon: CircleCheck, to: '/rhythm', tint: 'tint-mint', art: LeavesArt },
  { title: 'Sleep Helper', sub: 'Sounds & rituals', icon: Moon, to: '/sleep', tint: 'tint-night', art: NightArt },
  { title: 'The Calmer', sub: 'Reset & calm play', icon: Flower2, to: '/pause', tint: 'tint-lotus', art: LotusArt },
  { title: 'TAC Method', sub: 'Think · Act · See Consequences', icon: GitFork, to: '/clarity', tint: 'tint-lilac' },
  { title: 'Self Insights', sub: 'Patterns & personal insights', icon: BarChart3, to: '/insights', tint: 'tint-peach' },
  { title: 'Journal', sub: 'Guided reflection & notes', icon: BookOpen, to: '/journal', tint: 'tint-sky' },
]

export function ToolkitGrid() {
  const nav = useNavigate()
  return (
    <section>
      <SectionHeader title="Your Wellness Toolkit" action="See All" onAction={() => nav('/explore')} />
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {TILES.map(({ title, sub, icon: Icon, to, tint, art: Art }, i) => (
          <motion.button
            key={title}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i + 0.2 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => nav(to)}
            className={`${tint} relative flex min-h-[112px] flex-col overflow-hidden rounded-[var(--radius-tile)] p-3 text-left shadow-soft sm:min-h-[128px] sm:p-4`}
          >
            {Art && <Art className="pointer-events-none absolute -right-2 -bottom-2 h-[78%] w-[70%] opacity-90" />}
            <Icon className="relative size-6 sm:size-7" strokeWidth={2.2} />
            <span className="relative mt-auto pt-2">
              <span className="block text-[14px] leading-[1.15] font-extrabold sm:text-base">{title}</span>
              {!Art && <span className="mt-1 hidden text-[11px] leading-snug opacity-80 min-[400px]:block sm:text-xs">{sub}</span>}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
