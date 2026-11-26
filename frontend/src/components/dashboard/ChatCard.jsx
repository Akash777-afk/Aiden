import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { AidenBot } from '../illustrations/AidenBot'

export function ChatCard({ className = '' }) {
  const nav = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`relative overflow-hidden rounded-[26px] border border-white/40 bg-gradient-to-br from-[#7C5CC4] via-[#8E6BD0] to-[#B28BE0] p-4 pr-3 shadow-lift ${className}`}
    >
      {/* wave texture */}
      <svg className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 opacity-25" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
        <path d="M0 70 C40 50 80 90 120 70 S180 50 200 60 L200 100 L0 100Z" fill="#fff" />
        <path d="M0 85 C50 70 90 100 140 82 S190 72 200 78 L200 100 L0 100Z" fill="#fff" opacity=".6" />
      </svg>
      <div className="relative flex items-center gap-2 sm:gap-4">
        <AidenBot size={72} className="-my-2 -ml-1 shrink-0 sm:size-[84px]" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] leading-tight font-extrabold whitespace-nowrap text-white sm:text-[21px]">Chat with Aiden</h2>
          <p className="mt-0.5 text-[12px] leading-snug text-white/85 sm:text-sm">Your personal companion for support, clarity and growth.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => nav('/ai')}
            className="mt-2.5 flex h-9 items-center gap-1 rounded-full bg-white pr-2.5 pl-3.5 text-[13px] font-bold text-primary-700 shadow-soft sm:hidden"
          >
            Start Chat <ChevronRight className="size-4" />
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => nav('/ai')}
          className="hidden h-11 shrink-0 items-center gap-1 rounded-full bg-white pr-3 pl-4 text-sm font-bold text-primary-700 shadow-soft sm:flex"
        >
          Start Chat <ChevronRight className="size-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
