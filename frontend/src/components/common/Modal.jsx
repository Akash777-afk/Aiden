import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useIsDesktop } from '../../hooks/useMediaQuery'

// Bottom sheet on mobile, centered dialog on desktop.
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', className }) {
  const desktop = useIsDesktop()
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const widths = { sm: 'lg:max-w-sm', md: 'lg:max-w-lg', lg: 'lg:max-w-2xl' }
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={desktop ? { opacity: 0, scale: 0.95, y: 10 } : { y: '100%' }}
            animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={desktop ? { opacity: 0, scale: 0.95, y: 10 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-surface shadow-lift lg:rounded-[28px]',
              widths[size],
              className,
            )}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line lg:hidden" />
            {title && (
              <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-4 pb-2">
                <div>
                  <h3 className="text-lg font-bold text-ink">{title}</h3>
                  {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                </div>
                <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close">
                  <X className="size-5" />
                </button>
              </div>
            )}
            <div className={cn('overflow-y-auto px-5', footer ? 'pb-4' : 'pb-[calc(1.25rem+var(--safe-bottom))] lg:pb-5')}>{children}</div>
            {footer && <div className="shrink-0 border-t border-line px-5 py-4 pb-[calc(1rem+var(--safe-bottom))] lg:pb-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
