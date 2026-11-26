import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Bell, BellRing, Brain, ChevronDown, Clock, Download, Eye, FlaskConical, Globe, HeartHandshake, Info, Lock, LogOut, Moon, Monitor, Palette, ShieldCheck,
  Sparkles, Sun, Trash2, Zap, BarChart3, CalendarClock, BookOpen, RotateCcw, Send, HelpCircle,
} from 'lucide-react'
import { Button, Card, ConfirmDialog, Input, Page, PageHeader, Select, Textarea, Toggle } from '../../components/common'
import { LogoMark } from '../../components/illustrations/Logo'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../utils/cn'

function Section({ id, icon: Icon, title, children, desc }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-bold tracking-wide text-muted uppercase">{title}</h2>
      </div>
      {desc && <p className="mb-2 px-1 text-xs text-muted">{desc}</p>}
      <Card className="divide-y divide-line px-4 py-1">{children}</Card>
    </section>
  )
}

const FAQ = [
  ['Is AIDEN a replacement for therapy?', 'No. AIDEN is a wellbeing companion. It can help you reflect and build healthy habits, but it does not replace licensed mental health care. For urgent help, call Tele-MANAS on 14416 or 112 in an emergency.'],
  ['Where is my data stored?', 'In this prototype, wellbeing data (check-ins, journal, chats, decisions) lives only in your browser’s memory and disappears when you reload. Only UI preferences are saved on this device.'],
  ['Is the AI real?', 'Not yet. Aiden currently uses clearly-labelled demonstration responses. A real, safety-reviewed AI model will be connected in a later phase.'],
  ['Are the professionals real?', 'No — the profiles in Connect are fictional samples used to demonstrate the booking experience.'],
]

