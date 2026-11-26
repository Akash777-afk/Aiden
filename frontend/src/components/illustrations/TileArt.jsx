// Decorative art used on the wellness toolkit tiles (inspired by the reference: leaves, night clouds, lotus)
export function LeavesArt({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M60 100 C62 70 70 40 92 14" stroke="#3F9B6E" strokeWidth="3" fill="none" />
      {[
        [70, 70, -30],
        [78, 50, -20],
        [86, 30, -10],
        [62, 82, -45],
        [74, 58, 35],
        [84, 38, 40],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="14" ry="6.5" transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? '#5CC08A' : '#3FA872'} />
      ))}
    </svg>
  )
}

export function NightArt({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g fill="#fff" opacity=".8">
        <circle cx="70" cy="18" r="1.5" />
        <circle cx="88" cy="34" r="1" />
        <circle cx="52" cy="30" r="1" />
      </g>
      <g fill="#8C86E0" opacity=".9">
        <ellipse cx="72" cy="86" rx="32" ry="14" />
        <circle cx="62" cy="76" r="14" />
        <circle cx="80" cy="72" r="16" />
      </g>
      <g fill="#A8A2F0" opacity=".6">
        <circle cx="94" cy="84" r="12" />
      </g>
    </svg>
  )
}

export function LotusArt({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="62" cy="88" rx="36" ry="6" fill="#fff" opacity=".18" />
      <g transform="translate(62 70)">
        <path d="M0 0 C-6 -14 -6 -26 0 -36 C6 -26 6 -14 0 0Z" fill="#FFD6E8" />
        <path d="M0 0 C-12 -8 -20 -20 -20 -30 C-10 -26 -2 -14 0 0Z" fill="#F6B8DA" />
        <path d="M0 0 C12 -8 20 -20 20 -30 C10 -26 2 -14 0 0Z" fill="#F6B8DA" />
        <path d="M0 0 C-16 -2 -28 -10 -32 -18 C-20 -18 -8 -10 0 0Z" fill="#EFA2CC" />
        <path d="M0 0 C16 -2 28 -10 32 -18 C20 -18 8 -10 0 0Z" fill="#EFA2CC" />
      </g>
    </svg>
  )
}
