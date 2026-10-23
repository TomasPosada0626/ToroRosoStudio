import { billingOf } from '../../../shared/billing'
import { formatDateLong, formatTime, todayLocal, utcToLocal } from '../../../shared/time'
import type { AgendaItem } from '../../../shared/types'

/** Estado tal como lo ve Manuela (incluye "realizada" y distingue rechazo de cancelación). */
export type ViewStatus = 'pending' | 'confirmed' | 'done' | 'rejected' | 'cancelled' | 'block'

export function viewStatus(item: AgendaItem, now = Date.now()): ViewStatus {
  if (item.kind === 'block') return 'block'
  if (item.status === 'pending') return 'pending'
  if (item.status === 'cancelled') return item.confirmedAt ? 'cancelled' : 'rejected'
  return item.endsAt < now ? 'done' : 'confirmed'
}

export const STATUS_LABEL: Record<ViewStatus, string> = {
  pending: 'Por confirmar',
  confirmed: 'Confirmada',
  done: 'Realizada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  block: 'Bloqueo',
}

/** Clases del indicador de estado (mismo lenguaje visual en todo el panel). */
export const STATUS_STYLE: Record<ViewStatus, string> = {
  pending: 'border border-rose text-rose-light bg-rose/10',
  confirmed: 'bg-metal text-noir',
  done: 'border border-rose/40 text-pearl/90',
  rejected: 'border border-line text-smoke',
  cancelled: 'border border-line text-smoke',
  block: 'border border-dashed border-rose/40 text-rose',
}

export const isBooking = (i: AgendaItem) => i.kind === 'booking'
export const isActive = (i: AgendaItem) => i.status === 'pending' || i.status === 'confirmed'
export const localDate = (i: AgendaItem) => utcToLocal(i.startsAt).date
export const firstName = (i: AgendaItem) => (i.clientName ?? '').trim().split(/\s+/)[0] || 'Clienta'
export const timeRange = (i: AgendaItem) =>
  `${formatTime(utcToLocal(i.startsAt).time)} – ${formatTime(utcToLocal(i.endsAt).time)}`
export const whenLong = (i: AgendaItem) => `${formatDateLong(localDate(i))}, ${formatTime(utcToLocal(i.startsAt).time)}`

/** Confirmada (futura o realizada) sin anticipo registrado. */
export const needsDeposit = (i: AgendaItem) => isBooking(i) && i.status === 'confirmed' && !billingOf(i).depositPaid

/** "hace 3 h" · "hace 2 días" */
export function ago(ms: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - ms) / 60_000))
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'ayer' : `hace ${days} días`
}

/** Agrupa las citas por clienta (número de WhatsApp). */
export interface ClientSummary {
  key: string
  name: string
  whatsapp: string | null
  email: string | null
  bookings: AgendaItem[]
  done: number
  upcoming: AgendaItem | null
  last: AgendaItem | null
  paid: number
  balance: number
}

export function groupClients(items: AgendaItem[], now = Date.now()): ClientSummary[] {
  const map = new Map<string, AgendaItem[]>()
  for (const item of items) {
    if (!isBooking(item)) continue
    const key = item.clientWhatsapp ?? `sin-numero:${item.clientName ?? item.id}`
    map.set(key, [...(map.get(key) ?? []), item])
  }
  return [...map.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => a.startsAt - b.startsAt)
      const latest = sorted[sorted.length - 1]
      const live = sorted.filter((i) => i.status === 'confirmed')
      return {
        key,
        name: latest.clientName ?? 'Sin nombre',
        whatsapp: latest.clientWhatsapp,
        email: [...sorted].reverse().find((i) => i.clientEmail)?.clientEmail ?? null,
        bookings: sorted,
        done: live.filter((i) => i.endsAt < now).length,
        upcoming: sorted.find((i) => isActive(i) && i.startsAt >= now) ?? null,
        last: [...live].reverse().find((i) => i.endsAt < now) ?? null,
        paid: sorted.reduce((sum, i) => sum + billingOf(i).paid, 0),
        balance: live.reduce((sum, i) => sum + (billingOf(i).balance ?? 0), 0),
      }
    })
    .sort((a, b) => (b.bookings.at(-1)?.startsAt ?? 0) - (a.bookings.at(-1)?.startsAt ?? 0))
}

/** "2026-10" del instante dado, en hora de Colombia. */
export const monthKey = (ms: number) => utcToLocal(ms).date.slice(0, 7)
export const currentMonthKey = () => todayLocal().slice(0, 7)

/** Descarga un CSV que Excel abre bien en español (separador ; y BOM UTF-8). */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value)
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const content = '﻿' + rows.map((row) => row.map(escape).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
}

export const waUrl = (digits: string, text: string) => `https://wa.me/${digits}?text=${encodeURIComponent(text)}`

/** Hora corta para el calendario: "14:30" → "2:30p", "08:00" → "8a". */
export function shortTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const hour = h % 12 || 12
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'a' : 'p'}`
}
