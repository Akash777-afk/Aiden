import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, LifeBuoy, RotateCw } from 'lucide-react'
import { AidenBot } from '../illustrations/AidenBot'
import { UserAvatar } from '../common'
import { openSupport } from '../layout/SupportSheet'
import { fmtTime } from '../../utils/date'
import { cn } from '../../utils/cn'

// Tiny, safe markdown subset: **bold**, *italic*, line breaks, bullets / numbered lines
function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i} className="opacity-75">{p.slice(1, -1)}</em>
    return <Fragment key={i}>{p}</Fragment>
  })
}
function RichText({ text }) {
  return text.split('\n').map((line, i) =>
    line.trim() === '' ? (
      <div key={i} className="h-2" />
    ) : /^(•|\d+\.)\s/.test(line) ? (
      <div key={i} className="flex gap-2 pl-1">
        <span className="shrink-0 opacity-60">{line.match(/^(•|\d+\.)/)[0]}</span>
        <span>{inline(line.replace(/^(•|\d+\.)\s/, ''))}</span>
      </div>
    ) : (
      <div key={i}>{inline(line)}</div>
    ),
  )
}

export function ChatMessage({ msg, user, onRetry }) {
  const nav = useNavigate()
  const mine = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}
    >
      {mine ? (
        <UserAvatar user={user} size={30} className="hidden sm:block" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#5B3F8C] to-[#2A1F4E]">
          <AidenBot size={34} />
        </span>
      )}
      <div className={cn('flex max-w-[82%] flex-col gap-2 sm:max-w-[70%]', mine && 'items-end')}>
        <div
          className={cn(
            'rounded-[20px] px-4 py-2.5 text-[14.5px] leading-relaxed',
            mine
              ? 'rounded-br-md bg-gradient-to-br from-primary to-[#A97FD6] text-white shadow-glow'
              : msg.error
                ? 'rounded-bl-md border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                : 'rounded-bl-md border border-line/70 bg-surface text-ink shadow-soft',
          )}
        >
          <RichText text={msg.text} />
          {msg.error && onRetry && (
            <button onClick={onRetry} className="mt-2 inline-flex items-center gap-1 text-xs font-bold">
              <RotateCw className="size-3.5" /> Retry
            </button>
          )}
        </div>
        {msg.crisis && (
          <button onClick={openSupport} className="flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-soft">
            <LifeBuoy className="size-4" /> Show support options now
          </button>
        )}
        {msg.actions?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.actions.map((a) => (
              <button
                key={a.label}
                onClick={() => nav(a.to)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-lavender/30 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-lavender/60 dark:text-lavender"
              >
                {a.label} <ArrowRight className="size-3.5" />
              </button>
            ))}
          </div>
        )}
        <span className="px-1 text-[10px] text-muted">
          {fmtTime(msg.at)}
          {!mine && !msg.error && ' · demo response'}
        </span>
      </div>
    </motion.div>
  )
}

export function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2" aria-label="Aiden is typing">
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#5B3F8C] to-[#2A1F4E]">
        <AidenBot size={34} thinking />
      </span>
      <div className="flex gap-1.5 rounded-[20px] rounded-bl-md border border-line/70 bg-surface px-4 py-3.5 shadow-soft">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-primary"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
