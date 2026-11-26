import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Users, Wind, ShieldAlert } from 'lucide-react'
import { Modal, Button } from '../common'

const EVT = 'aiden:support'
export const openSupport = () => window.dispatchEvent(new Event(EVT))

// Global "urgent help" sheet. Helplines listed are public Indian services.
export function SupportSheet() {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  useEffect(() => {
    const on = () => setOpen(true)
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])
  const go = (to) => {
    setOpen(false)
    nav(to)
  }
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="You're not alone" subtitle="If you're in danger or thinking about harming yourself, please reach out now.">
      <div className="space-y-3 pt-2">
        <a href="tel:14416" className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-[#A97FD6] p-4 text-white shadow-glow">
          <span className="grid size-11 place-items-center rounded-xl bg-white/20">
            <Phone className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold">Tele-MANAS · 14416</span>
            <span className="block text-xs text-white/80">Free, 24×7 national mental health helpline (India)</span>
          </span>
        </a>
        <a href="tel:112" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
          <span className="grid size-11 place-items-center rounded-xl bg-rose-500 text-white">
            <ShieldAlert className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-ink">Emergency · 112</span>
            <span className="block text-xs text-muted">If you or someone else is in immediate danger</span>
          </span>
        </a>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" icon={Wind} onClick={() => go('/pause/breathe')}>
            Breathe with me
          </Button>
          <Button variant="secondary" icon={Users} onClick={() => go('/connect')}>
            Find a professional
          </Button>
        </div>
        <p className="pt-1 text-center text-xs text-muted">AIDEN is a wellbeing companion and does not replace professional or emergency care.</p>
      </div>
    </Modal>
  )
}
