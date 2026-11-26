// Mock transport layer. In Phase 4 this file is replaced by a real fetch client
// pointing at import.meta.env.VITE_API_BASE_URL — callers stay unchanged.
import { storage } from '../utils/storage'

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

export function delay(ms = 500) {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 250))
}

export async function mockRequest(fn, ms = 550) {
  await delay(ms)
  if (storage.get('prefs', {}).simulateErrors) {
    throw new Error('Simulated network error (enable/disable in Settings → Developer)')
  }
  return typeof fn === 'function' ? fn() : fn
}
