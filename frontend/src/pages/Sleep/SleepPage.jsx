import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronLeft, Heart, Info, Moon, Play, Plus, Sparkles, Sunrise, Wind } from 'lucide-react'
import { Button, Card, Chip, EmptyState, Textarea } from '../../components/common'
import { AudioPlayer } from '../../components/sleep/AudioPlayer'
import { RitualPlayer } from '../../components/sleep/RitualPlayer'
import { SleepLogList, SleepLogModal } from '../../components/sleep/SleepJournal'
import { SLEEP_CATEGORIES, SLEEP_RITUALS, SLEEP_TRACKS } from '../../mock/content'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fmtClock } from '../../utils/date'
import { cn } from '../../utils/cn'

const RITUAL_ICON = { unwind10: Moon, overthinking: Wind, peaceful: Sparkles, decompress: BookOpen }

function MorningReflection() {
  const { saveEntry } = useData()
  const toast = useToast()
  const [a, setA] = useState({ rested: '', helped: '', intention: '' })
  const [err, setErr] = useState('')
  const save = () => {
    if (!a.rested.trim() && !a.helped.trim() && !a.intention.trim()) return setErr('Answer at least one question')
    saveEntry({
      title: 'Morning reflection',
      body: [a.rested && `How I feel: ${a.rested}`, a.helped && `What helped/hurt my sleep: ${a.helped}`, a.intention && `Intention: ${a.intention}`].filter(Boolean).join('\n\n'),
      tags: ['sleep', 'morning'],
      mood: 'calm',
    })
    setA({ rested: '', helped: '', intention: '' })
    setErr('')
    toast('Saved to your journal')
  }
  return (
    <Card className="space-y-3 border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2">
        <Sunrise className="size-5 text-sun" />
        <h3 className="font-bold text-ink">Morning reflection</h3>
      </div>
      <Textarea rows={2} label="How do you feel this morning?" value={a.rested} onChange={(e) => setA({ ...a, rested: e.target.value })} placeholder="Rested, groggy, calm…" />
      <Textarea rows={2} label="What helped or hurt your sleep?" value={a.helped} onChange={(e) => setA({ ...a, helped: e.target.value })} placeholder="Late screen time, a calm evening walk…" />
      <Textarea rows={2} label="One intention for today" value={a.intention} onChange={(e) => setA({ ...a, intention: e.target.value })} placeholder="Be gentle with myself…" error={err} />
      <Button className="w-full" onClick={save}>
        Save reflection
      </Button>
    </Card>
  )
}

