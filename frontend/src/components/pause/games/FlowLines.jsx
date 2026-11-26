import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '../../common'
import { soundEngine } from '../../../utils/soundEngine'

// Original hand-made puzzles. Each pair: [color, [r,c], [r,c]]. Every puzzle has a full-board solution.
const LEVELS = [
  {
    size: 5,
    pairs: [
      ['#2a78d6', [0, 0], [1, 2]],
      ['#1baf7a', [0, 3], [3, 4]],
      ['#6250d6', [1, 1], [4, 1]],
      ['#eda100', [1, 3], [2, 1]],
      ['#e87ba4', [3, 1], [3, 3]],
      ['#eb6834', [4, 2], [4, 4]],
    ],
  },
  {
    size: 5,
    pairs: [
      ['#6250d6', [0, 0], [3, 1]],
      ['#2a78d6', [1, 1], [0, 3]],
      ['#1baf7a', [0, 4], [2, 3]],
      ['#eda100', [1, 2], [2, 1]],
      ['#e87ba4', [2, 4], [3, 2]],
      ['#eb6834', [4, 0], [4, 2]],
      ['#008300', [4, 3], [4, 4]],
    ],
  },
  {
    size: 6,
    pairs: [
      ['#6250d6', [0, 0], [2, 3]],
      ['#1baf7a', [0, 4], [5, 5]],
      ['#2a78d6', [1, 2], [5, 1]],
      ['#e87ba4', [1, 4], [4, 3]],
      ['#eda100', [2, 2], [4, 1]],
      ['#eb6834', [3, 3], [5, 4]],
    ],
  },
]

const key = (r, c) => `${r},${c}`
const GLYPHS = ['▲', '■', '◆', '●', '★', '✚', '♥']

