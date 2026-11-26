import { Star } from 'lucide-react'
import { CONSEQUENCE_FIELDS } from './tac'
import { cn } from '../../utils/cn'

export function CompareActions({ actions, chosen, onChoose }) {
  if (!actions.length) return null
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="grid min-w-full auto-cols-[minmax(230px,1fr)] grid-flow-col gap-3">
        {actions.map((a) => {
          const active = chosen === a.id
          return (
            <div key={a.id} className={cn('flex flex-col rounded-3xl border-2 bg-surface p-4 shadow-soft transition', active ? 'border-primary shadow-lift' : 'border-line')}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold text-ink">{a.label}</h4>
                <div className="flex shrink-0" aria-label={`Your feeling: ${a.rating} of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('size-3.5', i < a.rating ? 'fill-amber-400 text-amber-400' : 'text-line')} />
                  ))}
                </div>
              </div>
              <dl className="mt-3 flex-1 space-y-2.5">
                {CONSEQUENCE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                      <span className="size-2 rounded-full" style={{ background: f.color }} />
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 text-[13px] text-ink">{a[f.key]?.trim() || <span className="text-muted">—</span>}</dd>
                  </div>
                ))}
              </dl>
              {onChoose && (
                <button
                  onClick={() => onChoose(a.id)}
                  aria-pressed={active}
                  className={cn('mt-4 h-10 rounded-xl text-sm font-bold transition', active ? 'bg-primary text-white' : 'bg-surface-2 text-ink hover:bg-lavender/50')}
                >
                  {active ? '✓ Leaning towards this' : 'Lean towards this'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
