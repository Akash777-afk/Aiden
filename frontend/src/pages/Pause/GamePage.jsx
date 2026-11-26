import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Volume2, VolumeX, HelpCircle } from 'lucide-react'
import { BubbleFlow } from '../../components/pause/games/BubbleFlow'
import { Sandscape } from '../../components/pause/games/Sandscape'
import { FlowLines } from '../../components/pause/games/FlowLines'
import { ColorBalance } from '../../components/pause/games/ColorBalance'
import { EmptyState, Modal } from '../../components/common'

const GAMES = {
  bubbles: { title: 'Bubble Flow', Comp: BubbleFlow, help: 'Tap the bubbles as they drift upward. There’s no score to beat and no timer — just pop at your own pace.' },
  sand: { title: 'Sandscape', Comp: Sandscape, help: 'Drag to pour coloured sand. Turn on symmetry for mandala-like patterns. Use the eraser to smooth the sand, or save your creation.' },
  lines: { title: 'Flow Lines', Comp: FlowLines, help: 'Drag from a dot to its matching colour to link them. Lines can’t cross — drawing over a line cuts it. Bonus: fill every cell.' },
  colors: { title: 'Color Balance', Comp: ColorBalance, help: 'Memorise the gradient, then restore it. Tap a tile, then tap another to swap them. Tiles with a dot are fixed anchors.' },
}

export default function GamePage() {
  const { game } = useParams()
  const nav = useNavigate()
  const [sound, setSound] = useState(true)
  const [help, setHelp] = useState(false)
  const g = GAMES[game]
  if (!g)
    return (
      <div className="mx-auto max-w-md p-6 pt-16">
        <EmptyState title="Game not found" action="Back to Calm Play" onAction={() => nav('/pause')} />
      </div>
    )
  const { Comp } = g
  return (
    <div className="flex h-dvh flex-col bg-bg px-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] lg:px-8 lg:pt-6">
      <div className="mx-auto mb-4 flex w-full max-w-3xl items-center gap-3">
        <button onClick={() => nav('/pause')} className="grid size-10 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-soft" aria-label="Back">
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="text-xs font-bold tracking-wider text-primary uppercase">Calm Play</div>
          <h1 className="text-lg font-extrabold text-ink">{g.title}</h1>
        </div>
        <button onClick={() => setHelp(true)} className="grid size-10 place-items-center rounded-2xl text-muted hover:bg-surface-2 hover:text-ink" aria-label="How to play">
          <HelpCircle className="size-5" />
        </button>
        {game !== 'sand' && (
          <button onClick={() => setSound((s) => !s)} className="grid size-10 place-items-center rounded-2xl text-muted hover:bg-surface-2 hover:text-ink" aria-label={sound ? 'Mute' : 'Unmute'} aria-pressed={!sound}>
            {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
        )}
      </div>
      <div className="mx-auto min-h-0 w-full max-w-3xl flex-1">
        <Comp sound={sound} />
      </div>
      <Modal open={help} onClose={() => setHelp(false)} title={`How to play ${g.title}`}>
        <p className="pt-2 leading-relaxed text-muted">{g.help}</p>
      </Modal>
    </div>
  )
}
