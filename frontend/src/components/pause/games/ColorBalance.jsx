import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '../../common'
import { soundEngine } from '../../../utils/soundEngine'
import { cn } from '../../../utils/cn'

const THEMES = [
  { name: 'Dusk', corners: ['#F6CF7E', '#F19BB8', '#8BCDB5', '#6F55B0'], cols: 4, rows: 5 },
  { name: 'Lagoon', corners: ['#FDE6E1', '#9CC3EE', '#F2A995', '#2E6B8F'], cols: 5, rows: 6 },
  { name: 'Lavender field', corners: ['#FFF2D6', '#C79AE6', '#8BCDB5', '#3B2E5A'], cols: 5, rows: 7 },
]

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

function build(theme) {
  const [tl, tr, bl, br] = theme.corners.map(hex)
  const tiles = []
  for (let r = 0; r < theme.rows; r++)
    for (let c = 0; c < theme.cols; c++) {
      const tx = c / (theme.cols - 1)
      const ty = r / (theme.rows - 1)
      const rgb = mix(mix(tl, tr, tx), mix(bl, br, tx), ty).map(Math.round)
      const corner = (r === 0 || r === theme.rows - 1) && (c === 0 || c === theme.cols - 1)
      tiles.push({ id: r * theme.cols + c, color: `rgb(${rgb.join(',')})`, fixed: corner })
    }
  return tiles
}

function shuffle(tiles) {
  const free = tiles.map((t, i) => (t.fixed ? null : i)).filter((i) => i != null)
  const out = [...tiles]
  do {
    for (let i = free.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[free[i]], out[free[j]]] = [out[free[j]], out[free[i]]]
    }
  } while (out.every((t, i) => t.id === i))
  return out
}

export function ColorBalance({ sound }) {
  const [themeIdx, setThemeIdx] = useState(0)
  const theme = THEMES[themeIdx]
  const [tiles, setTiles] = useState([])
  const [sel, setSel] = useState(null)
  const [moves, setMoves] = useState(0)
  const [preview, setPreview] = useState(true)

  const start = useCallback(() => {
    const solved = build(theme)
    setTiles(solved)
    setPreview(true)
    setMoves(0)
    setSel(null)
    const t = setTimeout(() => {
      setTiles(shuffle(solved))
      setPreview(false)
    }, 1600)
    return () => clearTimeout(t)
  }, [theme])

  useEffect(() => start(), [start])

  const solved = tiles.length > 0 && !preview && tiles.every((t, i) => t.id === i)

  const tap = (i) => {
    if (preview || solved || tiles[i].fixed) return
    if (sel == null) return setSel(i)
    if (sel === i) return setSel(null)
    const next = [...tiles]
    ;[next[sel], next[i]] = [next[i], next[sel]]
    setTiles(next)
    setSel(null)
    setMoves((m) => m + 1)
    if (sound) soundEngine.blip(next[i].id === i || next[sel].id === sel ? 660 : 330, 0.1, 'triangle', 0.08)
  }

  const correct = tiles.filter((t, i) => t.id === i).length

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <div className="flex w-full max-w-md items-center justify-between text-sm">
        <span className="font-bold text-ink">{theme.name}</span>
        <span className="text-muted">
          {preview ? 'Memorise the gradient…' : `${moves} moves · ${correct}/${tiles.length} in place`}
        </span>
      </div>
      <div className="grid w-full max-w-md gap-1.5 rounded-[24px] bg-surface p-2 shadow-lift" style={{ gridTemplateColumns: `repeat(${theme.cols}, 1fr)` }}>
        {tiles.map((t, i) => (
          <motion.button
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            key={t.id}
            onClick={() => tap(i)}
            aria-label={t.fixed ? 'Fixed tile' : `Tile ${i + 1}${sel === i ? ' (selected)' : ''}`}
            aria-pressed={sel === i}
            className={cn('relative aspect-square rounded-xl transition-shadow', sel === i && 'z-10 ring-4 ring-white shadow-xl', t.fixed ? 'cursor-default' : 'cursor-pointer')}
            style={{ background: t.color }}
            animate={{ scale: sel === i ? 0.88 : 1 }}
          >
            {t.fixed && <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />}
          </motion.button>
        ))}
      </div>
      {solved ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex w-full max-w-md flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 font-bold text-ink">
            <Sparkles className="size-5 text-primary" /> Balanced in {moves} moves
          </div>
          <div className="flex w-full gap-3">
            <Button variant="secondary" className="flex-1" icon={RotateCcw} onClick={start}>
              Replay
            </Button>
            <Button className="flex-1" iconRight={ChevronRight} onClick={() => setThemeIdx((x) => (x + 1) % THEMES.length)}>
              Next palette
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="flex w-full max-w-md gap-3">
          <Button variant="secondary" className="flex-1" icon={RotateCcw} onClick={start}>
            Reshuffle
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setThemeIdx((x) => (x + 1) % THEMES.length)}>
            Next palette
          </Button>
        </div>
      )}
    </div>
  )
}
