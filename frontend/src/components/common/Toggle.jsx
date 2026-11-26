import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export function Toggle({ checked, onChange, label, description, icon: Icon, disabled }) {
  return (
    <div className={cn('flex items-center gap-3 py-3', disabled && 'opacity-50')}>
      {Icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary">
          <Icon className="size-[18px]" />
        </span>
      )}
      <button type="button" onClick={() => !disabled && onChange(!checked)} className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-line')}
      >
        <motion.span
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 left-1 size-5 rounded-full bg-white shadow"
        />
      </button>
    </div>
  )
}

export function Segmented({ options, value, onChange, className, size = 'md' }) {
  const lid = useId()
  return (
    <div className={cn('inline-flex rounded-2xl bg-surface-2 p-1', className)} role="tablist">
      {options.map((o) => {
        const v = o.value ?? o
        const active = v === value
        const Icon = o.icon
        return (
          <button
            type="button"
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              'relative flex-1 rounded-xl font-semibold whitespace-nowrap transition-colors',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-[13px]',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span layoutId={lid} className="absolute inset-0 rounded-xl bg-surface shadow-soft" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative inline-flex items-center justify-center gap-1.5">
              {Icon && <Icon className="size-4" />}
              {o.label ?? o}
            </span>
          </button>
        )
      })}
    </div>
  )
}
