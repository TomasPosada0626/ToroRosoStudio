import { computeDaySlots, computeMonthAvailability, dayQueryRange, monthQueryRange } from '../shared/availability.js'
import { totalDurationMinutes } from '../shared/booking-rules.js'
import { isValidDate } from '../shared/time.js'
import type { DayAvailabilityResponse, MonthAvailabilityResponse } from '../shared/types.js'
import { parseServices } from '../shared/validation.js'
import { busyBetween } from '../server/busy.js'
import { fail, json } from '../server/http.js'
import { getStore } from '../server/store.js'

/**
 * `services` = procedimiento de cada persona, separado por comas (define la duración total).
 * GET /api/availability?services=novias,social&month=2026-11 → horarios libres por día del mes
 * GET /api/availability?services=novias,social&date=2026-11-14 → horarios libres de ese día
 */
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const services = parseServices(params.get('services') ?? '')
  const month = params.get('month')
  const date = params.get('date')

  if (!services) return fail('VALIDATION', 'Indica el procedimiento de cada persona.', 400)

  const store = getStore()
  if (!store) return fail('NOT_CONFIGURED', 'La agenda en línea aún no está activa.', 503)

  const durationMinutes = totalDurationMinutes(services)
  const now = new Date()
  try {
    if (date) {
      if (!isValidDate(date)) return fail('VALIDATION', 'Fecha no válida.', 400)
      const busy = await busyBetween(store, ...dayQueryRange(date))
      const slots = computeDaySlots({ date, durationMinutes, busy, now }).map(({ time, endTime }) => ({ time, endTime }))
      return json({ ok: true, date, slots } satisfies DayAvailabilityResponse)
    }
    if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      const [year, monthNumber] = month.split('-').map(Number)
      const busy = await busyBetween(store, ...monthQueryRange(year, monthNumber))
      const days = computeMonthAvailability({ year, month: monthNumber, durationMinutes, busy, now })
      return json({ ok: true, month, days } satisfies MonthAvailabilityResponse)
    }
    return fail('VALIDATION', 'Indica un mes (AAAA-MM) o una fecha (AAAA-MM-DD).', 400)
  } catch (error) {
    console.error('[availability]', error)
    return fail('SERVER', 'No pudimos consultar la agenda. Intenta de nuevo en un momento.', 500)
  }
}
