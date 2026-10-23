import { BOOKING_RULES } from './booking-rules.js'

/*
 * Fechas ("AAAA-MM-DD") y horas ("HH:mm") siempre se interpretan en hora de Colombia.
 * Los instantes se guardan en UTC (milisegundos o timestamptz en la base de datos).
 */

const MINUTE = 60_000
const pad = (n: number) => String(n).padStart(2, '0')

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function parts(date: string): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number)
  return [y, m, d]
}

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const [y, m, d] = parts(value)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

export const isValidTime = (value: string) => TIME_RE.test(value)

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function timeOf(minutes: number): string {
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
}

/** Fecha y hora de Colombia → instante UTC. */
export function localToUtc(date: string, time: string): Date {
  const [y, m, d] = parts(date)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - BOOKING_RULES.utcOffsetMinutes * MINUTE)
}

/** Instante UTC → fecha y hora de Colombia. */
export function utcToLocal(instant: Date | number): { date: string; time: string } {
  const ms = typeof instant === 'number' ? instant : instant.getTime()
  const shifted = new Date(ms + BOOKING_RULES.utcOffsetMinutes * MINUTE)
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  }
}

export const todayLocal = (now: Date = new Date()) => utcToLocal(now).date

export function addDays(date: string, days: number): string {
  const [y, m, d] = parts(date)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** 0 = domingo … 6 = sábado. */
export function weekdayOf(date: string): number {
  const [y, m, d] = parts(date)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** `month` va de 1 a 12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export const toDateKey = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`

/* ── Formato en español de Colombia ─────────────────────────────── */

const fmtDateLong = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const fmtDateMedium = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const fmtTime = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
})
const fmtMonth = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' })

const noon = (date: string) => {
  const [y, m, d] = parts(date)
  return new Date(Date.UTC(y, m - 1, d, 12))
}
/** Normaliza los espacios finos de Intl para que se vean igual en todas las fuentes. */
const tidy = (s: string) => s.replace(/[  ]/g, ' ')

/** "sábado, 14 de noviembre de 2026" */
export const formatDateLong = (date: string) => tidy(fmtDateLong.format(noon(date)))
/** "sáb, 14 nov" */
export const formatDateMedium = (date: string) => tidy(fmtDateMedium.format(noon(date)))
/** "7:00 a. m." */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return tidy(fmtTime.format(new Date(Date.UTC(2000, 0, 1, h, m))))
}
/** "noviembre" */
export const formatMonthName = (month: number) => fmtMonth.format(new Date(Date.UTC(2000, month - 1, 15)))

/** "2 h 30 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h} h ${m} min`
  return h ? `${h} h` : `${m} min`
}

export const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