function HelpCenter() {
  const toast = useToast()
  const [open, setOpen] = useState(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { topic: 'General question', message: '' } })
  const submit = handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 700))
    reset()
    toast('Message sent (demo) — we’d reply by email')
  })
  return (
    <>
      {FAQ.map(([q, a], i) => (
        <div key={q}>
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 py-3.5 text-left" aria-expanded={open === i}>
            <span className="flex-1 text-sm font-semibold text-ink">{q}</span>
            <ChevronDown className={cn('size-4 text-muted transition', open === i && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-3.5 text-sm text-muted">
                {a}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}
      <form onSubmit={submit} className="space-y-3 py-4" noValidate>
        <div className="text-sm font-bold text-ink">Contact support</div>
        <Select options={['General question', 'Report a bug', 'Feature idea', 'Account & privacy']} aria-label="Topic" {...register('topic')} />
        <Textarea rows={3} placeholder="How can we help?" error={errors.message?.message} {...register('message', { required: 'Please write a message', minLength: { value: 10, message: 'At least 10 characters' } })} />
        <Button type="submit" size="sm" icon={Send} loading={isSubmitting}>
          Send message
        </Button>
      </form>
    </>
  )
}

export default function SettingsPage() {
  const { prefs, updatePrefs, signOut, resetDemo } = useApp()
  const toast = useToast()
  const nav = useNavigate()
  const { hash } = useLocation()
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 250)
  }, [hash])

  const notif = (k) => (v) => updatePrefs({ notifications: { [k]: v } })
  const priv = (k) => (v) => updatePrefs({ privacy: { [k]: v } })
  const ai = (k) => (v) => updatePrefs({ ai: { [k]: v } })

  const requestPush = async () => {
    if (!('Notification' in window)) return toast('Notifications are not supported in this browser', { type: 'error' })
    const r = await Notification.requestPermission()
    toast(r === 'granted' ? 'Browser notifications allowed' : 'Notifications were not allowed', { type: r === 'granted' ? 'success' : 'info' })
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), note: 'Demo export of saved preferences only', prefs }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'aiden-preferences.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Preferences exported')
  }

  const THEMES = [
    { v: 'light', label: 'Light', icon: Sun },
    { v: 'dark', label: 'Dark', icon: Moon },
    { v: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <Page className="max-w-3xl">
      <PageHeader back="/profile" title="Settings" subtitle="Make AIDEN work the way you like." />

      <nav className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Settings sections">
        {[
          ['appearance', 'Appearance'],
          ['preferences', 'Preferences'],
          ['notifications', 'Notifications'],
          ['privacy', 'Privacy'],
          ['ai', 'AI'],
          ['help', 'Help'],
          ['about', 'About'],
        ].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-ink">
            {l}
          </a>
        ))}
      </nav>

      <div className="space-y-7">
        <Section id="appearance" icon={Palette} title="Appearance">
          <div className="py-4">
            <div className="mb-2 text-sm font-semibold text-ink">Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(({ v, label, icon: Icon }) => (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  key={v}
                  onClick={() => updatePrefs({ theme: v })}
                  aria-pressed={prefs.theme === v}
                  className={cn('flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-sm font-semibold transition', prefs.theme === v ? 'border-primary bg-lavender/30 text-ink dark:bg-primary/15' : 'border-line text-muted')}
                >
                  <span className={cn('grid h-12 w-full place-items-center rounded-xl', v === 'dark' ? 'bg-[#1f1a2e] text-white' : v === 'light' ? 'bg-[#FAF8FC] text-[#292536] border border-line' : 'bg-gradient-to-r from-[#FAF8FC] to-[#1f1a2e] text-primary')}>
                    <Icon className="size-5" />
                  </span>
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
          <Toggle icon={Moon} label="Dark mode" description="Quick switch between light and dark" checked={prefs.theme === 'dark'} onChange={(v) => updatePrefs({ theme: v ? 'dark' : 'light' })} />
          <Toggle icon={Zap} label="Reduce motion" description="Minimise animations across the app" checked={prefs.reduceMotion} onChange={(v) => updatePrefs({ reduceMotion: v })} />
        </Section>

        <Section id="preferences" icon={Globe} title="Preferences">
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Select label="Language" value={prefs.language} onChange={(e) => updatePrefs({ language: e.target.value })} options={['English', 'हिन्दी (coming soon)', 'தமிழ் (coming soon)', 'ಕನ್ನಡ (coming soon)']} hint="Only English is available in this prototype" />
            <Input label="Wind-down reminder" type="time" icon={Clock} value={prefs.reminderTime} onChange={(e) => e.target.value && updatePrefs({ reminderTime: e.target.value })} />
            <Select label="Week starts on" value={prefs.weekStart} onChange={(e) => updatePrefs({ weekStart: e.target.value })} options={['Mon', 'Sun']} />
          </div>
        </Section>

        <Section id="notifications" icon={Bell} title="Notifications" desc="Demo: reminders appear in-app. Real push notifications come with the backend.">
          <Toggle icon={CalendarClock} label="Habit reminders" checked={prefs.notifications.reminders} onChange={notif('reminders')} />
          <Toggle icon={HeartHandshake} label="Daily check-in nudge" checked={prefs.notifications.checkins} onChange={notif('checkins')} />
          <Toggle icon={BarChart3} label="Weekly insights" checked={prefs.notifications.insights} onChange={notif('insights')} />
          <Toggle icon={CalendarClock} label="Session reminders" checked={prefs.notifications.sessions} onChange={notif('sessions')} />
          <Toggle icon={BookOpen} label="New learning content" checked={prefs.notifications.content} onChange={notif('content')} />
          <Toggle icon={Moon} label="Quiet hours (10 PM – 7 AM)" checked={prefs.notifications.quietHours} onChange={notif('quietHours')} />
          <div className="py-3">
            <Button size="sm" variant="secondary" icon={BellRing} onClick={requestPush}>
              Allow browser notifications
            </Button>
          </div>
        </Section>

        <Section id="privacy" icon={ShieldCheck} title="Privacy & security">
          <Toggle icon={Lock} label="App lock" description="Require device unlock to open AIDEN (coming with the native-ready release)" checked={prefs.privacy.appLock} onChange={priv('appLock')} />
          <Toggle icon={Eye} label="Hide notification previews" description="Don’t show sensitive text on the lock screen" checked={prefs.privacy.hidePreviews} onChange={priv('hidePreviews')} />
          <Toggle icon={BarChart3} label="Share anonymous usage analytics" description="Helps improve AIDEN. Never includes what you write." checked={prefs.privacy.analytics} onChange={priv('analytics')} />
          <div className="flex flex-wrap gap-2 py-3">
            <Button size="sm" variant="secondary" icon={Download} onClick={exportData}>
              Export my data
            </Button>
            <Button size="sm" variant="danger-soft" icon={Trash2} onClick={() => setConfirm('delete')}>
              Delete my data
            </Button>
          </div>
        </Section>

        <Section id="ai" icon={Brain} title="AI personalization" desc="You’re in control of what Aiden remembers.">
          <Toggle icon={Brain} label="Personal memory" description="Let Aiden use context you approve in Personal mode" checked={prefs.ai.personalMemory} onChange={ai('personalMemory')} />
          <Toggle icon={Sparkles} label="Smart suggestions" description="Suggest tools based on your check-ins" checked={prefs.ai.suggestions} onChange={ai('suggestions')} />
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Select label="Conversation tone" value={prefs.ai.tone} onChange={(e) => ai('tone')(e.target.value)} options={[{ value: 'warm', label: 'Warm & gentle' }, { value: 'direct', label: 'Direct & practical' }, { value: 'curious', label: 'Curious & reflective' }]} />
            <Select label="Reply length" value={prefs.ai.length} onChange={(e) => ai('length')(e.target.value)} options={[{ value: 'short', label: 'Short' }, { value: 'balanced', label: 'Balanced' }, { value: 'detailed', label: 'Detailed' }]} />
          </div>
          <div className="py-3">
            <Button size="sm" variant="danger-soft" icon={Trash2} onClick={() => setConfirm('memory')}>
              Clear Aiden’s memory
            </Button>
          </div>
        </Section>

        <Section id="help" icon={HelpCircle} title="Help & support">
          <HelpCenter />
        </Section>

        <Section id="about" icon={Info} title="About AIDEN">
          <div className="flex items-center gap-4 py-4">
            <LogoMark size={48} />
            <div>
              <div className="font-extrabold text-ink">AIDEN</div>
              <div className="text-sm text-muted">A better connection with yourself.</div>
              <div className="text-xs text-muted">Version 0.1.0 · Phase 1 frontend prototype</div>
            </div>
          </div>
          <p className="py-3 text-sm text-muted">AIDEN combines AI, psychology-based tools, professional counselling and habit building — Understand → Support → Act → Improve. AIDEN is not a medical device and doesn’t provide diagnosis or treatment.</p>
        </Section>

        <Section id="developer" icon={FlaskConical} title="Prototype tools" desc="For reviewing the demo.">
          <Toggle icon={FlaskConical} label="Simulate network errors" description="See error states on pages that load data" checked={prefs.simulateErrors} onChange={(v) => updatePrefs({ simulateErrors: v })} />
          <div className="py-3">
            <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => setConfirm('reset')}>
              Reset demo
            </Button>
          </div>
        </Section>

        <Button variant="danger-soft" size="lg" className="w-full" icon={LogOut} onClick={() => setConfirm('logout')}>
          Log out
        </Button>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        danger={confirm !== 'logout'}
        title={{ delete: 'Delete all your data?', memory: 'Clear Aiden’s memory?', reset: 'Reset the demo?', logout: 'Log out?' }[confirm]}
        message={{ delete: 'In this demo, this clears saved preferences and restarts the app.', memory: 'Aiden will forget personal context (demo).', reset: 'Restores all sample data and settings.', logout: 'You can sign back in with the demo account.' }[confirm]}
        confirmLabel={{ delete: 'Delete', memory: 'Clear', reset: 'Reset', logout: 'Log out' }[confirm]}
        onConfirm={() => {
          const c = confirm
          setConfirm(null)
          if (c === 'memory') toast('Aiden’s memory cleared (demo)')
          else if (c === 'logout') {
            signOut()
            nav('/welcome', { replace: true })
          } else resetDemo()
        }}
      />
    </Page>
  )
}
