import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true, loading }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="pt-6 text-center">
        <div className={`mx-auto mb-4 grid size-14 place-items-center rounded-full ${danger ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/15' : 'bg-lavender/60 text-primary'}`}>
          <AlertTriangle className="size-7" />
        </div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        {message && <p className="mt-1.5 text-sm text-muted">{message}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
