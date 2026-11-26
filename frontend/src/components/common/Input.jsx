import { forwardRef, useId } from 'react'
import { cn } from '../../utils/cn'

const base =
  'w-full rounded-2xl border bg-surface px-4 text-ink placeholder:text-muted/70 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15'

export function Field({ label, error, hint, children, id, className, required }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-500" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

export const Input = forwardRef(function Input({ label, error, hint, className, icon: Icon, required, ...rest }, ref) {
  const id = useId()
  return (
    <Field label={label} error={error} hint={hint} id={id} className={className} required={required}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn(base, 'h-12', Icon && 'pl-10', error ? 'border-rose-400' : 'border-line')}
          {...rest}
        />
      </div>
    </Field>
  )
})

export const Textarea = forwardRef(function Textarea({ label, error, hint, className, rows = 4, required, ...rest }, ref) {
  const id = useId()
  return (
    <Field label={label} error={error} hint={hint} id={id} className={className} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={!!error}
        className={cn(base, 'resize-none py-3 leading-relaxed', error ? 'border-rose-400' : 'border-line')}
        {...rest}
      />
    </Field>
  )
})

export const Select = forwardRef(function Select({ label, error, hint, className, options, required, ...rest }, ref) {
  const id = useId()
  return (
    <Field label={label} error={error} hint={hint} id={id} className={className} required={required}>
      <select ref={ref} id={id} className={cn(base, 'h-12 appearance-none', error ? 'border-rose-400' : 'border-line')} {...rest}>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </Field>
  )
})
