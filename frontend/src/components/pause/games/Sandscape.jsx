import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Eraser, Sparkles } from 'lucide-react'
import { cn } from '../../../utils/cn'

const PALETTE = ['#C2703D', '#E9A86B', '#8B72C7', '#5FA98D', '#4C8DBF', '#E98A8A', '#F6CF7E', '#3B2E5A']
const SYMMETRY = [1, 2, 4, 6, 8]

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function Sandscape() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const last = useRef(null)
  const [color, setColor] = useState(PALETTE[2])
  const [size, setSize] = useState(14)
  const [sym, setSym] = useState(6)

  const paintBg = useCallback(() => {
    const c = canvas.current
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#F3E3C3'
    ctx.fillRect(0, 0, c.width, c.height)
    const img = ctx.getImageData(0, 0, c.width, c.height)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 22
      img.data[i] += n
      img.data[i + 1] += n
      img.data[i + 2] += n
    }
    ctx.putImageData(img, 0, 0)
  }, [])

  useEffect(() => {
    const c = canvas.current
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { clientWidth: w, clientHeight: h } = wrap.current
      c.width = w * dpr
      c.height = h * dpr
      c.style.width = w + 'px'
      c.style.height = h + 'px'
      c.getContext('2d').setTransform(1, 0, 0, 1, 0, 0)
      paintBg()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap.current)
    return () => ro.disconnect()
  }, [paintBg])

  const grains = (ctx, x, y, r) => {
    const [cr, cg, cb] = hexToRgb(color)
    for (let i = 0; i < r * 2.2; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.sqrt(Math.random()) * r
      const v = (Math.random() - 0.5) * 50
      ctx.fillStyle = `rgba(${cr + v},${cg + v},${cb + v},${0.55 + Math.random() * 0.45})`
      const s = 0.8 + Math.random() * 1.8
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
    }
  }

  const draw = (x, y) => {
    const c = canvas.current
    const ctx = c.getContext('2d')
    const dpr = c.width / c.clientWidth
    const cx = c.width / 2
    const cy = c.height / 2
    const px = x * dpr
    const py = y * dpr
    const from = last.current || [px, py]
    const dist = Math.hypot(px - from[0], py - from[1])
    const steps = Math.max(1, Math.ceil(dist / 4))
    for (let s = 1; s <= steps; s++) {
      const ix = from[0] + ((px - from[0]) * s) / steps
      const iy = from[1] + ((py - from[1]) * s) / steps
      for (let k = 0; k < sym; k++) {
        const ang = (k / sym) * Math.PI * 2
        const dx = ix - cx
        const dy = iy - cy
        const rx = cx + dx * Math.cos(ang) - dy * Math.sin(ang)
        const ry = cy + dx * Math.sin(ang) + dy * Math.cos(ang)
        grains(ctx, rx, ry, size * dpr * 0.5)
      }
    }
    last.current = [px, py]
  }

  const pos = (e) => {
    const r = canvas.current.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const save = () => {
    const a = document.createElement('a')
    a.href = canvas.current.toDataURL('image/png')
    a.download = 'aiden-sandscape.png'
    a.click()
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div ref={wrap} className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] shadow-inner">
        <canvas
          ref={canvas}
          className="block touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            last.current = null
            draw(...pos(e))
          }}
          onPointerMove={(e) => e.buttons && draw(...pos(e))}
          onPointerUp={() => (last.current = null)}
          aria-label="Sand drawing canvas"
        />
      </div>
      <div className="space-y-3 rounded-3xl border border-line bg-surface p-3 shadow-soft">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {PALETTE.map((p) => (
            <button key={p} onClick={() => setColor(p)} aria-label={`Colour ${p}`} aria-pressed={color === p} className={cn('size-8 shrink-0 rounded-full transition', color === p && 'ring-2 ring-primary ring-offset-2 ring-offset-surface')} style={{ background: p }} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1" role="group" aria-label="Symmetry">
            <Sparkles className="mx-1 size-4 text-muted" />
            {SYMMETRY.map((s) => (
              <button key={s} onClick={() => setSym(s)} aria-pressed={sym === s} className={cn('h-7 min-w-7 rounded-lg px-1.5 text-xs font-bold', sym === s ? 'bg-primary text-white' : 'text-muted')}>
                {s === 1 ? 'Off' : `×${s}`}
              </button>
            ))}
          </div>
          <input type="range" min={6} max={40} value={size} onChange={(e) => setSize(+e.target.value)} className="aiden-range min-w-24 flex-1" style={{ '--fill': `${((size - 6) / 34) * 100}%` }} aria-label="Brush size" />
          <button onClick={paintBg} className="grid size-9 place-items-center rounded-xl bg-surface-2 text-ink" aria-label="Smooth the sand (clear)">
            <Eraser className="size-4" />
          </button>
          <button onClick={save} className="grid size-9 place-items-center rounded-xl bg-surface-2 text-ink" aria-label="Save image">
            <Download className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
