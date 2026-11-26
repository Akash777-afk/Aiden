import { motion } from 'framer-motion'

// Dusk landscape: layered hills, glowing sun, lake reflection and a person resting on a rock.
export function HeroScene({ className }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMaxYMax slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A1F4E" />
          <stop offset=".38" stopColor="#5B3F8C" />
          <stop offset=".62" stopColor="#B0679E" />
          <stop offset=".78" stopColor="#F2A08A" />
          <stop offset="1" stopColor="#F7C59A" />
        </linearGradient>
        <radialGradient id="hs-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset=".45" stopColor="#FFD9A0" stopOpacity=".9" />
          <stop offset="1" stopColor="#FFB38A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E59A9C" />
          <stop offset="1" stopColor="#4A3473" />
        </linearGradient>
        <linearGradient id="hs-rock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4A3A6E" />
          <stop offset="1" stopColor="#1E1836" />
        </linearGradient>
        <linearGradient id="hs-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F7B59A" />
          <stop offset=".25" stopColor="#3A2D5E" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#hs-sky)" />
      {/* stars */}
      <g fill="#fff">
        {[[40, 30], [120, 18], [210, 40], [330, 22], [370, 60], [80, 70], [260, 15]].map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r={i % 2 ? 0.9 : 1.3} animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 2.5 + i * 0.4, repeat: Infinity }} />
        ))}
      </g>
      {/* sun */}
      <motion.circle cx="250" cy="185" r="70" fill="url(#hs-sun)" animate={{ r: [66, 74, 66] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="250" cy="188" r="20" fill="#FFF1CF" />
      {/* clouds */}
      <motion.g animate={{ x: [0, 12, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} fill="#F6B3B8" opacity=".75">
        <ellipse cx="170" cy="118" rx="38" ry="7" />
        <ellipse cx="190" cy="112" rx="20" ry="8" />
        <ellipse cx="330" cy="105" rx="34" ry="6" />
        <ellipse cx="312" cy="100" rx="16" ry="7" />
      </motion.g>
      {/* far hills */}
      <path d="M0 200 L40 170 L80 186 L130 150 L180 182 L220 172 L260 190 L310 160 L360 180 L400 165 L400 215 L0 215Z" fill="#8E5D9F" opacity=".75" />
      <path d="M0 212 L50 188 L100 204 L150 182 L200 206 L250 198 L300 210 L350 192 L400 205 L400 222 L0 222Z" fill="#6A4688" />
      {/* lake */}
      <rect x="0" y="214" width="400" height="86" fill="url(#hs-lake)" />
      <g stroke="#FFE3C0" strokeLinecap="round" opacity=".7">
        <motion.line x1="232" x2="268" y1="226" y2="226" strokeWidth="2.5" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity }} />
        <line x1="238" x2="262" y1="236" y2="236" strokeWidth="2" />
        <line x1="244" x2="256" y1="246" y2="246" strokeWidth="1.5" />
      </g>
      {/* near shore */}
      <path d="M0 268 C60 255 120 262 180 272 L180 300 L0 300Z" fill="#2C2149" />
      {/* rock */}
      <path d="M268 300 C270 250 290 222 320 210 C350 200 380 206 400 214 L400 300Z" fill="url(#hs-rock)" />
      <path d="M292 232 C305 218 322 212 340 211" stroke="#F7B59A" strokeOpacity=".5" strokeWidth="2" fill="none" />
      {/* person (sitting, facing the sun) */}
      <g>
        <path d="M338 212 C336 198 330 190 322 188 L306 190 C300 192 298 198 300 204 L304 214 Z" fill="#251C40" />
        {/* legs: knees up */}
        <path d="M344 208 C336 200 322 190 312 190 C306 190 304 196 306 200 L312 214 L318 214 L314 202 C324 204 332 210 338 214Z" fill="#2E2450" />
        {/* torso (hoodie) */}
        <path d="M336 214 C330 196 332 176 342 166 C350 160 362 162 366 172 C370 186 366 204 360 214Z" fill="url(#hs-rim)" />
        {/* arm on knee */}
        <path d="M344 176 C336 184 326 190 318 192 C315 193 315 197 318 197 C330 196 340 190 348 184Z" fill="#3A2D5E" />
        {/* head */}
        <circle cx="351" cy="152" r="10.5" fill="#2A2046" />
        <path d="M341 150 C341 142 347 139 353 139 C360 139 362 145 361 150" fill="#1A1430" />
        {/* headphones */}
        <path d="M342 150 C342 138 360 138 360 150" stroke="#8B72C7" strokeWidth="2.5" fill="none" />
        <rect x="339" y="148" width="5" height="8" rx="2.5" fill="#B49AF0" />
        <path d="M341.5 150 a9 9 0 0 1 0 0" stroke="#F7B59A" />
        <path d="M340.5 147 C340 152 341 156 343 158" stroke="#F7B59A" strokeOpacity=".7" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  )
}
