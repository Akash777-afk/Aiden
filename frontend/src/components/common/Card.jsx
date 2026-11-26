import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export function Card({ className, children, interactive, as, ...rest }) {
  const Comp = interactive ? motion.button : as || 'div'
  const motionProps = interactive ? { whileHover: { y: -2 }, whileTap: { scale: 0.98 }, type: 'button' } : {}
  return (
    <Comp
      className={cn(
        'rounded-[var(--radius-card)] border border-line/70 bg-surface p-4 shadow-soft',
        interactive && 'w-full text-left transition-shadow hover:shadow-lift',
        className,
      )}
      {...motionProps}
      {...rest}
    >
      {children}
    </Comp>
  )
}

export function SectionHeader({ title, action, onAction, subtitle, className }) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="shrink-0 text-sm font-semibold text-primary hover:text-primary-700">
          {action}
        </button>
      )}
    </div>
  )
}
