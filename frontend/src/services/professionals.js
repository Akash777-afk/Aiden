import { mockRequest } from './api'
import { PROFESSIONALS, SAMPLE_REVIEWS, SLOT_TIMES } from '../mock/professionals'
import { isoDay } from '../utils/date'

export const professionalsService = {
  list: () => mockRequest(() => PROFESSIONALS),
  get: (id) =>
    mockRequest(() => {
      const p = PROFESSIONALS.find((x) => x.id === id)
      if (!p) throw new Error('Professional not found')
      return { ...p, reviews: SAMPLE_REVIEWS }
    }, 400),
  // Deterministic demo availability per professional + date
  slots: (id, date) =>
    mockRequest(() => {
      const key = (id + isoDay(date)).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const now = new Date()
      return SLOT_TIMES.map((t, i) => {
        const [h, m] = t.split(':').map(Number)
        const slot = new Date(date)
        slot.setHours(h, m, 0, 0)
        const past = slot < now
        return { time: t, available: !past && (key + i * 7) % 3 !== 0 }
      })
    }, 350),
}

export const bookingService = {
  confirm: (booking) => mockRequest(() => ({ ...booking, ref: 'DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase(), status: 'confirmed' }), 900),
}
