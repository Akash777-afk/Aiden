import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

export function PageHeader({ title, subtitle, back, actions, className, dark, eyebrow }) {
  const nav = useNavigate()
  return (
    <header className={cn('mb-5 flex items-start gap-3', className)}>
      {back && (
        <button
          type="button"
          onClick={() => (typeof back === 'string' ? nav(back) : window.history.state?.idx > 0 ? nav(-1) : nav('/'))}
          className={cn(
            'mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl border transition',
            dark ? 'border-white/15 bg-white/10 text-white hover:bg-white/20' : 'border-line bg-surface text-ink shadow-soft hover:border-primary/40',
          )}
          aria-label="Go back"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <div className={cn('mb-0.5 text-xs font-bold tracking-wider uppercase', dark ? 'text-lavender' : 'text-primary')}>{eyebrow}</div>}
        <h1 className={cn('text-[22px] leading-tight font-extrabold tracking-tight lg:text-[26px]', dark ? 'text-white' : 'text-ink')}>{title}</h1>
        {subtitle && <p className={cn('mt-0.5 text-sm', dark ? 'text-white/70' : 'text-muted')}>{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

// Standard page container: consistent gutters + width across all screens
export function Page({ children, className, wide }) {
  return (
    <div className={cn('mx-auto w-full px-4 pt-[calc(1rem+var(--safe-top))] sm:px-6 lg:px-10 lg:pt-8', wide ? 'max-w-7xl' : 'max-w-6xl', className)}>
      {children}
    </div>
  )
}
