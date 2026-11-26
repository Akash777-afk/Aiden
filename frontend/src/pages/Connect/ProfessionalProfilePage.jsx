import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Briefcase, CalendarCheck, GraduationCap, Heart, Languages, Share2, Star, ShieldAlert } from 'lucide-react'
import { Badge, Button, Card, DemoBadge, ErrorState, Page, PageHeader, PersonAvatar, Segmented, Skeleton } from '../../components/common'
import { DateStrip, SlotGrid } from '../../components/connect/Availability'
import { useAsync } from '../../hooks/useAsync'
import { professionalsService } from '../../services/professionals'
import { CONSULT_TYPES } from '../../mock/professionals'
import { useToast } from '../../context/ToastContext'
import { addDays, startOfDay } from '../../utils/date'

export default function ProfessionalProfilePage() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data: pro, loading, error, retry } = useAsync(() => professionalsService.get(id), [id])
  const [tab, setTab] = useState('about')
  const [saved, setSaved] = useState(false)
  const [date, setDate] = useState(() => (new Date().getDay() === 0 ? addDays(startOfDay(), 1) : startOfDay()))
  const [slot, setSlot] = useState(null)

  if (loading)
    return (
      <Page>
        <Skeleton className="mb-4 h-10 w-40" />
        <Skeleton className="mb-4 h-48" />
        <Skeleton className="h-72" />
      </Page>
    )
  if (error)
    return (
      <Page>
        <PageHeader back="/connect" title="Professional" />
        <ErrorState error={error} onRetry={retry} />
      </Page>
    )

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: pro.name, url })
      else {
        await navigator.clipboard.writeText(url)
        toast('Profile link copied')
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <Page className="pb-28 lg:pb-8">
      <PageHeader
        back="/connect"
        title="Profile"
        actions={
          <>
            <Button size="icon" variant="outline" onClick={share} aria-label="Share profile">
              <Share2 className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setSaved((s) => !s)
                toast(saved ? 'Removed from saved' : 'Saved to your list')
              }}
              aria-label={saved ? 'Unsave' : 'Save'}
              aria-pressed={saved}
            >
              <Heart className={`size-5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
            </Button>
          </>
        }
      />

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card className="relative overflow-hidden p-5">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-lavender/70 via-[#F6D5E7]/60 to-mint/30 dark:from-primary/30 dark:via-primary/10 dark:to-transparent" />
            <div className="relative flex flex-col items-center gap-4 pt-4 text-center sm:flex-row sm:items-end sm:text-left">
              <PersonAvatar look={pro.avatar} size={104} className="rounded-3xl ring-4 ring-surface" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-extrabold text-ink">{pro.name}</h1>
                  <DemoBadge>Sample profile</DemoBadge>
                </div>
                <p className="font-semibold text-primary">{pro.designation}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-muted sm:justify-start">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-4 fill-amber-400 text-amber-400" /> <b className="text-ink">{pro.rating}</b> ({pro.reviewsCount} reviews)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="size-4" /> {pro.experience} years
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Languages className="size-4" /> {pro.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Segmented
            value={tab}
            onChange={setTab}
            className="w-full"
            options={[
              { value: 'about', label: 'About' },
              { value: 'reviews', label: 'Reviews' },
              { value: 'pricing', label: 'Pricing' },
            ]}
          />

          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {tab === 'about' && (
              <div className="space-y-4">
                <Card>
                  <h2 className="mb-2 font-bold text-ink">Biography</h2>
                  <p className="text-sm leading-relaxed text-muted">{pro.bio}</p>
                  <h3 className="mt-4 mb-2 text-sm font-bold text-ink">Specialisations</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {pro.specializations.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                  <h3 className="mt-4 mb-2 text-sm font-bold text-ink">Approach</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {pro.approach.map((s) => (
                      <Badge key={s} tone="mint">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h2 className="mb-3 font-bold text-ink">Qualifications & registration</h2>
                  <ul className="space-y-2.5 text-sm">
                    {pro.qualifications.map((q) => (
                      <li key={q} className="flex items-center gap-2.5 text-ink">
                        <GraduationCap className="size-4 text-primary" /> {q}
                      </li>
                    ))}
                    <li className="flex items-center gap-2.5 text-ink">
                      <BadgeCheck className="size-4 text-primary" /> {pro.registration}
                    </li>
                  </ul>
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                    <ShieldAlert className="mt-0.5 size-3.5 shrink-0" /> Placeholder credentials — verification will be done against official registries in a later phase.
                  </p>
                </Card>
              </div>
            )}
            {tab === 'reviews' && (
              <div className="space-y-3">
                {pro.reviews.map((r) => (
                  <Card key={r.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">{r.name}</span>
                      <span className="text-xs text-muted">{r.when}</span>
                    </div>
                    <div className="my-1 flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`size-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-line'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted">{r.text}</p>
                  </Card>
                ))}
                <p className="text-center text-xs text-muted">Sample reviews for demonstration.</p>
              </div>
            )}
            {tab === 'pricing' && (
              <Card className="divide-y divide-line p-2">
                {CONSULT_TYPES.filter((t) => pro.modes.includes(t.id)).map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-3">
                    <div>
                      <div className="text-sm font-bold text-ink">{t.label}</div>
                      <div className="text-xs text-muted">
                        {t.desc} · {t.duration}
                      </div>
                    </div>
                    <div className="font-extrabold text-ink">₹{Math.round(pro.fee * t.multiplier).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </Card>
            )}
          </motion.div>
        </div>

        {/* Availability */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
              <CalendarCheck className="size-5 text-primary" /> Availability
            </h2>
            <DateStrip
              value={date}
              onChange={(d) => {
                setDate(d)
                setSlot(null)
              }}
            />
            <div className="mt-4">
              <SlotGrid proId={pro.id} date={date} value={slot} onChange={setSlot} />
            </div>
            <Button className="mt-5 hidden w-full lg:flex" size="lg" onClick={() => nav(`/connect/${pro.id}/book`, { state: { date: date.toISOString(), time: slot } })}>
              {slot ? 'Continue booking' : 'Book a session'}
            </Button>
          </Card>
        </div>
      </div>

      <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line px-4 pt-3 lg:hidden" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div>
            <div className="text-[11px] text-muted">from</div>
            <div className="font-extrabold text-ink">₹{pro.fee.toLocaleString('en-IN')}</div>
          </div>
          <Button className="flex-1" size="lg" onClick={() => nav(`/connect/${pro.id}/book`, { state: { date: date.toISOString(), time: slot } })}>
            {slot ? 'Continue booking' : 'Book a session'}
          </Button>
        </div>
      </div>
    </Page>
  )
}
