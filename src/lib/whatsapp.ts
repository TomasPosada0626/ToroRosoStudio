import { SERVICE_NAMES, describeServices, type ServiceId } from '../../shared/booking-rules'
import { capitalize, formatDateLong, formatTime } from '../../shared/time'
import type { PublicBooking } from '../../shared/types'
import { LOCATION_LABELS, type LocationType } from '../../shared/validation'
import { SITE, hasWhatsApp } from '../config/site'

/** Enlace a WhatsApp del estudio con mensaje prellenado, o null si no está configurado. */
export function waLink(text: string): string | null {
  return hasWhatsApp() ? `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(text)}` : null
}

/** Canal de contacto directo: WhatsApp si está configurado; si no, mensaje directo de Instagram. */
export function contactLink(text: string): { href: string; channel: 'whatsapp' | 'instagram'; label: string } {
  const wa = waLink(text)
  return wa
    ? { href: wa, channel: 'whatsapp', label: 'WhatsApp' }
    : { href: SITE.contact.instagramDm, channel: 'instagram', label: 'Instagram' }
}

/** Mensaje inicial según la página en la que esté la visitante. */
export function contextualGreeting(pathname: string): string {
  const base = 'Hola, Toro Roso Studio ✨'
  if (pathname.startsWith('/novias')) return `${base} Quiero información sobre maquillaje para novias.`
  const service = pathname.match(/^\/servicios\/([a-z]+)/)?.[1]
  if (service && service in SERVICE_NAMES) {
    return `${base} Quiero información sobre maquillaje ${SERVICE_NAMES[service as ServiceId].toLowerCase()}.`
  }
  if (pathname.startsWith('/portafolio')) return `${base} Vi su portafolio y quiero consultar disponibilidad.`
  return `${base} Quiero consultar disponibilidad para una cita.`
}

const peopleLines = (services: readonly ServiceId[]) =>
  services.map((s, i) => `   ${i + 1}. ${SERVICE_NAMES[s]}`).join('\n')

/** Resumen de una cita ya agendada en línea (para enviarlo al estudio). */
export function bookingSummaryMessage(b: PublicBooking): string {
  return [
    b.status === 'pending'
      ? 'Hola, Toro Roso Studio ✨ Acabo de solicitar mi cita en la web. ¿Me la confirmas, por favor?'
      : 'Hola, Toro Roso Studio ✨ Acabo de agendar mi cita en la web:',
    '',
    `*Código:* ${b.code}`,
    `*Servicio:* ${describeServices(b.services)}`,
    `*Personas:* ${b.services.length}`,
    peopleLines(b.services),
    `*Fecha:* ${capitalize(formatDateLong(b.date))}`,
    `*Hora:* ${formatTime(b.time)} – ${formatTime(b.endTime)}`,
    `*Lugar:* ${LOCATION_LABELS[b.locationType]} · ${b.locationArea}`,
    `*Evento:* ${b.eventType}`,
    `*Nombre:* ${b.name}`,
  ].join('\n')
}

/** Solicitud completa por WhatsApp (modo sin agenda en línea). */
export function bookingRequestMessage(d: {
  services: ServiceId[]
  date: string
  time: string
  eventType: string
  locationType: LocationType
  locationArea: string
  name: string
  whatsapp: string
  email: string
  notes: string
  guardianConsent?: boolean
}): string {
  return [
    'Hola, Toro Roso Studio ✨ Quiero solicitar una cita:',
    '',
    `*Servicio:* ${describeServices(d.services)}`,
    `*Personas:* ${d.services.length}`,
    peopleLines(d.services),
    `*Fecha deseada:* ${capitalize(formatDateLong(d.date))}`,
    `*Hora preferida:* ${formatTime(d.time)}`,
    `*Lugar:* ${LOCATION_LABELS[d.locationType]} · ${d.locationArea}`,
    `*Evento:* ${d.eventType}`,
    '',
    `*Nombre:* ${d.name}`,
    `*WhatsApp:* ${d.whatsapp}`,
    ...(d.email ? [`*Correo:* ${d.email}`] : []),
    ...(d.guardianConsent ? ['*Autorización:* Cuento con la autorización del acudiente o representante de la quinceañera.'] : []),
    ...(d.notes ? ['', `*Comentarios:* ${d.notes}`] : []),
    '',
    'Entiendo que la cita queda confirmada cuando el estudio verifique la disponibilidad.',
  ].join('\n')
}
