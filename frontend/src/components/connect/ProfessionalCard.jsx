import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Briefcase, Clock, Languages, Star } from 'lucide-react'
import { Badge, Button, DemoBadge, PersonAvatar } from '../common'

export function ProfessionalCard({ pro, index = 0 }) {
  const nav = useNavigate()
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col rounded-[var(--radius-card)] border border-line/70 bg-surface p-4 shadow-soft transition-shadow hover:shadow-lift"
    >
      <button onClick={() => nav(`/connect/${pro.id}`)} className="flex items-start gap-3 text-left">
        <div className="relative">
          <PersonAvatar look={pro.avatar} size={64} className="rounded-2xl" />
          {pro.available && <span className="absolute -right-0.5 -bottom-0.5 size-4 rounded-full bg-mint ring-[3px] ring-surface" title="Available" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-[15px] font-extrabold text-ink">{pro.name}</h3>
            <DemoBadge>Sample</DemoBadge>
          </div>
          <p className="text-[13px] font-medium text-primary">{pro.designation}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <b className="text-ink">{pro.rating}</b> ({pro.reviewsCount})
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3.5" />
              {pro.experience} yrs
            </span>
          </div>
        </div>
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {pro.specializations.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="size-3.5 shrink-0" />
          <span className="truncate">{pro.qualifications.join(' · ')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Languages className="size-3.5 shrink-0" />
          {pro.languages.join(', ')}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          Next: <span className={pro.available ? 'font-semibold text-emerald-600 dark:text-mint' : ''}>{pro.nextSlot}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div>
          <div className="text-[11px] text-muted">from</div>
          <div className="text-base font-extrabold text-ink">₹{pro.fee.toLocaleString('en-IN')}<span className="text-xs font-medium text-muted">/session</span></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => nav(`/connect/${pro.id}`)}>
            Profile
          </Button>
          <Button size="sm" onClick={() => nav(`/connect/${pro.id}/book`)}>
            Book
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
