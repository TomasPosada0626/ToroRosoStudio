import { BOOKING_RULES, SERVICE_LONG_NAMES, SERVICE_NAMES, describeServices } from '../shared/booking-rules.js'
import type { CalendarEvent } from '../shared/ics.js'
import { capitalize, formatDateLong, formatDuration, formatTime, utcToLocal } from '../shared/time.js'
import type { AgendaItem } from '../shared/types.js'
import { LOCATION_LABELS, formatWhatsApp } from '../shared/validation.js'
import { env } from './env.js'

const STATUS_LABELS = { pending: 'Por confirmar', confirmed: 'Confirmada', cancelled: 'Cancelada' } as const

/** Textos listos para mostrar de una cita (correos, WhatsApp y calendario). */
export function present(item: AgendaItem) {
  const start = utcToLocal(item.startsAt)
  const end = utcToLocal(item.endsAt)
  const until = utcToLocal(item.blockedUntil)
  const people = item.services.length
  const single = people === 1 ? item.services[0] : null
  return {
    code: item.code,
    status: STATUS_LABELS[item.status],
    /** "Novias + Social ×2" */
    serviceName: people ? describeServices(item.services) : 'Bloqueo de agenda',
    /** "Maquillaje para novias" o "Maquillaje para 3 personas" */
    serviceLong: single ? SERVICE_LONG_NAMES[single] : people ? `Maquillaje para ${people} personas` : 'Bloqueo de agenda',
    /** "Persona 1: Novias (2 h 30 min)\nPersona 2: Social (1 h 30 min)" */
    breakdown: item.services
      .map((s, i) => `Persona ${i + 1}: ${SERVICE_NAMES[s]} (${formatDuration(BOOKING_RULES.serviceMinutes[s])})`)
      .join('\n'),
    durationText: formatDuration(Math.round((item.endsAt - item.startsAt) / 60_000)),
    dateLong: capitalize(formatDateLong(start.date)),
    timeStart: formatTime(start.time),
    timeRange: `${formatTime(start.time)} – ${formatTime(end.time)}`,
    blockedUntil: formatTime(until.time),
    location: item.locationType ? `${LOCATION_LABELS[item.locationType]} · ${item.locationArea ?? ''}` : '',
    people,
    eventType: item.eventType ?? '',
    clientName: item.clientName ?? '',
    firstName: (item.clientName ?? '').trim().split(/\s+/)[0] ?? '',
    whatsappPretty: item.clientWhatsapp ? formatWhatsApp(item.clientWhatsapp) : '',
    email: item.clientEmail ?? '',
    notes: item.notes ?? '',
    guardian: item.guardianConsent ? 'Confirmada al agendar (quinceañera)' : '',
  }
}

export type Presented = ReturnType<typeof present>

export function calendarEventFor(item: AgendaItem, audience: 'client' | 'studio'): CalendarEvent {
  const p = present(item)
  const lines =
    audience === 'client'
      ? [
          `Código de reserva: ${p.code}`,
          p.breakdown,
          `Duración estimada: ${p.durationText}`,
          '',
          'Si necesitas cambiar o cancelar tu cita, escríbenos por WhatsApp o Instagram (@tororosostudio).',
        ]
      : [
          `Clienta: ${p.clientName}`,
          `WhatsApp: ${p.whatsappPretty}`,
          ...(p.email ? [`Correo: ${p.email}`] : []),
          `Evento: ${p.eventType}`,
          p.breakdown,
          `Agenda bloqueada hasta: ${p.blockedUntil} (incluye movilización)`,
          ...(p.guardian ? [`Autorización de acudiente: ${p.guardian}`] : []),
          ...(p.notes ? ['', `Notas: ${p.notes}`] : []),
          '',
          `Código: ${p.code}`,
        ]
  return {
    uid: `${item.code}@tororosostudio`,
    title: audience === 'client' ? `${p.serviceLong} · Toro Roso Studio` : `${p.serviceName} · ${p.clientName}`,
    description: lines.join('\n'),
    location: p.location,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    url: audience === 'studio' ? `${env.siteUrl}/admin` : env.siteUrl,
  }
}

/** Enlace de WhatsApp con mensaje prellenado. */
export const waLink = (digits: string, text: string) => `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
