import { useId } from 'react'
import { cn } from '../../utils/cn'

export function LogoMark({ size = 40, className }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 64 56" width={size} height={(size * 56) / 64} className={className} aria-hidden>
      <defs>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D7B8FF" />
          <stop offset=".55" stopColor="#A47BE0" />
          <stop offset="1" stopColor="#F2A0C8" />
        </linearGradient>
      </defs>
      <path
        d="M32 2c-3.4 0-6.4 2-7.8 5L3 46.5C.8 51 4 56 9 56c2.6 0 5-1.5 6.1-3.9L32 18l16.9 34.1C50 54.5 52.4 56 55 56c5 0 8.2-5 6-9.5L39.8 7C38.4 4 35.4 2 32 2z"
        fill={`url(#lg${id})`}
      />
      <path d="M20 39c7 5 17 5 24 0" stroke="#fff" strokeOpacity=".9" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Logo({ dark, tagline = true, className, size = 36 }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <div className="leading-none">
        <div className={cn('text-[22px] font-extrabold tracking-[0.04em]', dark ? 'text-white' : 'text-ink')}>AIDEN</div>
        {tagline && <div className={cn('mt-1 text-[11px] font-medium', dark ? 'text-white/80' : 'text-muted')}>A better connection with yourself.</div>}
      </div>
    </div>
  )
}
