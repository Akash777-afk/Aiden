import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Heart, Pause, Play, Timer, Volume1, Volume2, X } from 'lucide-react'
import { soundEngine } from '../../utils/soundEngine'
import { useInterval } from '../../hooks/useInterval'
import { fmtDuration } from '../../utils/date'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../utils/cn'

const TIMERS = [0, 15, 30, 60]

function Waves({ playing, colors }) {
  return (
    <div className="flex h-10 items-end gap-1" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full"
          style={{ background: `linear-gradient(${colors[0]}, #D8C7F4)` }}
          animate={playing ? { height: [6, 12 + ((i * 7) % 26), 6] } : { height: 6 }}
          transition={{ duration: 1 + (i % 5) * 0.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// Player bar + expandable "now playing" sheet. Handles play/pause, volume, sleep timer, favourite.
export function AudioPlayer({ track, onClose, favorite, onFavorite }) {
  const toast = useToast()
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [timer, setTimer] = useState(0)
  const [remaining, setRemaining] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [expanded, setExpanded] = useState(!!track?.script)

  useEffect(() => {
    if (!track) return
    try {
      soundEngine.setVolume(volume)
      soundEngine.play(track.sound)
      setPlaying(true)
      setElapsed(0)
      setExpanded(!!track.script)
    } catch (e) {
      toast(e.message, { type: 'error' })
    }
    return () => soundEngine.stop(0.4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id])

  useInterval(
    () => {
      setElapsed((e) => e + 1)
      if (remaining != null) {
        if (remaining <= 1) {
          soundEngine.stop(3)
          setPlaying(false)
          setRemaining(null)
          setTimer(0)
          toast('Sleep timer ended — sweet dreams 🌙', { type: 'info' })
        } else setRemaining((r) => r - 1)
      }
    },
    playing ? 1000 : null,
  )

  if (!track) return null

  const toggle = () => {
    if (playing) {
      soundEngine.stop(0.5)
      setPlaying(false)
    } else {
      soundEngine.play(track.sound)
      setPlaying(true)
    }
  }
  const setVol = (v) => {
    setVolume(v)
    soundEngine.setVolume(v)
  }
  const cycleTimer = () => {
    const next = TIMERS[(TIMERS.indexOf(timer) + 1) % TIMERS.length]
    setTimer(next)
    setRemaining(next ? next * 60 : null)
    toast(next ? `Sleep timer: ${next} min` : 'Sleep timer off', { type: 'info' })
  }
  const line = track.script ? track.script[Math.min(track.script.length - 1, Math.floor(elapsed / 8))] : null

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed inset-x-3 z-30 mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#1C1834]/95 p-3 text-white shadow-2xl backdrop-blur-xl lg:right-6 lg:left-[288px] lg:bottom-6"
        style={{ bottom: 'calc(80px + var(--safe-bottom))' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => setExpanded(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Open player">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${track.colors[0]}, ${track.colors[1]})` }}>
              <Waves playing={playing} colors={track.colors} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{track.title}</span>
              <span className="block text-[11px] text-white/60">
                {remaining != null ? `Timer ${fmtDuration(remaining)}` : `${fmtDuration(elapsed)} · prototype audio`}
              </span>
            </span>
          </button>
          <button onClick={onFavorite} className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label={favorite ? 'Remove favourite' : 'Add favourite'} aria-pressed={favorite}>
            <Heart className={cn('size-5', favorite && 'fill-coral text-coral')} />
          </button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggle} className="grid size-12 place-items-center rounded-full bg-white text-[#2A1F4E]" aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
          </motion.button>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close player">
            <X className="size-4" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="fixed inset-0 z-[80] flex flex-col overflow-hidden text-white"
            style={{ background: `linear-gradient(180deg, ${track.colors[0]}, ${track.colors[1]} 60%, #0F0C1E)` }}
            role="dialog"
            aria-label="Now playing"
          >
            {/* stars */}
            {Array.from({ length: 24 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute size-0.5 rounded-full bg-white"
                style={{ top: `${(i * 37) % 60}%`, left: `${(i * 53) % 100}%` }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 2 + (i % 4), repeat: Infinity }}
              />
            ))}
            <div className="relative flex items-center justify-between px-4 pt-[calc(1rem+var(--safe-top))]">
              <button onClick={() => setExpanded(false)} className="grid size-11 place-items-center rounded-full bg-white/10" aria-label="Minimise player">
                <ChevronDown className="size-6" />
              </button>
              <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">Now playing · prototype</span>
              <button onClick={onFavorite} className="grid size-11 place-items-center rounded-full bg-white/10" aria-label="Favourite">
                <Heart className={cn('size-5', favorite && 'fill-coral text-coral')} />
              </button>
            </div>
            <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
              <motion.div
                className="grid size-56 place-items-center rounded-full bg-white/10 sm:size-64"
                animate={playing ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="grid size-40 place-items-center rounded-full bg-white/10 sm:size-48">
                  <Waves playing={playing} colors={track.colors} />
                </div>
              </motion.div>
              <h2 className="mt-8 text-2xl font-extrabold">{track.title}</h2>
              <AnimatePresence mode="wait">
                {line ? (
                  <motion.p key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="mt-4 max-w-md text-lg leading-relaxed text-white/85">
                    {line}
                  </motion.p>
                ) : (
                  <p className="mt-2 text-sm text-white/70">Generated live in your browser · {track.minutes} min</p>
                )}
              </AnimatePresence>
            </div>
            <div className="relative mx-auto w-full max-w-md px-6 pb-[calc(2rem+var(--safe-bottom))]">
              <div className="flex items-center gap-3">
                <Volume1 className="size-5 text-white/70" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVol(+e.target.value)}
                  className="aiden-range flex-1"
                  style={{ '--fill': `${volume * 100}%`, '--range-color': '#D8C7F4' }}
                  aria-label="Volume"
                />
                <Volume2 className="size-5 text-white/70" />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button onClick={cycleTimer} className="flex w-24 flex-col items-center gap-1 text-xs text-white/80" aria-label="Sleep timer">
                  <span className={cn('grid size-12 place-items-center rounded-full', timer ? 'bg-white text-[#2A1F4E]' : 'bg-white/10')}>
                    <Timer className="size-5" />
                  </span>
                  {timer ? `${fmtDuration(remaining ?? 0)}` : 'Timer off'}
                </button>
                <motion.button whileTap={{ scale: 0.92 }} onClick={toggle} className="grid size-20 place-items-center rounded-full bg-white text-[#2A1F4E] shadow-2xl" aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause className="size-8 fill-current" /> : <Play className="ml-1 size-8 fill-current" />}
                </motion.button>
                <div className="flex w-24 flex-col items-center gap-1 text-xs text-white/80">
                  <span className="grid size-12 place-items-center rounded-full bg-white/10 text-sm font-bold">{fmtDuration(elapsed)}</span>
                  elapsed
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