export default function SleepPage() {
  const nav = useNavigate()
  const { prefs } = useApp()
  const { favorites, toggleFavorite } = useData()
  const toast = useToast()
  const [cat, setCat] = useState('all')
  const [track, setTrack] = useState(null)
  const [ritual, setRitual] = useState(null)
  const [logOpen, setLogOpen] = useState(false)

  const list = cat === 'favorites' ? SLEEP_TRACKS.filter((t) => favorites.includes(t.id)) : SLEEP_TRACKS.filter((t) => cat === 'all' || t.category === cat)
  const fav = (id) => {
    toggleFavorite(id)
    toast(favorites.includes(id) ? 'Removed from favourites' : 'Added to favourites')
  }

  return (
    <div className="dark min-h-dvh bg-[linear-gradient(180deg,#1B1638_0%,#15121F_55%)] mb-[calc(-88px_-_var(--safe-bottom))] pb-[calc(13rem_+_var(--safe-bottom))] text-ink lg:-mb-10 lg:pb-32">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(139,114,199,0.45),transparent_60%)]" />
        {Array.from({ length: 30 }, (_, i) => (
          <motion.span
            key={i}
            className="absolute size-[2px] rounded-full bg-white"
            style={{ top: `${(i * 29) % 90}%`, left: `${(i * 47) % 100}%` }}
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
        <motion.div className="absolute top-8 right-8 size-24 rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFF6DA,#F6CF7E_60%,#C99A47)] shadow-[0_0_80px_20px_rgba(246,207,126,0.25)] sm:size-32 lg:right-20" animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity }} />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(1rem+var(--safe-top))] pb-8 sm:px-6 lg:px-10 lg:pt-8">
          <button onClick={() => nav(-1)} className="mb-6 grid size-10 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white" aria-label="Back">
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-xs font-bold tracking-wider text-lavender uppercase">Sleep</div>
          <h1 className="mt-1 max-w-[70%] text-[28px] leading-tight font-extrabold text-white lg:text-4xl">Rest easy tonight</h1>
          <p className="mt-1.5 max-w-sm text-sm text-white/70">Your wind-down reminder is set for {fmtClock(prefs.reminderTime)}.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="light" icon={Play} onClick={() => setRitual(SLEEP_RITUALS[0])}>
              Start 10-min unwind
            </Button>
            <Button variant="outline" className="border-white/20 bg-white/10 text-white" icon={Plus} onClick={() => setLogOpen(true)}>
              Log last night
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-10">
        <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
          <Info className="mt-0.5 size-4 shrink-0 text-lavender" />
          Prototype audio: soundscapes are generated live in your browser. Stories and guided sessions show the script with a soft ambient pad. Studio recordings come in a later phase.
        </div>

        {/* Sounds */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Soundscapes & stories</h2>
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Chip active={cat === 'favorites'} onClick={() => setCat('favorites')} icon={Heart}>
              Favourites
            </Chip>
            {SLEEP_CATEGORIES.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
          {list.length === 0 ? (
            <EmptyState icon={Heart} title={cat === 'favorites' ? 'No favourites yet' : 'Nothing here yet'} message="Tap the heart on any sound to save it here." className="border-white/15" />
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence>
                {list.map((t) => {
                  const active = track?.id === t.id
                  const isFav = favorites.includes(t.id)
                  return (
                    <motion.div
                      layout
                      key={t.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn('relative flex aspect-[4/5] flex-col overflow-hidden rounded-3xl p-3.5 text-white shadow-lg sm:aspect-square', active && 'ring-2 ring-lavender')}
                      style={{ background: `linear-gradient(160deg, ${t.colors[0]}, ${t.colors[1]})` }}
                    >
                      <svg className="absolute right-0 bottom-0 w-full opacity-30" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
                        <path d="M0 30 Q 25 10 50 25 T 100 20 V40 H0Z" fill="#fff" />
                      </svg>
                      <button onClick={() => fav(t.id)} className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-black/20" aria-label={isFav ? `Unfavourite ${t.title}` : `Favourite ${t.title}`} aria-pressed={isFav}>
                        <Heart className={cn('size-4', isFav && 'fill-coral text-coral')} />
                      </button>
                      <span className="text-[10px] font-bold tracking-wider text-white/70 uppercase">{SLEEP_CATEGORIES.find((c) => c.id === t.category)?.label}</span>
                      <div className="relative mt-auto">
                        <div className="text-[15px] leading-tight font-extrabold">{t.title}</div>
                        <div className="mt-0.5 text-[11px] text-white/70">{t.minutes} min</div>
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTrack(t)} className="relative mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/90 text-xs font-bold text-[#2A1F4E]" aria-label={`Play ${t.title}`}>
                        <Play className="size-3.5 fill-current" /> {active ? 'Playing' : 'Play'}
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Rituals */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Sleep rituals</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SLEEP_RITUALS.map((r) => {
              const Icon = RITUAL_ICON[r.id]
              const mins = Math.round(r.steps.reduce((a, s) => a + s.s, 0) / 60)
              return (
                <Card key={r.id} interactive onClick={() => setRitual(r)} className="flex items-center gap-4 border-white/10 bg-white/5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#5B5FB8] to-[#3a3584] text-white">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white">{r.title}</div>
                    <div className="text-xs text-white/60">
                      {r.desc} · {mins} min · {r.steps.length} steps
                    </div>
                  </div>
                  <Play className="size-5 text-lavender" />
                </Card>
              )
            })}
          </div>
        </section>

        {/* Journal + Reflection */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Sleep journal</h2>
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => setLogOpen(true)}>
                Log
              </Button>
            </div>
            <SleepLogList />
          </div>
          <div>
            <h2 className="mb-3 text-lg font-bold text-white">Good morning</h2>
            <MorningReflection />
          </div>
        </section>
      </div>

      <AnimatePresence>
        {track && <AudioPlayer key="player" track={track} favorite={favorites.includes(track.id)} onFavorite={() => fav(track.id)} onClose={() => setTrack(null)} />}
      </AnimatePresence>
      <RitualPlayer ritual={ritual} onClose={() => setRitual(null)} onComplete={() => toast('Ritual complete — rest well 🌙')} />
      <SleepLogModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}
