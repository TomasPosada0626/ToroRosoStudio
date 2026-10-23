import {
  BOOKING_RULES,
  isServiceId,
  longestSessionMinutes,
  requiresGuardianConsent,
  totalDurationMinutes,
  type ServiceId,
} from './booking-rules.js'
import { formatDuration, isValidDate, isValidTime } from './time.js'

export const LOCATION_TYPES = ['domicilio', 'acordada'] as const
export type LocationType = (typeof LOCATION_TYPES)[number]
export const LOCATION_LABELS: Record<LocationType, string> = {
  domicilio: 'A domicilio',
  acordada: 'Otra ubicación acordada',
}

export const LIMITS = { name: 80, eventType: 60, locationArea: 80, email: 120, notes: 600 } as const

/** Solicitud de cita ya validada y normalizada. */
export interface BookingRequest {
  /** Procedimiento de cada persona, en orden (la persona 1 es la principal). */
  services: ServiceId[]
  date: string
  time: string
  eventType: string
  locationType: LocationType
  locationArea: string
  name: string
  /** Solo dígitos, formato internacional (ej.: 573001234567). */
  whatsapp: string
  /** Cadena vacía si no se indicó. */
  email: string
  notes: string
  consent: true
  /** Autorización del acudiente o representante (solo aplica a quinceañeras). */
  guardianConsent: boolean
}

export type BookingField = keyof BookingRequest
export type FieldErrors = Partial<Record<BookingField, string>>

const singleLine = (value: unknown, max: number) =>
  typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : ''

const multiLine = (value: unknown, max: number) =>
  typeof value === 'string'
    ? value
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, max)
    : ''

/**
 * Normaliza un número de WhatsApp a dígitos en formato internacional.
 * Acepta celulares colombianos de 10 dígitos (3xx…) o números con prefijo +.
 */
export function normalizeWhatsApp(raw: string): string | null {
  const trimmed = raw.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    const intl = trimmed.startsWith('00') ? digits.slice(2) : digits
    if (intl.startsWith('57')) return /^573\d{9}$/.test(intl) ? intl : null
    return intl.length >= 8 && intl.length <= 15 ? intl : null
  }
  if (/^3\d{9}$/.test(digits)) return `57${digits}`
  if (/^573\d{9}$/.test(digits)) return digits
  return null
}

/** "+57 300 123 4567" */
export function formatWhatsApp(digits: string): string {
  if (/^573\d{9}$/.test(digits)) return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  return `+${digits}`
}

export const isValidEmail = (value: string) =>
  value.length <= LIMITS.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)

/** Lista de procedimientos (uno por persona) válida, o `null`. */
export function parseServices(value: unknown): ServiceId[] | null {
  const list = typeof value === 'string' ? value.split(',') : value
  if (!Array.isArray(list) || list.length < 1 || list.length > BOOKING_RULES.maxPeople) return null
  return list.every(isServiceId) ? (list as ServiceId[]) : null
}

export const MESSAGES: Record<BookingField, string> = {
  services: `Elige el procedimiento de cada persona (de 1 a ${BOOKING_RULES.maxPeople} personas).`,
  date: 'Elige la fecha de tu cita.',
  time: 'Elige un horario disponible.',
  eventType: 'Cuéntanos qué tipo de evento es.',
  locationType: 'Elige dónde será el servicio.',
  locationArea: 'Indica el municipio y el barrio (sin dirección exacta).',
  name: 'Escribe tu nombre completo.',
  whatsapp: 'Escribe un número de WhatsApp válido. Ej.: 300 123 4567.',
  email: 'Revisa el correo: parece incompleto.',
  notes: `Los comentarios admiten hasta ${LIMITS.notes} caracteres.`,
  consent: 'Para continuar, acepta la política de tratamiento de datos.',
  guardianConsent: 'Para agendar a una quinceañera, confirma que cuentas con la autorización de su acudiente o representante.',
}

/** La suma de procedimientos no cabe en un día de atención (ej.: un grupo muy grande). */
export const sessionTooLong = (services: readonly ServiceId[]) =>
  totalDurationMinutes(services) > longestSessionMinutes
    ? `La sesión completa (${formatDuration(totalDurationMinutes(services))}) no alcanza a terminar en un mismo día. Escríbenos por WhatsApp y organizamos tu grupo.`
    : null

/**
 * Valida una solicitud de cita. La usan el formulario (para mostrar errores al momento)
 * y el servidor (que nunca confía en lo que llega del navegador).
 */
export function validateBookingRequest(
  input: unknown,
): { ok: true; value: BookingRequest } | { ok: false; errors: FieldErrors } {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const errors: FieldErrors = {}

  const services = parseServices(raw.services)
  if (!services) errors.services = MESSAGES.services
  else {
    const tooLong = sessionTooLong(services)
    if (tooLong) errors.services = tooLong
  }

  const date = typeof raw.date === 'string' ? raw.date : ''
  if (!isValidDate(date)) errors.date = MESSAGES.date

  const time = typeof raw.time === 'string' ? raw.time : ''
  if (!isValidTime(time)) errors.time = MESSAGES.time

  const eventType = singleLine(raw.eventType, LIMITS.eventType)
  if (eventType.length < 2) errors.eventType = MESSAGES.eventType

  const locationType = raw.locationType
  if (!(LOCATION_TYPES as readonly unknown[]).includes(locationType)) errors.locationType = MESSAGES.locationType

  const locationArea = singleLine(raw.locationArea, LIMITS.locationArea)
  if (locationArea.length < 3) errors.locationArea = MESSAGES.locationArea

  const name = singleLine(raw.name, LIMITS.name)
  if (name.length < 3 || !/\p{L}/u.test(name)) errors.name = MESSAGES.name

  const whatsapp = normalizeWhatsApp(typeof raw.whatsapp === 'string' ? raw.whatsapp : '')
  if (!whatsapp) errors.whatsapp = MESSAGES.whatsapp

  const email = singleLine(raw.email, LIMITS.email + 1).toLowerCase()
  if (email && !isValidEmail(email)) errors.email = MESSAGES.email

  const notesRaw = typeof raw.notes === 'string' ? raw.notes : ''
  if (notesRaw.length > LIMITS.notes) errors.notes = MESSAGES.notes
  const notes = multiLine(notesRaw, LIMITS.notes)

  if (raw.consent !== true) errors.consent = MESSAGES.consent

  const needsGuardian = services ? requiresGuardianConsent(services) : false
  if (needsGuardian && raw.guardianConsent !== true) errors.guardianConsent = MESSAGES.guardianConsent

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: {
      services: services as ServiceId[],
      date,
      time,
      eventType,
      locationType: locationType as LocationType,
      locationArea,
      name,
      whatsapp: whatsapp as string,
      email,
      notes,
      consent: true,
      guardianConsent: needsGuardian,
    },
  }
}
