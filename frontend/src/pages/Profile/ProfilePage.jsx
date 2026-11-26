import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Bell, Camera, ChevronRight, LifeBuoy, LogOut, Mail, MapPin, Pencil, Phone, Settings, ShieldCheck, Upload, User, Trash2 } from 'lucide-react'
import { Button, Card, ConfirmDialog, Input, Modal, Page, PageHeader, PersonAvatar, Select, UserAvatar } from '../../components/common'
import { openSupport } from '../../components/layout/SupportSheet'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fmtDate } from '../../utils/date'
import { cn } from '../../utils/cn'

const SKINS = ['#F1C9A5', '#D9A27E', '#C08562', '#A86F4C', '#7A4E32']
const HAIRS = ['#1D1412', '#3A2418', '#7A5230', '#5A5A5A', '#B5562F']
const STYLES = ['short', 'long', 'bun', 'curly', 'beard']
const SHIRTS = ['#8B72C7', '#5FA98D', '#F2A995', '#9CC3EE', '#F6CF7E']
const BGS = ['#E9DFFB', '#D7F1E6', '#FDE6E1', '#E2EFFC', '#FFF2D6']

function resizeImage(file, size = 192) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = size
      const s = Math.min(img.width, img.height)
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      resolve(c.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('Could not read that image'))
    img.src = URL.createObjectURL(file)
  })
}

