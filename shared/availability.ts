import { BOOKING_RULES } from './booking-rules.js'
import { addDays, daysInMonth, localToUtc, minutesOf, timeOf, toDateKey, todayLocal, weekdayOf } from './time.js'

/** Intervalo ocupado en la agenda (UTC, ms). `end` ya incluye el tiempo de movilización. */
export interface BusyInterval {
  start: number
  end: number
}

export interface Slot {
  /** Hora de inicio en Colombia ("HH:mm"). */
  time: string
  /** Hora de fin del servicio en Colombia ("HH:mm"). */
  endTime: string
  startsAt: number
  endsAt: number
  /** Hasta cuándo queda bloqueada la agenda (fin + movilización). */
  blockedUntil: number
}

export function bookingWindow(now: Date) {
  return {
    earliest: now.getTime() + BOOKING_RULES.minNoticeHours * 3_600_000,
    lastDate: addDays(todayLocal(now), BOOKING_RULES.maxAdvanceDays),
  }
}

/**
 * Horarios disponibles de un día para una sesión de `durationMinutes`.
 * Una cita ocupa [inicio, fin + movilización) y no puede cruzarse con ningún intervalo
 * ocupado (otras citas, que ya incluyen su movilización, o bloqueos manuales).
 */
export function computeDaySlots(params: {
  date: string
  durationMinutes: number
  busy: BusyInterval[]
  now: Date
}): Slot[] {
  const { date, durationMinutes, busy, now } = params
  const hours = BOOKING_RULES.weeklyHours[weekdayOf(date)]
  if (!hours || durationMinutes <= 0) return []
  const { earliest, lastDate } = bookingWindow(now)
  if (date > lastDate) return []

  const first = minutesOf(hours.firstStart)
  const last = Math.min(minutesOf(hours.lastStart), minutesOf(hours.latestEnd) - durationMinutes)
  const slots: Slot[] = []

  for (let t = first; t <= last; t += BOOKING_RULES.slotStepMinutes) {
    const startsAt = localToUtc(date, timeOf(t)).getTime()
    if (startsAt < earliest) continue
    const endsAt = startsAt + durationMinutes * 60_000
    const blockedUntil = endsAt + BOOKING_RULES.bufferAfterMinutes * 60_000
    const clashes = busy.some((b) => startsAt < b.end && b.start < blockedUntil)
    if (!clashes) slots.push({ time: timeOf(t), endTime: timeOf(t + durationMinutes), startsAt, endsAt, blockedUntil })
  }
  return slots
}

/** Número de horarios libres por día de un mes (`month` de 1 a 12). */
export function computeMonthAvailability(params: {
  year: number
  month: number
  durationMinutes: number
  busy: BusyInterval[]
  now: Date
}): Record<string, number> {
  const { year, month, ...rest } = params
  const days: Record<string, number> = {}
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const date = toDateKey(year, month, d)
    days[date] = computeDaySlots({ date, ...rest }).length
  }
  return days
}

/** Rango UTC que conviene consultar para calcular la disponibilidad de un día. */
export function dayQueryRange(date: string): [number, number] {
  return [localToUtc(addDays(date, -1), '00:00').getTime(), localToUtc(addDays(date, 2), '00:00').getTime()]
}

/** Rango UTC que conviene consultar para calcular la disponibilidad de un mes. */
export function monthQueryRange(year: number, month: number): [number, number] {
  const first = toDateKey(year, month, 1)
  return [
    localToUtc(addDays(first, -1), '00:00').getTime(),
    localToUtc(addDays(first, daysInMonth(year, month) + 1), '00:00').getTime(),
  ]
}
