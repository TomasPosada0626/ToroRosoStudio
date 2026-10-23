import type { ServiceId } from './booking-rules.js'
import type { FieldErrors, LocationType } from './validation.js'

export type ApiErrorCode =
  | 'VALIDATION'
  | 'SLOT_TAKEN'
  | 'LIMIT_REACHED'
  | 'NOT_CONFIGURED'
  | 'RATE_LIMITED'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'SERVER'

export interface ApiError {
  ok: false
  code: ApiErrorCode
  error: string
  fields?: FieldErrors
}

/** pending = horario apartado, por confirmar · confirmed = confirmada · cancelled = cancelada o rechazada */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface MonthAvailabilityResponse {
  ok: true
  month: string
  /** Fecha "AAAA-MM-DD" → cantidad de horarios libres. */
  days: Record<string, number>
}

export interface DayAvailabilityResponse {
  ok: true
  date: string
  slots: { time: string; endTime: string }[]
}

export interface PublicBooking {
  code: string
  status: 'pending' | 'confirmed'
  /** Procedimiento de cada persona. */
  services: ServiceId[]
  durationMinutes: number
  date: string
  time: string
  endTime: string
  startsAt: number
  endsAt: number
  name: string
  eventType: string
  locationType: LocationType
  locationArea: string
}

export interface CreateBookingResponse {
  ok: true
  booking: PublicBooking
  emailSent: boolean
  whatsappSent: boolean
}

export interface AgendaItem {
  id: string
  code: string
  kind: 'booking' | 'block'
  status: BookingStatus
  /** Procedimiento de cada persona (vacío en los bloqueos). */
  services: ServiceId[]
  startsAt: number
  endsAt: number
  blockedUntil: number
  eventType: string | null
  locationType: LocationType | null
  locationArea: string | null
  clientName: string | null
  clientWhatsapp: string | null
  clientEmail: string | null
  notes: string | null
  /** true si se confirmó la autorización del acudiente (quinceañeras); null si no aplica. */
  guardianConsent: boolean | null
  googleEventId: string | null
  createdAt: number
  confirmedAt: number | null
  cancelledAt: number | null
  reminderSentAt: number | null
  /** Valor acordado del servicio en pesos (COP). null = aún sin precio. */
  price: number | null
  /** Motivo del rechazo o la cancelación (se incluye en el correo a la clienta). */
  cancelReason: string | null
  /** Pagos recibidos (anticipo, saldo u otros), del más antiguo al más reciente. */
  payments: Payment[]
  /** 'web' = la agendó la clienta; 'panel' = la creó Manuela a mano. */
  source: 'web' | 'panel'
}

export type PaymentKind = 'anticipo' | 'saldo' | 'otro'

export interface Payment {
  id: string
  bookingId: string
  kind: PaymentKind
  /** Pesos colombianos, sin decimales. */
  amount: number
  method: string
  paidAt: number
  note: string | null
  createdAt: number
}

export interface AgendaResponse {
  ok: true
  items: AgendaItem[]
  storage: 'postgres' | 'memory'
}

export interface AdminSessionResponse {
  ok: true
  configured: boolean
  authenticated: boolean
  storage: 'postgres' | 'memory' | 'none'
  email: boolean
  google: boolean
  approval: 'manual' | 'auto'
  /** Correo de la cuenta administradora (solo con sesión iniciada). */
  account: string | null
}
