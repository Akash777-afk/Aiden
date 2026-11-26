import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { soundEngine } from '../../../utils/soundEngine'
import { uid } from '../../../utils/id'

const HUES = ['#9CC3EE', '#C79AE6', '#8BCDB5', '#F2A995', '#F6CF7E', '#D8C7F4']

export function BubbleFlow({ sound }) {
  const ref = useRef(null)
  const [h, setH] = useState(600)
  const [bubbles, setBubbles] = useState([])
  const [popped, setPopped] = useState(0)

  useEffect(() => {
    const el = ref.current
    const ro = new ResizeObserver(() => setH(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const spawn = () =>
      setBubbles((b) =>
        b.filter((x) => !x.gone).length > 16
          ? b
          : [...b, { id: uid('b'), x: 4 + Math.random() * 84, size: 44 + Math.random() * 56, dur: 9 + Math.random() * 7, hue: HUES[Math.floor(Math.random() * HUES.length)], sway: (Math.random() - 0.5) * 60 }],
      )
    for (let i = 0; i < 5; i++) setTimeout(spawn, i * 250)
    const t = setInterval(spawn, 750)
    return () => clearInterval(t)
  }, [])

  const pop = (b) => {
    if (b.popped) return
    setBubbles((l) => l.map((x) => (x.id === b.id ? { ...x, popped: true } : x)))
    setPopped((p) => p + 1)
    if (sound) soundEngine.blip(900 - b.size * 5, 0.12, 'sine', 0.12)
    if ('vibrate' in navigator) navigator.vibrate?.(8)
  }
  const remove = (id) => setBubbles((l) => l.filter((x) => x.id !== id))

  return (
    <div ref={ref} className="relative h-full w-full touch-none overflow-hidden rounded-[28px] bg-gradient-to-b from-[#DDEBFA] via-[#EDE4FB] to-[#FCE7EF] dark:from-[#1C2D49] dark:via-[#2D2550] dark:to-[#43252F]">
      <div className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/60 px-4 py-1.5 text-sm font-bold text-ink backdrop-blur dark:bg-black/30">
        {popped} popped
      </div>
      <AnimatePresence>
        {bubbles.map((b) => (
          <motion.button
            key={b.id}
            aria-label="Pop bubble"
            onPointerDown={() => pop(b)}
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              bottom: -b.size,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0 8%, ${b.hue}55 30%, ${b.hue}99 70%, ${b.hue}cc)`,
              boxShadow: `inset -4px -6px 14px ${b.hue}aa, 0 4px 18px ${b.hue}55`,
              border: '1px solid rgba(255,255,255,0.7)',
            }}
            initial={{ y: 0, x: 0, opacity: 0.95 }}
            animate={b.popped ? { scale: 1.7, opacity: 0 } : { y: -(h + b.size * 2), x: [0, b.sway, -b.sway / 2, 0] }}
            transition={b.popped ? { duration: 0.25 } : { y: { duration: b.dur, ease: 'linear' }, x: { duration: b.dur, ease: 'easeInOut' } }}
            onAnimationComplete={() => remove(b.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
