import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { AppProvider, useApp } from './context/AppContext'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './context/ToastContext'
import { AppRoutes } from './routes/AppRoutes'
import { Splash } from './components/layout/Splash'

function Root() {
  const { prefs } = useApp()
  const [splash, setSplash] = useState(() => !sessionStorage.getItem('aiden.splashed'))
  useEffect(() => {
    if (!splash) return
    const t = setTimeout(() => {
      sessionStorage.setItem('aiden.splashed', '1')
      setSplash(false)
    }, 1400)
    return () => clearTimeout(t)
  }, [splash])

  return (
    <MotionConfig reducedMotion={prefs.reduceMotion ? 'always' : 'user'}>
      <AnimatePresence>{splash && <Splash key="splash" />}</AnimatePresence>
      <Suspense fallback={<Splash />}>
        <AppRoutes />
      </Suspense>
    </MotionConfig>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <DataProvider>
          <ToastProvider>
            <Root />
          </ToastProvider>
        </DataProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
