import { cn } from '../../utils/cn'

// Illustrated avatar (no stock photos): head-and-shoulders portrait drawn in SVG.
export function PersonAvatar({ look = {}, size = 48, className, ring }) {
  const { skin = '#C98E6B', hair = '#2B1B17', style = 'short', shirt = '#8B72C7', bg = '#E9DFFB' } = look
  return (
    <span
      className={cn('inline-block shrink-0 overflow-hidden rounded-full', ring && 'ring-2 ring-white/80 ring-offset-0', className)}
      style={{ width: size, height: size, background: bg }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        {style === 'long' && <path d="M17 30c0-12 7-19 15-19s15 7 15 19v20H17z" fill={hair} />}
        {style === 'curly' && (
          <g fill={hair}>
            <circle cx="20" cy="26" r="7" />
            <circle cx="44" cy="26" r="7" />
            <circle cx="22" cy="38" r="6" />
            <circle cx="42" cy="38" r="6" />
          </g>
        )}
        <path d="M10 64c2-11 11-17 22-17s20 6 22 17z" fill={shirt} />
        <rect x="27" y="38" width="10" height="10" rx="4" fill={skin} />
        <ellipse cx="32" cy="29" rx="11" ry="12.5" fill={skin} />
        {style === 'short' && <path d="M20.5 27c-1-9 5-14 11.5-14 7 0 12.5 4.5 11.5 14-2-5-6-7.5-11.5-7.5S22.5 22 20.5 27z" fill={hair} />}
        {style === 'beard' && (
          <>
            <path d="M20.5 27c-1-9 5-14 11.5-14 7 0 12.5 4.5 11.5 14-2-5-6-7.5-11.5-7.5S22.5 22 20.5 27z" fill={hair} />
            <path d="M21.5 31c1 8 5 11 10.5 11s9.5-3 10.5-11c-2 3-5 4-10.5 4s-8.5-1-10.5-4z" fill={hair} />
          </>
        )}
        {style === 'long' && <path d="M20 28c0-8 5-13 12-13s12 5 12 13c-3-4-7-6.5-12-6.5S23 24 20 28z" fill={hair} />}
        {style === 'bun' && (
          <>
            <circle cx="32" cy="12" r="6" fill={hair} />
            <path d="M20.5 28c-1-9 5-14 11.5-14 7 0 12.5 4.5 11.5 14-2-5-6-7-11.5-7S22.5 23 20.5 28z" fill={hair} />
          </>
        )}
        {style === 'curly' && <path d="M20 27c-1-9 5-14 12-14s13 5 12 14c-3-5-7-7-12-7s-9 2-12 7z" fill={hair} />}
        <circle cx="27.5" cy="30" r="1.3" fill="#2a1d1a" />
        <circle cx="36.5" cy="30" r="1.3" fill="#2a1d1a" />
        <path d="M28.5 35.5c2 1.6 5 1.6 7 0" stroke="#2a1d1a" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".7" />
      </svg>
    </span>
  )
}

export function UserAvatar({ user, size = 44, className, ring }) {
  if (user?.photo) {
    return (
      <img
        src={user.photo}
        alt={user.name}
        width={size}
        height={size}
        className={cn('shrink-0 rounded-full object-cover', ring && 'ring-2 ring-white/80', className)}
        style={{ width: size, height: size }}
      />
    )
  }
  return <PersonAvatar look={user?.avatar} size={size} className={className} ring={ring} />
}
