import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { uid } from '../utils/id'

const ToastContext = createContext(null)

const ICONS = {
  success: { Icon: CheckCircle2, cls: 'text-emerald-500' },
  error: { Icon: AlertTriangle, cls: 'text-rose-500' },
  info: { Icon: Info, cls: 'text-primary' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (message, { type = 'success', action, duration = 3200 } = {}) => {
      const id = uid('t')
      setToasts((t) => [...t.slice(-2), { id, message, type, action }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end"
        style={{ bottom: 'calc(96px + var(--safe-bottom))' }}
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const { Icon, cls } = ICONS[t.type] || ICONS.info
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line px-4 py-3 text-sm shadow-lift"
                role="status"
              >
                <Icon className={`size-5 shrink-0 ${cls}`} />
                <span className="flex-1 font-medium text-ink">{t.message}</span>
                {t.action && (
                  <button
                    className="font-semibold text-primary"
                    onClick={() => {
                      t.action.onClick()
                      dismiss(t.id)
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink">
                  <X className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
