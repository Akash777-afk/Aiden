import { Suspense, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { SupportSheet } from './SupportSheet'
import { FULLSCREEN_PATTERNS } from '../../routes/nav'
import { SkeletonList } from '../common'
import { cn } from '../../utils/cn'

export function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const fullscreen = FULLSCREEN_PATTERNS.some((r) => r.test(location.pathname))

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="app-bg min-h-dvh">
      <Sidebar />
      <main className={cn('min-h-dvh lg:pl-[264px]', !fullscreen && 'pb-nav lg:pb-10')}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Suspense fallback={<div className="p-6"><SkeletonList count={4} /></div>}>{outlet}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      {!fullscreen && <BottomNav />}
      <SupportSheet />
    </div>
  )
}
