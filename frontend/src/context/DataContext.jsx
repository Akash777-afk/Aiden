import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { seedCheckins, seedDecisions, seedHabits, seedJournal, seedSleepLogs, SEED_NOTIFICATIONS } from '../mock/seed'
import { seedConversations } from '../mock/ai'
import { isoDay } from '../utils/date'
import { uid } from '../utils/id'
import { storage } from '../utils/storage'

// Demo data store. Sensitive wellbeing data lives IN MEMORY ONLY (resets on reload).
// Only sleep-sound favourites and completed lessons (non-sensitive) are persisted.
const DataContext = createContext(null)

const DEFAULT_ROUTINE = [
  { id: 'r1', time: '07:00', label: 'Wake up', icon: 'Sunrise' },
  { id: 'r2', time: '07:15', label: 'Hydration', icon: 'Droplets' },
  { id: 'r3', time: '07:30', label: 'Physical movement', icon: 'Footprints' },
  { id: 'r4', time: '21:30', label: 'Mind declutter', icon: 'NotebookPen' },
  { id: 'r5', time: '22:30', label: 'Wind down', icon: 'Moon' },
]

export function DataProvider({ children }) {
  const [habits, setHabits] = useState(seedHabits)
  const [checkins, setCheckins] = useState(seedCheckins)
  const [journal, setJournal] = useState(seedJournal)
  const [decisions, setDecisions] = useState(seedDecisions)
  const [sleepLogs, setSleepLogs] = useState(seedSleepLogs)
  const [conversations, setConversations] = useState(seedConversations)
  const [bookings, setBookings] = useState([])
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS)
  const [routine, setRoutine] = useState(DEFAULT_ROUTINE)
  const [favorites, setFavorites] = useState(() => storage.get('sleepFavs', ['t1']))
  const [learned, setLearned] = useState(() => storage.get('learned', []))
  const [growthSteps, setGrowthSteps] = useState({ chat: true, habit: true, sleep: true, reflect: false, grow: false })

  useEffect(() => storage.set('sleepFavs', favorites), [favorites])
  useEffect(() => storage.set('learned', learned), [learned])

  // ---- Habits
  const today = isoDay()
  const addHabit = useCallback((h) => setHabits((l) => [...l, { id: uid('h'), history: {}, createdAt: new Date().toISOString(), ...h }]), [])
  const updateHabit = useCallback((id, patch) => setHabits((l) => l.map((h) => (h.id === id ? { ...h, ...patch } : h))), [])
  const deleteHabit = useCallback((id) => setHabits((l) => l.filter((h) => h.id !== id)), [])
  const setHabitStatus = useCallback(
    (id, status, day = today) => {
      setHabits((l) => l.map((h) => (h.id === id ? { ...h, history: { ...h.history, [day]: status } } : h)))
      if (status === 'done') setGrowthSteps((g) => ({ ...g, habit: true }))
    },
    [today],
  )

  // ---- Check-ins
  const addCheckin = useCallback((c) => {
    const entry = { id: uid('c'), at: new Date().toISOString(), intensity: 3, note: '', triggers: [], ...c }
    setCheckins((l) => [entry, ...l])
    return entry
  }, [])
  const deleteCheckin = useCallback((id) => setCheckins((l) => l.filter((c) => c.id !== id)), [])
  const todayCheckin = useMemo(() => checkins.find((c) => isoDay(c.at) === today), [checkins, today])

  // ---- Journal
  const saveEntry = useCallback((e) => {
    setGrowthSteps((g) => ({ ...g, reflect: true }))
    if (e.id) {
      setJournal((l) => l.map((x) => (x.id === e.id ? { ...x, ...e, editedAt: new Date().toISOString() } : x)))
      return e.id
    }
    const id = uid('j')
    setJournal((l) => [{ ...e, id, at: new Date().toISOString() }, ...l])
    return id
  }, [])
  const deleteEntry = useCallback((id) => setJournal((l) => l.filter((x) => x.id !== id)), [])

  // ---- Decisions (TAC)
  const saveDecision = useCallback((d) => {
    setGrowthSteps((g) => ({ ...g, grow: true }))
    if (d.id && decisions.some((x) => x.id === d.id)) {
      setDecisions((l) => l.map((x) => (x.id === d.id ? { ...d, updatedAt: new Date().toISOString() } : x)))
      return d.id
    }
    const id = d.id || uid('d')
    setDecisions((l) => [{ ...d, id, createdAt: new Date().toISOString() }, ...l])
    return id
  }, [decisions])
  const deleteDecision = useCallback((id) => setDecisions((l) => l.filter((x) => x.id !== id)), [])

  // ---- Sleep
  const addSleepLog = useCallback((s) => {
    setSleepLogs((l) => [{ id: uid('s'), ...s }, ...l.filter((x) => x.date !== s.date)])
    setGrowthSteps((g) => ({ ...g, sleep: true }))
  }, [])
  const toggleFavorite = useCallback((id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), [])

  // ---- AI conversations
  const upsertConversation = useCallback((conv) => {
    setConversations((l) => {
      const exists = l.some((c) => c.id === conv.id)
      const next = exists ? l.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...l]
      return next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    })
    setGrowthSteps((g) => ({ ...g, chat: true }))
  }, [])
  const deleteConversation = useCallback((id) => setConversations((l) => l.filter((c) => c.id !== id)), [])

  // ---- Bookings
  const addBooking = useCallback((b) => setBookings((l) => [b, ...l]), [])
  const cancelBooking = useCallback((id) => setBookings((l) => l.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))), [])

  // ---- Notifications
  const markRead = useCallback((id) => setNotifications((l) => l.map((n) => (id == null || n.id === id ? { ...n, read: true } : n))), [])
  const clearNotifications = useCallback(() => setNotifications([]), [])
  const pushNotification = useCallback((n) => setNotifications((l) => [{ id: uid('n'), at: new Date().toISOString(), read: false, ...n }, ...l]), [])

  const toggleLearned = useCallback((id) => setLearned((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])), [])

  const value = {
    habits, addHabit, updateHabit, deleteHabit, setHabitStatus,
    checkins, addCheckin, deleteCheckin, todayCheckin,
    journal, saveEntry, deleteEntry,
    decisions, saveDecision, deleteDecision,
    sleepLogs, addSleepLog, favorites, toggleFavorite,
    conversations, upsertConversation, deleteConversation,
    bookings, addBooking, cancelBooking,
    notifications, markRead, clearNotifications, pushNotification,
    routine, setRoutine,
    learned, toggleLearned,
    growthSteps,
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
