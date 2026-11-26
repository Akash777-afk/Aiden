import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export function Chip({ active, onClick, children, className, icon: Icon, color }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
        active ? 'border-transparent bg-primary text-white shadow-glow' : 'border-line bg-surface text-muted hover:text-ink',
        className,
      )}
      style={active && color ? { background: color } : undefined}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </motion.button>
  )
}

export function Badge({ children, className, tone = 'lavender' }) {
  const tones = {
    lavender: 'bg-lavender/60 text-primary-700 dark:bg-primary/20 dark:text-lavender',
    mint: 'bg-mint/25 text-emerald-700 dark:text-mint',
    coral: 'bg-coral/25 text-rose-700 dark:text-coral',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    gray: 'bg-surface-2 text-muted',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap', tones[tone], className)}>{children}</span>
}

export function DemoBadge({ children = 'Demo', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap text-amber-700 uppercase dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
        className,
      )}
    >
      ● {children}
    </span>
  )
}
