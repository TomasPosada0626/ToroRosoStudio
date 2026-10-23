import type { ServiceId } from '../../shared/booking-rules'
import type {
  AdminSessionResponse,
  AgendaItem,
  AgendaResponse,
  ApiErrorCode,
  CreateBookingResponse,
  DayAvailabilityResponse,
  MonthAvailabilityResponse,
  PaymentKind,
} from '../../shared/types'
import type { FieldErrors } from '../../shared/validation'

export class ApiRequestError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number,
    public fields?: FieldErrors,
  ) {
    super(message)
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiRequestError('SERVER', 'No hay conexión. Revisa tu internet e intenta de nuevo.', 0)
  }
  // Sin API (p. ej. sitio estático sin funciones): se trata como agenda no configurada.
  if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
    throw new ApiRequestError('NOT_CONFIGURED', 'La agenda en línea no está disponible.', response.status)
  }
  const data = await response.json()
  if (!response.ok || data?.ok === false) {
    throw new ApiRequestError(data?.code ?? 'SERVER', data?.error ?? 'Ocurrió un error inesperado.', response.status, data?.fields)
  }
  return data as T
}

const servicesParam = (services: readonly ServiceId[]) => encodeURIComponent(services.join(','))

export interface BookingPayload {
  services: ServiceId[]
  date: string
  time: string
  eventType: string
  locationType: string
  locationArea: string
  name: string
  whatsapp: string
  email: string
  notes: string
  consent: boolean
  guardianConsent: boolean
  /** Campo trampa para robots: siempre vacío. */
  website: string
  elapsedMs: number
}

export const api = {
  monthAvailability: (services: readonly ServiceId[], month: string, signal?: AbortSignal) =>
    request<MonthAvailabilityResponse>(`/api/availability?services=${servicesParam(services)}&month=${month}`, { signal }),

  dayAvailability: (services: readonly ServiceId[], date: string, signal?: AbortSignal) =>
    request<DayAvailabilityResponse>(`/api/availability?services=${servicesParam(services)}&date=${date}`, { signal }),

  createBooking: (payload: BookingPayload) =>
    request<CreateBookingResponse>('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),

  admin: {
    session: () => request<AdminSessionResponse>('/api/admin/session'),
    login: (email: string, password: string) =>
      request<{ ok: true }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request<{ ok: true }>('/api/admin/logout', { method: 'POST', body: '{}' }),
    agenda: (params: { from?: string; to?: string; cancelled?: boolean }) => {
      const query = new URLSearchParams()
      if (params.from) query.set('from', params.from)
      if (params.to) query.set('to', params.to)
      if (params.cancelled) query.set('cancelled', '1')
      return request<AgendaResponse>(`/api/admin/agenda?${query.toString()}`)
    },
    confirm: (id: string) =>
      request<{ ok: true; item: AgendaItem; notified: boolean }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'confirm', id }),
      }),
    cancel: (id: string, notifyClient: boolean, reason?: string) =>
      request<{ ok: true; item: AgendaItem; notified: boolean }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', id, notifyClient, reason }),
      }),
    createBooking: (booking: {
      services: ServiceId[]
      date: string
      time: string
      name: string
      whatsapp: string
      email?: string
      eventType?: string
      locationType?: 'domicilio' | 'acordada'
      locationArea?: string
      notes?: string
      price?: number | null
      notifyClient: boolean
    }) =>
      request<{ ok: true; item: AgendaItem; notified: boolean }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', ...booking }),
      }),
    reschedule: (id: string, date: string, time: string, notifyClient: boolean) =>
      request<{ ok: true; item: AgendaItem; notified: boolean }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'reschedule', id, date, time, notifyClient }),
      }),
    setPrice: (id: string, price: number | null) =>
      request<{ ok: true; item: AgendaItem }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'price', id, price }),
      }),
    addPayment: (
      id: string,
      payment: { kind: PaymentKind; amount: number; method: string; paidOn: string; note?: string },
    ) =>
      request<{ ok: true; item: AgendaItem }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'payment', id, ...payment }),
      }),
    deletePayment: (paymentId: string) =>
      request<{ ok: true; item: AgendaItem }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'deletePayment', paymentId }),
      }),
    block: (body: { date: string; dateTo?: string; allDay: boolean; from?: string; to?: string; reason?: string }) =>
      request<{ ok: true; item: AgendaItem }>('/api/admin/agenda', {
        method: 'POST',
        body: JSON.stringify({ action: 'block', ...body }),
      }),
    unblock: (id: string) =>
      request<{ ok: true }>('/api/admin/agenda', { method: 'POST', body: JSON.stringify({ action: 'unblock', id }) }),
  },
}
