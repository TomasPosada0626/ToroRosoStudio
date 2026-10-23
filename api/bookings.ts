import { computeDaySlots, dayQueryRange } from '../shared/availability.js'
import { BOOKING_RULES, totalDurationMinutes } from '../shared/booking-rules.js'
import { utcToLocal } from '../shared/time.js'
import type { CreateBookingResponse, PublicBooking } from '../shared/types.js'
import { validateBookingRequest } from '../shared/validation.js'
import { busyBetween } from '../server/busy.js'
import { clientIp, fail, isRateLimited, isSameOrigin, json, readJson } from '../server/http.js'
import { notifyBookingCreated } from '../server/notify.js'
import { SlotTakenError, getStore } from '../server/store.js'

const SLOT_TAKEN = 'Ese horario acaba de ocuparse. Elige otro, por favor.'

/** POST /api/bookings — crea una cita y aparta el horario (servicio + movilización). */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return fail('FORBIDDEN', 'Origen no permitido.', 403)
  if (isRateLimited(`booking:${clientIp(request)}`, 6, 10 * 60_000)) {
    return fail('RATE_LIMITED', 'Recibimos varias solicitudes seguidas. Espera unos minutos e intenta de nuevo.', 429)
  }

  const store = getStore()
  if (!store) return fail('NOT_CONFIGURED', 'La agenda en línea aún no está activa.', 503)

  const body = await readJson(request)
  if (!body || typeof body !== 'object') return fail('VALIDATION', 'Solicitud no válida.', 400)

  // Campo trampa invisible y tiempo mínimo de llenado: frenan robots sin molestar a las clientas.
  const { website, elapsedMs } = body as { website?: unknown; elapsedMs?: unknown }
  if ((typeof website === 'string' && website.trim() !== '') || (typeof elapsedMs === 'number' && elapsedMs < 2_500)) {
    return fail('VALIDATION', 'No pudimos procesar la solicitud. Intenta de nuevo.', 400)
  }

  const result = validateBookingRequest(body)
  if (!result.ok) return fail('VALIDATION', 'Revisa los campos marcados.', 422, result.errors)
  const input = result.value
  const durationMinutes = totalDurationMinutes(input.services)

  try {
    // Protege la agenda: un mismo número no puede apartar muchas fechas a la vez.
    const active = await store.countActiveForClient(input.whatsapp, Date.now())
    if (active >= BOOKING_RULES.maxActivePerClient) {
      return fail(
        'LIMIT_REACHED',
        'Ya tienes varias citas activas con este número. Escríbenos por WhatsApp y con gusto agendamos otra.',
        409,
      )
    }

    const busy = await busyBetween(store, ...dayQueryRange(input.date))
    const slot = computeDaySlots({ date: input.date, durationMinutes, busy, now: new Date() }).find(
      (s) => s.time === input.time,
    )
    if (!slot) return fail('SLOT_TAKEN', SLOT_TAKEN, 409)

    const item = await store.insertBooking({
      status: BOOKING_RULES.approval === 'manual' ? 'pending' : 'confirmed',
      services: input.services,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      blockedUntil: slot.blockedUntil,
      eventType: input.eventType,
      locationType: input.locationType,
      locationArea: input.locationArea,
      clientName: input.name,
      clientWhatsapp: input.whatsapp,
      clientEmail: input.email || null,
      notes: input.notes || null,
      guardianConsent: input.guardianConsent ? true : null,
    })

    const start = utcToLocal(item.startsAt)
    const booking: PublicBooking = {
      code: item.code,
      status: item.status === 'pending' ? 'pending' : 'confirmed',
      services: input.services,
      durationMinutes,
      date: start.date,
      time: start.time,
      endTime: utcToLocal(item.endsAt).time,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      name: input.name,
      eventType: input.eventType,
      locationType: input.locationType,
      locationArea: input.locationArea,
    }
    const { emailSent, whatsappSent } = await notifyBookingCreated(item)
    return json({ ok: true, booking, emailSent, whatsappSent } satisfies CreateBookingResponse, 201)
  } catch (error) {
    if (error instanceof SlotTakenError) return fail('SLOT_TAKEN', SLOT_TAKEN, 409)
    console.error('[bookings]', error)
    return fail('SERVER', 'No pudimos agendar tu cita en este momento. Intenta de nuevo o escríbenos por WhatsApp.', 500)
  }
}
