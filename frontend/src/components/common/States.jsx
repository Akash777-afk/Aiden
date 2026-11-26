import { motion } from 'framer-motion'
import { CloudOff, RotateCw } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-2xl bg-surface-2', className)} />
}

export function SkeletonList({ count = 3, className = 'h-24' }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action, onAction, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center', className)}
    >
      {Icon && (
        <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-lavender/50 text-primary dark:bg-primary/15">
          <Icon className="size-7" />
        </div>
      )}
      <h3 className="font-bold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-xs text-sm text-muted">{message}</p>}
      {action && (
        <Button className="mt-4" size="sm" onClick={onAction}>
          {action}
        </Button>
      )}
    </motion.div>
  )
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={cn('flex flex-col items-center rounded-3xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center dark:border-rose-500/20 dark:bg-rose-500/5', className)}>
      <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
        <CloudOff className="size-7" />
      </div>
      <h3 className="font-bold text-ink">Something went wrong</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">{error?.message || 'We could not load this right now.'}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" variant="outline" icon={RotateCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
