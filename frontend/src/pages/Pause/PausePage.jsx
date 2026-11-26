import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wind, Hand, Eye, Brain, Footprints, Circle, Waves, Spline, Palette, Clock, CheckCircle2 } from 'lucide-react'
import { Card, DemoBadge, Modal, Page, PageHeader, SectionHeader, Button } from '../../components/common'
import { CalmScene } from '../../components/pause/CalmScene'
import { CALM_MOMENTS } from '../../mock/content'
import { LotusArt } from '../../components/illustrations/TileArt'

const RESETS = [
  { to: '/pause/breathe', title: 'Breathing', desc: 'Inhale · hold · exhale', icon: Wind, tint: 'tint-lilac', mins: '1–5 min' },
  { to: '/pause/relax/grounding', title: 'Guided grounding', desc: 'Feel your feet, find the floor', icon: Footprints, tint: 'tint-mint', mins: '3 min' },
  { to: '/pause/grounding', title: '5-4-3-2-1', desc: 'Come back to your senses', icon: Hand, tint: 'tint-peach', mins: '3 min' },
  { to: '/pause/relax/visual', title: 'Visual relaxation', desc: 'Follow the slow light', icon: Eye, tint: 'tint-sky', mins: '2 min' },
  { to: '/pause/relax/mindful', title: 'Mindfulness', desc: 'A gentle minute of presence', icon: Brain, tint: 'tint-sun', mins: '2 min' },
]

const GAMES = [
  { to: '/pause/play/bubbles', title: 'Bubble Flow', desc: 'Pop drifting bubbles', icon: Circle, colors: ['#9CC3EE', '#C79AE6'] },
  { to: '/pause/play/sand', title: 'Sandscape', desc: 'Draw flowing sand patterns', icon: Waves, colors: ['#F6CF7E', '#F2A995'] },
  { to: '/pause/play/lines', title: 'Flow Lines', desc: 'Connect matching dots', icon: Spline, colors: ['#8BCDB5', '#5FA98D'] },
  { to: '/pause/play/colors', title: 'Color Balance', desc: 'Arrange a calm gradient', icon: Palette, colors: ['#F19BB8', '#8B72C7'] },
]

export default function PausePage() {
  const nav = useNavigate()
  const [moment, setMoment] = useState(null)
  const [seen, setSeen] = useState([])

  return (
    <Page>
      <PageHeader back="/" eyebrow="Pause" title="The Calmer" subtitle="Reset your mind in a few minutes." />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tint-lotus relative mb-8 overflow-hidden rounded-[28px] p-5 sm:p-7">
        <LotusArt className="absolute -right-4 -bottom-6 h-40 w-48 opacity-90 sm:h-52 sm:w-60" />
        <div className="relative max-w-[65%]">
          <div className="text-xs font-bold tracking-wider uppercase opacity-80">Feeling overwhelmed?</div>
          <h2 className="mt-1 text-2xl font-extrabold">One minute. One breath at a time.</h2>
          <Button variant="light" className="mt-4" icon={Wind} onClick={() => nav('/pause/breathe')}>
            Breathe now
          </Button>
        </div>
      </motion.div>

      <section className="mb-8">
        <SectionHeader title="Quick Reset" subtitle="Short, guided practices" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {RESETS.map(({ to, title, desc, icon: Icon, tint, mins }, i) => (
            <motion.button
              key={to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav(to)}
              className={`${tint} flex min-h-[132px] flex-col rounded-[22px] p-4 text-left shadow-soft ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <Icon className="size-7" />
              <div className="mt-auto pt-3">
                <div className="font-extrabold">{title}</div>
                <div className="text-xs opacity-80">{desc}</div>
                <div className="mt-1 text-[11px] font-semibold opacity-70">{mins}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader title="Calm Play" subtitle="Gentle, no-pressure games" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {GAMES.map(({ to, title, desc, icon: Icon, colors }, i) => (
            <motion.button
              key={to}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav(to)}
              className="relative flex aspect-[5/4] flex-col overflow-hidden rounded-[22px] p-4 text-left text-white shadow-soft"
              style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
            >
              {Array.from({ length: 4 }, (_, k) => (
                <motion.span
                  key={k}
                  className="absolute rounded-full border border-white/40 bg-white/15"
                  style={{ width: 20 + k * 14, height: 20 + k * 14, right: 8 + k * 18, bottom: 6 + ((k * 23) % 40) }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3 + k, repeat: Infinity }}
                />
              ))}
              <Icon className="relative size-7" />
              <div className="relative mt-auto">
                <div className="font-extrabold">{title}</div>
                <div className="text-xs text-white/85">{desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Calm Moments" subtitle={`A curated set of ${CALM_MOMENTS.length} — no endless feed`} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CALM_MOMENTS.map((m) => (
            <Card key={m.id} interactive onClick={() => setMoment(m)} className="overflow-hidden p-0">
              <CalmScene scene={m.scene} className="h-32 w-full" />
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold tracking-wide text-primary uppercase">{m.kind}</div>
                  <div className="font-bold text-ink">{m.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Clock className="size-3" /> {m.minutes} min
                  </div>
                </div>
                {seen.includes(m.id) && <CheckCircle2 className="size-5 text-mint" aria-label="Viewed" />}
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted">You’ve reached the end. That’s enough for now 🌿</p>
      </section>

      <Modal open={!!moment} onClose={() => setMoment(null)} size="lg">
        {moment && (
          <div className="pt-4">
            <CalmScene scene={moment.scene} className="h-56 w-full rounded-3xl sm:h-72" />
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-primary uppercase">{moment.kind}</span>
              <DemoBadge>Prototype visual</DemoBadge>
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-ink">{moment.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{moment.text}</p>
            <Button
              className="mt-5 w-full"
              onClick={() => {
                setSeen((s) => [...new Set([...s, moment.id])])
                setMoment(null)
              }}
            >
              I feel a little calmer
            </Button>
          </div>
        )}
      </Modal>
    </Page>
  )
}
