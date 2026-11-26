import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Sparkles, HeartHandshake, Sprout } from 'lucide-react'
import { Button, Input, Segmented } from '../../components/common'
import { HeroScene } from '../../components/illustrations/HeroScene'
import { AidenBot } from '../../components/illustrations/AidenBot'
import { Logo, LogoMark } from '../../components/illustrations/Logo'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { delay } from '../../services/api'

const SLIDES = [
  { icon: Sparkles, title: 'Understand yourself', text: 'Check in with your emotions and notice the patterns behind them.' },
  { icon: HeartHandshake, title: 'Get support', text: 'Talk to Aiden anytime, or connect with a professional when you need more.' },
  { icon: Sprout, title: 'Act & improve', text: 'Build gentle habits, sleep better and make clearer decisions.' },
]

function AuthForm({ mode }) {
  const { signIn } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const [show, setShow] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' })

  const submit = handleSubmit(async (v) => {
    await delay(700)
    signIn(mode === 'signup' ? { name: v.name.trim().split(' ')[0], fullName: v.name.trim(), email: v.email } : {})
    toast(mode === 'signup' ? `Welcome to AIDEN, ${v.name.trim().split(' ')[0]}!` : 'Welcome back')
    nav(loc.state?.from || '/', { replace: true })
  })

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {mode === 'signup' && <Input label="Your name" icon={User} autoComplete="name" placeholder="e.g. Akash Ganapathy" error={errors.name?.message} {...register('name', { required: 'Please enter your name', minLength: { value: 2, message: 'Too short' } })} />}
      <Input label="Email" type="email" icon={Mail} autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
      <div className="relative">
        <Input
          label="Password"
          type={show ? 'text' : 'password'}
          icon={Lock}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder={mode === 'signup' ? 'At least 8 characters, incl. a number' : 'Your password'}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
            validate: mode === 'signup' ? (v) => /\d/.test(v) || 'Include at least one number' : undefined,
          })}
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-[34px] right-3 p-1.5 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {mode === 'signin' ? (
        <button type="button" onClick={() => toast('Password reset is available once accounts go live (demo)', { type: 'info' })} className="text-sm font-semibold text-primary">
          Forgot password?
        </button>
      ) : (
        <label className="flex items-start gap-3 text-sm text-ink">
          <input type="checkbox" className="mt-0.5 size-5 accent-[#8B72C7]" {...register('consent', { required: 'Please accept to continue' })} />
          <span>
            I’m 16 or older and agree to the Terms and Privacy Policy. I understand AIDEN is not a substitute for professional care.
            {errors.consent && <span className="mt-1 block text-xs font-medium text-rose-500">{errors.consent.message}</span>}
          </span>
        </label>
      )}
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting} iconRight={ArrowRight}>
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  )
}

export default function WelcomePage() {
  const { authed, signIn } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const [slide, setSlide] = useState(0)
  const [stage, setStage] = useState('intro')
  const [mode, setMode] = useState('signin')
  if (authed) return <Navigate to="/" replace />

  const demo = () => {
    signIn()
    nav(loc.state?.from || '/', { replace: true })
  }
  const S = SLIDES[slide]

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Visual side */}
      <div className={`relative overflow-hidden lg:flex lg:w-1/2 lg:flex-col ${stage === 'auth' ? 'hidden lg:flex' : 'flex flex-1 flex-col'}`}>
        <HeroScene className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A1F4E]/70 via-[#2A1F4E]/30 to-[#2A1F4E]/90" />
        <div className="relative flex flex-1 flex-col px-6 pt-[calc(1.5rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))] text-white lg:p-12">
          <Logo dark />
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center lg:items-start lg:text-left">
            <AidenBot size={140} />
            <AnimatePresence mode="wait">
              <motion.div key={slide} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6 max-w-sm">
                <S.icon className="mx-auto mb-2 size-6 text-lavender lg:mx-0" />
                <h1 className="text-3xl font-extrabold">{S.title}</h1>
                <p className="mt-2 text-white/80">{S.text}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
              ))}
            </div>
          </div>
          <div className="space-y-3 lg:hidden">
            {slide < SLIDES.length - 1 ? (
              <Button variant="light" size="lg" className="w-full" iconRight={ArrowRight} onClick={() => setSlide((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <Button variant="light" size="lg" className="w-full" iconRight={ArrowRight} onClick={() => setStage('auth')}>
                Get started
              </Button>
            )}
            <button onClick={() => setStage('auth')} className="w-full py-2 text-sm font-semibold text-white/80">
              I already have an account
            </button>
          </div>
        </div>
      </div>

      {/* Auth side */}
      <div className={`app-bg flex-1 flex-col justify-center px-5 pt-[calc(1.5rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))] lg:flex lg:px-16 ${stage === 'auth' ? 'flex' : 'hidden'}`}>
        <div className="mx-auto w-full max-w-md">
          <button onClick={() => setStage('intro')} className="mb-6 flex items-center gap-2 lg:hidden" aria-label="Back to intro">
            <LogoMark size={36} />
            <span className="text-xl font-extrabold tracking-wide text-ink">AIDEN</span>
          </button>
          <h2 className="text-2xl font-extrabold text-ink">{mode === 'signin' ? 'Welcome back' : 'Create your space'}</h2>
          <p className="mt-1 text-sm text-muted">A better connection with yourself starts here.</p>
          <Segmented
            className="mt-5 mb-5 w-full"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'signin', label: 'Sign in' },
              { value: 'signup', label: 'Create account' },
            ]}
          />
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <AuthForm mode={mode} />
            </motion.div>
          </AnimatePresence>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="outline" size="lg" className="w-full" onClick={demo}>
            Continue with demo account
          </Button>
          <p className="mt-5 rounded-2xl bg-surface-2 p-3 text-center text-xs text-muted">Prototype: no real account is created. Any valid email and password will sign you in to the demo.</p>
        </div>
      </div>
    </div>
  )
}
