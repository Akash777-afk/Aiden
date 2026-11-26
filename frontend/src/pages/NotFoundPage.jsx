import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '../components/common'
import { AidenBot } from '../components/illustrations/AidenBot'

export default function NotFoundPage() {
  const nav = useNavigate()
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
      <AidenBot size={140} thinking />
      <h1 className="mt-4 text-3xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">This path seems to have wandered off. Let’s get you back somewhere calm.</p>
      <Button className="mt-6" icon={Home} onClick={() => nav('/')}>
        Back to home
      </Button>
    </div>
  )
}
