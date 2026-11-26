import { motion } from 'framer-motion'
import { EMOTIONS } from '../../utils/emotions'
import { cn } from '../../utils/cn'

// variant "glass" sits on the dark hero; "light" sits on surfaces
export function EmotionSelector({ value, onChange, variant = 'light', className, compact }) {
  return (
    <div className={cn('no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)} role="radiogroup" aria-label="How are you feeling?">
      {EMOTIONS.map((e, i) => {
        const active = value === e.id
        return (
          <motion.button
            type="button"
            key={e.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(e.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -2 }}
            className={cn(
              'flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition-all',
              compact ? 'h-[70px] w-[62px]' : 'h-[78px] w-[68px]',
              variant === 'glass'
                ? active
                  ? 'border border-white/60 bg-white/25 shadow-[0_0_0_3px_rgba(216,199,244,0.35)] backdrop-blur-md'
                  : 'glass-dark hover:bg-white/20'
                : active
                  ? 'border-2 bg-surface shadow-lift'
                  : 'border border-line bg-surface hover:border-primary/40',
            )}
            style={variant !== 'glass' && active ? { borderColor: e.color } : undefined}
          >
            <motion.span
              className="text-[26px] leading-none"
              animate={active ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : { scale: 1 }}
              transition={{ duration: 0.45 }}
            >
              {e.emoji}
            </motion.span>
            <span className={cn('text-[11px] font-semibold', variant === 'glass' ? 'text-white' : active ? 'text-ink' : 'text-muted')}>{e.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
