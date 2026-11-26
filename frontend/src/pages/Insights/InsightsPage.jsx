import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarCheck2, Moon, NotebookPen, Smile, Sparkles, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Card, DemoBadge, Page, PageHeader, Segmented, SectionHeader } from '../../components/common'
import { ChartCard, ChartTooltip, axisProps } from '../../components/insights/ChartCard'
import { GrowthStepper } from '../../components/dashboard/ProgressOverview'
import { useData } from '../../context/DataContext'
import { journalSeries, moodSeries, rangeHabitSeries, sleepSeries } from '../../utils/stats'

const MOOD_LABEL = { 1: 'Low', 2: 'Tense', 3: 'Okay', 4: 'Calm', 5: 'Great' }
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null)

function StatTile({ icon: Icon, label, value, delta, color, onClick }) {
  const up = delta > 0
  return (
    <Card interactive onClick={onClick} className="p-4">
      <span className="grid size-9 place-items-center rounded-xl" style={{ background: color + '26', color }}>
        <Icon className="size-[18px]" />
      </span>
      <div className="mt-3 text-2xl leading-none font-extrabold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
      {delta != null && Number.isFinite(delta) && delta !== 0 && (
        <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${up ? 'text-emerald-600 dark:text-mint' : 'text-rose-500'}`}>
          {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {up ? '+' : ''}
          {delta}% vs previous
        </div>
      )}
    </Card>
  )
}

export default function InsightsPage() {
  const nav = useNavigate()
  const { habits, checkins, sleepLogs, journal } = useData()
  const [range, setRange] = useState(7)
  const days = range

  const mood = useMemo(() => moodSeries(checkins, days), [checkins, days])
  const habitS = useMemo(() => rangeHabitSeries(habits, days), [habits, days])
  const sleep = useMemo(() => sleepSeries(sleepLogs, days), [sleepLogs, days])
  const jr = useMemo(() => journalSeries(journal, days), [journal, days])
  const prevMood = useMemo(() => moodSeries(checkins, days * 2).slice(0, days), [checkins, days])
  const prevHabit = useMemo(() => rangeHabitSeries(habits, days * 2).slice(0, days), [habits, days])

  const moodAvg = avg(mood.filter((m) => m.mood != null).map((m) => m.mood))
  const moodPrev = avg(prevMood.filter((m) => m.mood != null).map((m) => m.mood))
  const habitAvg = avg(habitS.map((h) => h.pct))
  const habitPrev = avg(prevHabit.map((h) => h.pct))
  const sleepAvg = avg(sleep.filter((s) => s.hours != null).map((s) => s.hours))
  const entries = jr.reduce((a, b) => a + b.entries, 0)
  const pctDelta = (a, b) => (a != null && b ? Math.round(((a - b) / b) * 100) : null)

  const tick = { ...axisProps, interval: days > 7 ? 4 : 0 }

  return (
    <Page>
      <PageHeader eyebrow="Insights" title="Your wellbeing" subtitle="Patterns from your check-ins, habits, sleep and reflections." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 7, label: 'This week' },
            { value: 30, label: 'This month' },
          ]}
        />
        <DemoBadge>Demonstration data</DemoBadge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Smile} label="Average mood" value={moodAvg ? MOOD_LABEL[Math.round(moodAvg)] : '—'} delta={pctDelta(moodAvg, moodPrev)} color="#8B72C7" onClick={() => nav('/pulse')} />
        <StatTile icon={CalendarCheck2} label="Habit completion" value={habitAvg != null ? `${Math.round(habitAvg)}%` : '—'} delta={pctDelta(habitAvg, habitPrev)} color="#3FA872" onClick={() => nav('/rhythm')} />
        <StatTile icon={Moon} label="Average sleep" value={sleepAvg ? `${sleepAvg.toFixed(1)}h` : '—'} color="#5B5FB8" onClick={() => nav('/sleep')} />
        <StatTile icon={NotebookPen} label="Journal entries" value={entries} color="#E9776F" onClick={() => nav('/journal')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Mood trend"
          subtitle="Average check-in score (1 low → 5 great)"
          className="lg:col-span-2"
          table={{ columns: ['Date', 'Mood score', 'Check-ins'], rows: mood.map((m) => [m.label, m.mood, m.count]) }}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mood} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8B72C7" stopOpacity={0.35} />
                    <stop offset="1" stopColor="#8B72C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--c-line)" strokeDasharray="3 3" />
                <XAxis dataKey="short" {...tick} />
                <YAxis domain={[1, 5]} ticks={[1, 3, 5]} {...axisProps} />
                <ReferenceLine y={3} stroke="var(--c-muted)" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Tooltip content={<ChartTooltip labelKey="label" format={(v) => `${v} · ${MOOD_LABEL[Math.round(v)]}`} />} />
                <Area type="monotone" dataKey="mood" name="Mood" stroke="#8B72C7" strokeWidth={2} fill="url(#moodFill)" connectNulls dot={days <= 7 ? { r: 4, fill: '#8B72C7', stroke: 'var(--c-surface)', strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Habit completion" subtitle="% of scheduled habits done" table={{ columns: ['Date', 'Completed %'], rows: habitS.map((h) => [h.label, h.pct + '%']) }}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitS} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--c-line)" strokeDasharray="3 3" />
                <XAxis dataKey="short" {...tick} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]} {...axisProps} />
                <Tooltip cursor={{ fill: 'var(--c-surface-2)' }} content={<ChartTooltip labelKey="label" format={(v) => `${v}%`} />} />
                <Bar dataKey="pct" name="Completed" fill="#5FA98D" radius={[4, 4, 0, 0]} maxBarSize={days > 7 ? 10 : 26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Sleep reflections" subtitle="Hours slept per night" table={{ columns: ['Night', 'Hours', 'Quality /5'], rows: sleep.map((s) => [s.label, s.hours, s.quality]) }}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleep} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--c-line)" strokeDasharray="3 3" />
                <XAxis dataKey="short" {...tick} />
                <YAxis domain={[0, 10]} ticks={[0, 4, 8]} {...axisProps} />
                <ReferenceLine y={7} stroke="#5B5FB8" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '7h', position: 'right', fill: 'var(--c-muted)', fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'var(--c-surface-2)' }} content={<ChartTooltip labelKey="label" format={(v, p) => `${v}h · quality ${p.payload.quality}/5`} />} />
                <Bar dataKey="hours" name="Sleep" fill="#6E68C8" radius={[4, 4, 0, 0]} maxBarSize={days > 7 ? 10 : 26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Journaling activity" subtitle={days > 7 ? 'Entries per week' : 'Entries per day'} table={{ columns: ['Period', 'Entries'], rows: jr.map((j) => [j.label, j.entries]) }}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jr} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--c-line)" strokeDasharray="3 3" />
                <XAxis dataKey="short" {...axisProps} interval={0} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip cursor={{ fill: 'var(--c-surface-2)' }} content={<ChartTooltip labelKey="label" />} />
                <Bar dataKey="entries" name="Entries" fill="#E9776F" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="space-y-4">
          <GrowthStepper />
          <Card className="tint-lilac border-0 p-5">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <Sparkles className="size-5" /> Patterns we noticed <DemoBadge>Demo</DemoBadge>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Your mood tends to be higher on days you complete your morning walk.</li>
              <li>• Nights over 7 hours are followed by calmer check-ins.</li>
              <li>• You journal most often on weekends.</li>
            </ul>
            <button onClick={() => nav('/ai')} className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
              Explore with Aiden <ArrowRight className="size-4" />
            </button>
          </Card>
        </div>
      </div>

      <SectionHeader className="mt-8" title="Keep growing" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Check in now', '/pulse', 'Log how you feel'],
          ['Plan tomorrow', '/rhythm/routine', 'Adjust your rhythm'],
          ['Learn something', '/learn', '3-minute reads'],
        ].map(([t, to, d], i) => (
          <motion.div key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card interactive onClick={() => nav(to)} className="flex items-center justify-between">
              <div>
                <div className="font-bold text-ink">{t}</div>
                <div className="text-xs text-muted">{d}</div>
              </div>
              <ArrowRight className="size-5 text-primary" />
            </Card>
          </motion.div>
        ))}
      </div>
    </Page>
  )
}
