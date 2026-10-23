import { createSign } from 'node:crypto'
import type { BusyInterval } from '../shared/availability.js'
import type { AgendaItem } from '../shared/types.js'
import { env } from './env.js'
import { calendarEventFor } from './present.js'

/*
 * Sincronización OPCIONAL con el Google Calendar de Manuela, usando una cuenta de servicio
 * de Google Cloud con la que ella comparte su calendario ("Hacer cambios en los eventos").
 *  · Sus compromisos personales bloquean automáticamente esos horarios en la web.
 *  · Cada cita confirmada se crea como evento en su calendario (y se borra si se cancela).
 * Si algo falla, la agenda sigue funcionando con su propia base de datos.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API_URL = 'https://www.googleapis.com/calendar/v3'

export function googleCalendarConfigured(): boolean {
  const { calendarId, clientEmail, privateKey } = env.google
  return Boolean(calendarId && clientEmail && privateKey.includes('PRIVATE KEY'))
}

const base64url = (value: string) => Buffer.from(value).toString('base64url')
let cachedToken: { value: string; expires: number } | null = null

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value
  const { clientEmail, privateKey } = env.google
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey).toString('base64url')
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  })
  if (!response.ok) throw new Error(`Google respondió ${response.status} al pedir acceso: ${await response.text()}`)
  const data = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
  return cachedToken.value
}

async function calendarApi(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', ...init.headers },
  })
}

const busyCache = new Map<string, { at: number; busy: BusyInterval[] }>()

/** Horarios ocupados del calendario de Manuela entre `from` y `to` (UTC, ms). */
export async function googleBusy(from: number, to: number): Promise<BusyInterval[]> {
  if (!googleCalendarConfigured()) return []
  const key = `${from}-${to}`
  const cached = busyCache.get(key)
  if (cached && Date.now() - cached.at < 60_000) return cached.busy
  try {
    const { calendarId } = env.google
    const response = await calendarApi('/freeBusy', {
      method: 'POST',
      body: JSON.stringify({
        timeMin: new Date(from).toISOString(),
        timeMax: new Date(to).toISOString(),
        items: [{ id: calendarId }],
      }),
    })
    if (!response.ok) throw new Error(`freeBusy ${response.status}: ${await response.text()}`)
    const data = (await response.json()) as { calendars?: Record<string, { busy?: { start: string; end: string }[] }> }
    const busy = (data.calendars?.[calendarId]?.busy ?? []).map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }))
    if (busyCache.size > 200) busyCache.clear()
    busyCache.set(key, { at: Date.now(), busy })
    return busy
  } catch (error) {
    console.error('[google] No se pudo consultar el calendario:', error)
    return []
  }
}

/** Crea la cita como evento en el calendario de Manuela. Devuelve el id del evento. */
export async function createGoogleEvent(item: AgendaItem): Promise<string | null> {
  if (!googleCalendarConfigured()) return null
  try {
    const event = calendarEventFor(item, 'studio')
    const response = await calendarApi(`/calendars/${encodeURIComponent(env.google.calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        location: event.location,
        start: { dateTime: new Date(event.startsAt).toISOString() },
        end: { dateTime: new Date(event.endsAt).toISOString() },
        colorId: '3',
        reminders: { useDefault: true },
      }),
    })
    if (!response.ok) throw new Error(`events.insert ${response.status}: ${await response.text()}`)
    busyCache.clear()
    return ((await response.json()) as { id: string }).id
  } catch (error) {
    console.error('[google] No se pudo crear el evento:', error)
    return null
  }
}

/** Borra el evento de una cita cancelada. */
export async function deleteGoogleEvent(eventId: string): Promise<void> {
  if (!googleCalendarConfigured() || !eventId) return
  try {
    const response = await calendarApi(
      `/calendars/${encodeURIComponent(env.google.calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
    )
    // 404/410: el evento ya no existía.
    if (!response.ok && response.status !== 404 && response.status !== 410) {
      throw new Error(`events.delete ${response.status}: ${await response.text()}`)
    }
    busyCache.clear()
  } catch (error) {
    console.error('[google] No se pudo borrar el evento:', error)
  }
}