function AvatarEditor({ open, onClose }) {
  const { user, setUser } = useApp()
  const toast = useToast()
  const [look, setLook] = useState(user.avatar)
  const fileRef = useRef(null)
  const Row = ({ label, items, k, render }) => (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((v) => (
          <button key={v} type="button" onClick={() => setLook((l) => ({ ...l, [k]: v }))} aria-pressed={look[k] === v} aria-label={`${label} ${v}`} className={cn('rounded-full transition', look[k] === v && 'ring-2 ring-primary ring-offset-2 ring-offset-surface')}>
            {render(v)}
          </button>
        ))}
      </div>
    </div>
  )
  const onFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return toast('Please choose an image file', { type: 'error' })
    if (f.size > 8 * 1024 * 1024) return toast('Image must be under 8 MB', { type: 'error' })
    try {
      const photo = await resizeImage(f)
      setUser({ photo })
      toast('Profile photo updated')
      onClose()
    } catch (err) {
      toast(err.message, { type: 'error' })
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profile picture"
      footer={
        <Button
          className="w-full"
          onClick={() => {
            setUser({ avatar: look, photo: null })
            toast('Avatar updated')
            onClose()
          }}
        >
          Use this avatar
        </Button>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-4">
          <PersonAvatar look={look} size={88} />
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
              Upload a photo
            </Button>
            {user.photo && (
              <Button
                size="sm"
                variant="danger-soft"
                icon={Trash2}
                onClick={() => {
                  setUser({ photo: null })
                  toast('Photo removed')
                }}
              >
                Remove photo
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
        </div>
        <Row label="Background" items={BGS} k="bg" render={(v) => <span className="block size-8 rounded-full border border-line" style={{ background: v }} />} />
        <Row label="Skin tone" items={SKINS} k="skin" render={(v) => <span className="block size-8 rounded-full" style={{ background: v }} />} />
        <Row label="Hair colour" items={HAIRS} k="hair" render={(v) => <span className="block size-8 rounded-full" style={{ background: v }} />} />
        <Row label="Style" items={STYLES} k="style" render={(v) => <PersonAvatar look={{ ...look, style: v }} size={40} />} />
        <Row label="Top" items={SHIRTS} k="shirt" render={(v) => <span className="block size-8 rounded-full" style={{ background: v }} />} />
      </div>
    </Modal>
  )
}

function DetailsForm({ onDone }) {
  const { user, setUser } = useApp()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ defaultValues: { fullName: user.fullName, name: user.name, email: user.email, phone: user.phone, city: user.city, dob: user.dob, pronouns: user.pronouns } })
  const submit = handleSubmit(async (v) => {
    await new Promise((r) => setTimeout(r, 500))
    setUser({ ...v, fullName: v.fullName.trim(), name: v.name.trim() })
    toast('Profile updated')
    onDone()
  })
  const maxDob = new Date()
  maxDob.setFullYear(maxDob.getFullYear() - 16)
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" required icon={User} error={errors.fullName?.message} {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' }, maxLength: { value: 60, message: 'Too long' } })} />
        <Input label="Preferred name" required hint="Used in greetings" error={errors.name?.message} {...register('name', { required: 'What should we call you?', maxLength: { value: 24, message: 'Max 24 characters' } })} />
        <Input label="Email" type="email" required icon={Mail} error={errors.email?.message} {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
        <Input label="Mobile" type="tel" icon={Phone} placeholder="10-digit number" error={errors.phone?.message} {...register('phone', { pattern: { value: /^(\+91[\s-]?)?[6-9]\d{9}$/, message: 'Enter a valid Indian mobile number' } })} />
        <Input label="City" icon={MapPin} error={errors.city?.message} {...register('city', { maxLength: { value: 40, message: 'Too long' } })} />
        <Input label="Date of birth" type="date" max={maxDob.toISOString().slice(0, 10)} error={errors.dob?.message} {...register('dob', { validate: (v) => !v || new Date(v) <= maxDob || 'You must be 16 or older' })} />
        <Select label="Pronouns" options={[{ value: '', label: 'Prefer not to say' }, 'she/her', 'he/him', 'they/them']} {...register('pronouns')} />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  const nav = useNavigate()
  const { user, signOut } = useApp()
  const { checkins, habits, journal, learned, notifications } = useData()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [logout, setLogout] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

  const links = [
    { label: 'Notifications', icon: Bell, to: '/notifications', badge: unread || null },
    { label: 'Settings & preferences', icon: Settings, to: '/settings' },
    { label: 'Privacy & data', icon: ShieldCheck, to: '/settings#privacy' },
    { label: 'Need urgent help?', icon: LifeBuoy, action: openSupport, danger: true },
  ]

  return (
    <Page className="max-w-4xl">
      <PageHeader title="You" subtitle="Your profile and preferences" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2A1F4E] via-[#5B3F8C] to-[#B0679E] p-6 text-white shadow-lift">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <button onClick={() => setAvatarOpen(true)} className="group relative" aria-label="Change profile picture">
            <UserAvatar user={user} size={96} className="ring-4 ring-white/30" />
            <span className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full bg-white text-primary-700 shadow">
              <Camera className="size-4" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-extrabold">{user.fullName}</h2>
            <p className="text-sm text-white/75">{user.email}</p>
            <p className="mt-1 text-xs text-white/60">
              Member since {fmtDate(user.joined, { month: 'long', year: 'numeric' })}
              {user.city && ` · ${user.city}`}
            </p>
          </div>
          <Button variant="light" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
            Edit profile
          </Button>
        </div>
        <div className="relative mt-6 grid grid-cols-4 gap-2">
          {[
            ['Check-ins', checkins.length],
            ['Habits', habits.length],
            ['Entries', journal.length],
            ['Lessons', learned.length],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/10 py-3 text-center backdrop-blur">
              <div className="text-xl font-extrabold">{v}</div>
              <div className="text-[11px] text-white/70">{k}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {editing ? (
        <Card className="mb-6 p-5">
          <h3 className="mb-4 font-bold text-ink">Personal details</h3>
          <DetailsForm onDone={() => setEditing(false)} />
        </Card>
      ) : (
        <Card className="mb-6 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-ink">Personal details</h3>
            <button onClick={() => setEditing(true)} className="text-sm font-semibold text-primary">
              Edit
            </button>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ['Preferred name', user.name],
              ['Mobile', user.phone],
              ['City', user.city],
              ['Date of birth', user.dob && fmtDate(user.dob, { day: 'numeric', month: 'long', year: 'numeric' })],
              ['Pronouns', user.pronouns],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="font-semibold text-ink">{v || <span className="font-normal text-muted">Not set</span>}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <Card className="mb-6 divide-y divide-line p-2">
        {links.map(({ label, icon: Icon, to, action, badge, danger }) => (
          <button key={label} onClick={() => (action ? action() : nav(to))} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left hover:bg-surface-2">
            <span className={cn('grid size-9 place-items-center rounded-xl', danger ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-surface-2 text-primary')}>
              <Icon className="size-[18px]" />
            </span>
            <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
            {badge && <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">{badge}</span>}
            <ChevronRight className="size-4 text-muted" />
          </button>
        ))}
      </Card>

      <Button variant="danger-soft" size="lg" className="w-full" icon={LogOut} onClick={() => setLogout(true)}>
        Log out
      </Button>
      <p className="mt-4 text-center text-xs text-muted">AIDEN · A better connection with yourself.</p>

      <AvatarEditor open={avatarOpen} onClose={() => setAvatarOpen(false)} />
      <ConfirmDialog
        open={logout}
        onClose={() => setLogout(false)}
        onConfirm={() => {
          signOut()
          nav('/welcome', { replace: true })
        }}
        title="Log out of AIDEN?"
        message="You can sign back in anytime with the demo account."
        confirmLabel="Log out"
        danger={false}
      />
    </Page>
  )
}