export function FlowLines({ sound }) {
  const [level, setLevel] = useState(0)
  const L = LEVELS[level]
  const [paths, setPaths] = useState({}) // color -> [[r,c],...]
  const drawing = useRef(null)
  const gridRef = useRef(null)

  const endpoints = useMemo(() => {
    const m = {}
    L.pairs.forEach(([color, a, b]) => {
      m[key(...a)] = color
      m[key(...b)] = color
    })
    return m
  }, [L])

  const owner = useMemo(() => {
    const m = {}
    Object.entries(paths).forEach(([color, p]) => p.forEach(([r, c]) => (m[key(r, c)] = color)))
    return m
  }, [paths])

  const connected = (color, p = paths[color]) => {
    if (!p || p.length < 2) return false
    const pair = L.pairs.find((x) => x[0] === color)
    const a = key(...pair[1])
    const b = key(...pair[2])
    const s = key(...p[0])
    const e = key(...p[p.length - 1])
    return (s === a && e === b) || (s === b && e === a)
  }
  const allConnected = L.pairs.every(([color]) => connected(color))
  const filled = Object.keys(owner).length
  const total = L.size * L.size

  const cellAt = (e) => {
    const r = gridRef.current.getBoundingClientRect()
    const col = Math.floor(((e.clientX - r.left) / r.width) * L.size)
    const row = Math.floor(((e.clientY - r.top) / r.height) * L.size)
    if (row < 0 || col < 0 || row >= L.size || col >= L.size) return null
    return [row, col]
  }

  const start = (e) => {
    const cell = cellAt(e)
    if (!cell || allConnected) return
    const k = key(...cell)
    const ep = endpoints[k]
    if (ep) {
      drawing.current = ep
      setPaths((p) => ({ ...p, [ep]: [cell] }))
    } else if (owner[k]) {
      const color = owner[k]
      drawing.current = color
      setPaths((p) => {
        const idx = p[color].findIndex(([r, c]) => key(r, c) === k)
        return { ...p, [color]: p[color].slice(0, idx + 1) }
      })
    }
    gridRef.current.setPointerCapture?.(e.pointerId)
  }

  const move = (e) => {
    const color = drawing.current
    if (!color) return
    const cell = cellAt(e)
    if (!cell) return
    setPaths((p) => {
      const path = p[color] || []
      const lastCell = path[path.length - 1]
      if (!lastCell) return p
      const k = key(...cell)
      if (key(...lastCell) === k) return p
      if (Math.abs(lastCell[0] - cell[0]) + Math.abs(lastCell[1] - cell[1]) !== 1) return p
      // backtrack
      const idx = path.findIndex(([r, c]) => key(r, c) === k)
      if (idx >= 0) return { ...p, [color]: path.slice(0, idx + 1) }
      // already complete — stop extending
      if (connected(color, path)) return p
      const ep = endpoints[k]
      if (ep && ep !== color) return p
      const next = { ...p }
      // cut through another color's path
      Object.entries(next).forEach(([oc, op]) => {
        if (oc === color) return
        const j = op.findIndex(([r, c]) => key(r, c) === k)
        if (j >= 0) next[oc] = op.slice(0, j)
      })
      const np = [...path, cell]
      next[color] = np
      if (sound) soundEngine.blip(ep ? 880 : 420 + np.length * 30, ep ? 0.25 : 0.05, 'sine', ep ? 0.15 : 0.04)
      return next
    })
  }

  const end = () => (drawing.current = null)
  const reset = () => setPaths({})
  const nextLevel = () => {
    setLevel((l) => (l + 1) % LEVELS.length)
    setPaths({})
  }

  const cellPx = 100 / L.size
  return (
    <div className="flex h-full flex-col items-center gap-4">
      <div className="flex w-full max-w-md items-center justify-between text-sm">
        <span className="font-bold text-ink">
          Level {level + 1} / {LEVELS.length}
        </span>
        <span className="text-muted">
          {L.pairs.filter(([c]) => connected(c)).length}/{L.pairs.length} linked · {Math.round((filled / total) * 100)}% filled
        </span>
      </div>
      <div
        ref={gridRef}
        className="relative aspect-square w-full max-w-md touch-none overflow-hidden rounded-[24px] bg-surface p-0 shadow-lift select-none"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        role="application"
        aria-label="Flow lines puzzle: drag from a dot to its matching colour"
      >
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${L.size}, 1fr)` }}>
          {Array.from({ length: total }, (_, i) => {
            const r = Math.floor(i / L.size)
            const c = i % L.size
            const o = owner[key(r, c)]
            return <div key={i} className="border border-line/60 transition-colors" style={{ background: o ? o + '26' : undefined }} />
          })}
        </div>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          {Object.entries(paths).map(([color, p]) =>
            p.length > 1 ? (
              <polyline
                key={color}
                points={p.map(([r, c]) => `${c * cellPx + cellPx / 2},${r * cellPx + cellPx / 2}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={cellPx * 0.32}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null,
          )}
          {L.pairs.map(([color, a, b], pi) =>
            [a, b].map(([r, c]) => (
              <g key={key(r, c)}>
                <circle cx={c * cellPx + cellPx / 2} cy={r * cellPx + cellPx / 2} r={cellPx * 0.3} fill={color} stroke="#fff" strokeWidth={0.8}>
                  {connected(color) && <animate attributeName="r" values={`${cellPx * 0.3};${cellPx * 0.36};${cellPx * 0.3}`} dur="0.6s" repeatCount="1" />}
                </circle>
                {/* shape glyph = secondary cue so pairs never rely on colour alone */}
                <text x={c * cellPx + cellPx / 2} y={r * cellPx + cellPx / 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={cellPx * 0.26} fontWeight="700">
                  {GLYPHS[pi % GLYPHS.length]}
                </text>
              </g>
            )),
          )}
        </svg>
      </div>
      {allConnected ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex w-full max-w-md flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 font-bold text-ink">
            <Sparkles className="size-5 text-primary" /> {filled === total ? 'Perfect flow — every cell filled!' : 'All linked! Try filling every cell too.'}
          </div>
          <div className="flex w-full gap-3">
            <Button variant="secondary" className="flex-1" icon={RotateCcw} onClick={reset}>
              Replay
            </Button>
            <Button className="flex-1" iconRight={ChevronRight} onClick={nextLevel}>
              Next level
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="flex w-full max-w-md gap-3">
          <Button variant="secondary" className="flex-1" icon={RotateCcw} onClick={reset}>
            Clear
          </Button>
          <Button variant="outline" className="flex-1" onClick={nextLevel}>
            Skip level
          </Button>
        </div>
      )}
    </div>
  )
}
