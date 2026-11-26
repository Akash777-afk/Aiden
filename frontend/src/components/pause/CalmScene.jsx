import { motion } from 'framer-motion'

// Animated CSS/SVG "visuals" used for Calm Moments (no external video files)
export function CalmScene({ scene, className = '' }) {
  if (scene === 'aurora')
    return (
      <div className={`relative overflow-hidden bg-[#0B1530] ${className}`}>
        {['#6EE7B7', '#8B72C7', '#60A5FA'].map((c, i) => (
          <motion.div
            key={c}
            className="absolute -inset-x-1/4 h-1/2 rounded-[50%] opacity-50 blur-3xl"
            style={{ background: c, top: `${10 + i * 12}%` }}
            animate={{ x: ['-10%', '10%', '-10%'], skewY: [-6, 6, -6] }}
            transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-[#050A18]" style={{ clipPath: 'polygon(0 60%, 15% 30%, 30% 55%, 45% 20%, 60% 50%, 75% 25%, 90% 45%, 100% 30%, 100% 100%, 0 100%)' }} />
      </div>
    )
  if (scene === 'fireflies')
    return (
      <div className={`relative overflow-hidden bg-[radial-gradient(ellipse_at_bottom,#23395B,#0D1321)] ${className}`}>
        {Array.from({ length: 22 }, (_, i) => (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full bg-[#F6E58D] shadow-[0_0_12px_4px_rgba(246,229,141,0.6)]"
            style={{ left: `${(i * 41) % 100}%`, top: `${30 + ((i * 23) % 60)}%` }}
            animate={{ x: [0, 20, -10, 0], y: [0, -25, 10, 0], opacity: [0, 1, 0.3, 0] }}
            transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-[#060B14]" style={{ clipPath: 'polygon(0 40%, 10% 10%, 14% 40%, 25% 0, 30% 40%, 45% 15%, 55% 45%, 70% 5%, 80% 40%, 92% 15%, 100% 35%, 100% 100%, 0 100%)' }} />
      </div>
    )
  if (scene === 'waves')
    return (
      <div className={`relative overflow-hidden bg-gradient-to-b from-[#BFE3F5] to-[#4C8DBF] ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.svg key={i} viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute bottom-0 h-1/2 w-[200%]" style={{ bottom: `${i * -8}%`, opacity: 0.35 + i * 0.2 }} animate={{ x: ['0%', '-50%'] }} transition={{ duration: 10 + i * 4, repeat: Infinity, ease: 'linear' }}>
            <path d="M0 30 Q50 10 100 30 T200 30 T300 30 T400 30 V60 H0Z" fill="#fff" />
          </motion.svg>
        ))}
      </div>
    )
  if (scene === 'lake')
    return (
      <div className={`relative overflow-hidden bg-gradient-to-b from-[#F7C8B6] via-[#D9A7D6] to-[#6E7FC6] ${className}`}>
        <motion.div className="absolute top-[28%] left-1/2 size-20 -translate-x-1/2 rounded-full bg-[#FFF1D0] blur-[1px]" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <div className="absolute inset-x-0 top-1/2 h-1/2 bg-gradient-to-b from-[#8C8FD0] to-[#3D3F87]" />
        {[0, 1, 2, 3].map((i) => (
          <motion.span key={i} className="absolute left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-white/60" style={{ top: `${56 + i * 7}%`, width: `${30 - i * 6}%` }} animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }} />
        ))}
      </div>
    )
  // dawn
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div className="absolute inset-0" animate={{ background: ['linear-gradient(#2A1F4E,#B0679E)', 'linear-gradient(#5B3F8C,#F2A08A)', 'linear-gradient(#9CC3EE,#F7C59A)', 'linear-gradient(#2A1F4E,#B0679E)'] }} transition={{ duration: 20, repeat: Infinity }} />
      <motion.div className="absolute left-1/2 size-16 -translate-x-1/2 rounded-full bg-[#FFE9B8] shadow-[0_0_60px_20px_rgba(255,220,160,0.5)]" animate={{ top: ['70%', '30%', '70%'] }} transition={{ duration: 20, repeat: Infinity }} />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[#2E5E4E]" style={{ clipPath: 'polygon(0 30%, 20% 0, 40% 35%, 60% 5%, 80% 30%, 100% 10%, 100% 100%, 0 100%)' }} />
    </div>
  )
}
