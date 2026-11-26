import { useId } from 'react'
import { motion } from 'framer-motion'

// AIDEN's friendly companion mascot
export function AidenBot({ size = 96, className, thinking }) {
  const id = useId().replace(/:/g, '')
  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E4DAF7" />
        </linearGradient>
        <linearGradient id={`v${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E2650" />
          <stop offset="1" stopColor="#15112A" />
        </linearGradient>
        <radialGradient id={`g${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#C9B5FF" stopOpacity=".7" />
          <stop offset="1" stopColor="#C9B5FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="62" r="56" fill={`url(#g${id})`} />
      {/* antenna */}
      <line x1="60" y1="14" x2="60" y2="24" stroke="#CDBDF2" strokeWidth="3" strokeLinecap="round" />
      <motion.circle cx="60" cy="12" r="4.5" fill="#F2A0C8" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
      {/* body */}
      <path d="M36 98c0-12 11-18 24-18s24 6 24 18v8H36z" fill={`url(#h${id})`} />
      <circle cx="60" cy="96" r="4" fill="#B49AF0" />
      {/* ears / headphones */}
      <rect x="14" y="46" width="14" height="26" rx="7" fill="#B49AF0" />
      <rect x="92" y="46" width="14" height="26" rx="7" fill="#B49AF0" />
      {/* head */}
      <rect x="22" y="24" width="76" height="60" rx="28" fill={`url(#h${id})`} />
      <rect x="30" y="34" width="60" height="40" rx="20" fill={`url(#v${id})`} />
      {/* face */}
      {thinking ? (
        <g fill="#8EE6F0">
          <motion.circle cx="48" cy="54" r="4" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
          <motion.circle cx="60" cy="54" r="4" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
          <motion.circle cx="72" cy="54" r="4" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
        </g>
      ) : (
        <g stroke="#8EE6F0" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M42 52c2.5-4 7.5-4 10 0" />
          <path d="M68 52c2.5-4 7.5-4 10 0" />
          <path d="M52 62c4 4 12 4 16 0" />
        </g>
      )}
      <ellipse cx="44" cy="40" rx="8" ry="3" fill="#fff" opacity=".18" />
    </motion.svg>
  )
}
