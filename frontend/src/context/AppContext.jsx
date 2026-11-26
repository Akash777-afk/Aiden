import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { storage } from '../utils/storage'

const AppContext = createContext(null)

const DEFAULT_USER = {
  name: 'Akash',
  fullName: 'Akash Ganapathy',
  email: 'demo@aiden.app',
  phone: '',
  city: 'Bengaluru',
  dob: '',
  pronouns: '',
  avatar: { skin: '#B98261', hair: '#1D1412', style: 'short', shirt: '#8B72C7', bg: '#E9DFFB' },
  photo: null,
  joined: '2026-09-02',
}

const DEFAULT_PREFS = {
  theme: 'light', // light | dark | system
  language: 'English',
  reminderTime: '21:30',
  weekStart: 'Mon',
  notifications: { reminders: true, checkins: true, insights: true, sessions: true, content: false, quietHours: true },
  privacy: { appLock: false, hidePreviews: true, analytics: false },
  ai: { personalMemory: true, tone: 'warm', length: 'balanced', suggestions: true },
  reduceMotion: false,
  simulateErrors: false,
}

export function AppProvider({ children }) {
  const [authed, setAuthed] = useState(() => storage.get('authed', false))
  const [user, setUserState] = useState(() => ({ ...DEFAULT_USER, ...storage.get('user', {}) }))
  const [prefs, setPrefs] = useState(() => {
    const p = storage.get('prefs', {})
    return { ...DEFAULT_PREFS, ...p, notifications: { ...DEFAULT_PREFS.notifications, ...p.notifications }, privacy: { ...DEFAULT_PREFS.privacy, ...p.privacy }, ai: { ...DEFAULT_PREFS.ai, ...p.ai } }
  })
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => setSystemDark(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])

  const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#15121F' : '#2A1F4E')
  }, [isDark])

  useEffect(() => storage.set('prefs', prefs), [prefs])
  useEffect(() => storage.set('user', user), [user])
  useEffect(() => storage.set('authed', authed), [authed])

  const updatePrefs = useCallback((patch) => {
    setPrefs((p) => {
      const next = { ...p }
      for (const [k, v] of Object.entries(patch)) {
        next[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...p[k], ...v } : v
      }
      return next
    })
  }, [])
  const setUser = useCallback((patch) => setUserState((u) => ({ ...u, ...patch })), [])
  const signIn = useCallback((details = {}) => {
    if (details.name) setUserState((u) => ({ ...u, ...details }))
    setAuthed(true)
  }, [])
  const signOut = useCallback(() => setAuthed(false), [])
  const resetDemo = useCallback(() => {
    storage.clearAll()
    window.location.href = '/'
  }, [])

  const value = useMemo(
    () => ({ authed, user, setUser, prefs, updatePrefs, isDark, signIn, signOut, resetDemo }),
    [authed, user, setUser, prefs, updatePrefs, isDark, signIn, signOut, resetDemo],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
