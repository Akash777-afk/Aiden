import { delay } from './api'
import { demoReply } from '../mock/ai'
import { storage } from '../utils/storage'

// Phase 1: simulated replies only. Phase 5 swaps this for the configurable LLM provider.
export const aiService = {
  async reply(text, mode) {
    await delay(900 + Math.min(text.length * 8, 900))
    if (storage.get('prefs', {}).simulateErrors) throw new Error('Aiden could not respond (simulated network error).')
    return demoReply(text, mode)
  },
}
