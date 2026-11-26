// Only NON-SENSITIVE demo preferences are persisted (theme, UI prefs, favourites).
// Mental-health content (moods, journal, chats, decisions) stays in memory only.
const PREFIX = 'aiden.'
export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw == null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      /* quota or private mode — ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      /* ignore */
    }
  },
  clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  },
}
