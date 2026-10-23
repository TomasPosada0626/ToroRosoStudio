import { MAX_AMOUNT, PAYMENT_KINDS } from '../../shared/billing.js'
import { addDays, isValidDate, isValidTime, localToUtc, minutesOf, todayLocal } from '../../shared/time.js'
import type { AgendaResponse, PaymentKind } from '../../shared/types.js'
import { isAuthenticated } from '../../server/auth.js'
import { fail, isSameOrigin, json, readJson } from '../../server/http.js'
import {
  notifyBookingCancelled,
  notifyBookingConfirmed,
  notifyBookingRescheduled,
  notifyManualBooking,
} from '../../server/notify.js'
import { SlotTakenError, getStore } from '../../server/store.js'
import { BOOKING_RULES, totalDurationMinutes } from '../../shared/booking-rules.js'
import { LIMITS, normalizeWhatsApp, parseServices } from '../../shared/validation.js'

const str = (value: unknown, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

/** Inicio, fin y bloqueo (fin + movilización) de una sesión. */
const sessionSpan = (startsAt: number, durationMs: number) => ({
  startsAt,
  endsAt: startsAt + durationMs,
  blockedUntil: startsAt + durationMs + BOOKING_RULES.bufferAfterMinutes * 60_000,
})

/** GET /api/admin/agenda?from=AAAA-MM-DD&to=AAAA-MM-DD&cancelled=1 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthenticated(request)) return fail('UNAUTHORIZED', 'Inicia sesión para ver la agenda.', 401)
  const store = getStore()
  if (!store) return fail('NOT_CONFIGURED', 'Conecta la base de datos para usar la agenda.', 503)

  const params = new URL(request.url).searchParams
  const fromParam = params.get('from') ?? ''
  const toParam = params.get('to') ?? ''
  const from = isValidDate(fromParam) ? fromParam : todayLocal()
  const to = isValidDate(toParam) ? toParam : addDays(from, 180)
  try {
    const items = await store.list(
      localToUtc(from, '00:00').getTime(),
      localToUtc(addDays(to, 1), '00:00').getTime(),
      params.get('cancelled') === '1',
    )
    return json({ ok: true, items, storage: store.kind } satisfies AgendaResponse)
  } catch (error) {
    console.error('[admin/agenda]', error)
    return fail('SERVER', 'No se pudo cargar la agenda.', 500)
  }
}

/**
 * POST /api/admin/agenda
 *  { action: 'confirm', id }
 *  { action: 'cancel', id, notifyClient, reason? }   (si estaba por confirmar, se envía como rechazo con el motivo)
 *  { action: 'price', id, price }   (pesos; null = sin precio)
 *  { action: 'payment', id, kind, amount, method, paidOn, note? }
 *  { action: 'deletePayment', paymentId }
 *  { action: 'create', services, date, time, name, whatsapp, email?, eventType?, locationType?, locationArea?, notes?, price?, notifyClient }
 *  { action: 'reschedule', id, date, time, notifyClient }
 *  { action: 'block', date, dateTo?, allDay, from?, to?, reason? }
 *  { action: 'unblock', id }
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return fail('FORBIDDEN', 'Origen no permitido.', 403)
  if (!isAuthenticated(request)) return fail('UNAUTHORIZED', 'Inicia sesión de nuevo.', 401)
  const store = getStore()
  if (!store) return fail('NOT_CONFIGURED', 'Conecta la base de datos para usar la agenda.', 503)

  const body = (await readJson(request)) as Record<string, unknown> | null
  try {
    switch (body?.action) {
      case 'confirm': {
        const item = await store.confirm(str(body.id, 64))
        if (!item) return fail('NOT_FOUND', 'La solicitud no existe o ya fue gestionada.', 404)
        const { emailSent } = await notifyBookingConfirmed(item)
        return json({ ok: true, item, notified: emailSent })
      }

      case 'cancel': {
        const id = str(body.id, 64)
        const previous = await store.get(id)
        const item = await store.cancel(id, str(body.reason, 500) || null)
        if (!item) return fail('NOT_FOUND', 'La cita no existe o ya estaba cancelada.', 404)
        const kind = previous?.status === 'pending' ? 'rejected' : 'cancelled'
        const notified = await notifyBookingCancelled(item, kind, body.notifyClient === true)
        return json({ ok: true, item, notified })
      }

      case 'price': {
        const price = body.price === null ? null : Number(body.price)
        if (price !== null && (!Number.isSafeInteger(price) || price < 0 || price > MAX_AMOUNT)) {
          return fail('VALIDATION', 'Escribe un valor válido en pesos.', 422)
        }
        const item = await store.setPrice(str(body.id, 64), price)
        if (!item) return fail('NOT_FOUND', 'La cita no existe.', 404)
        return json({ ok: true, item })
      }

      case 'payment': {
        const amount = Number(body.amount)
        const kind = str(body.kind, 10) as PaymentKind
        const paidOn = str(body.paidOn, 10)
        if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
          return fail('VALIDATION', 'Escribe el valor del pago en pesos.', 422)
        }
        if (!(kind in PAYMENT_KINDS)) return fail('VALIDATION', 'Elige el tipo de pago.', 422)
        if (!isValidDate(paidOn)) return fail('VALIDATION', 'Revisa la fecha del pago.', 422)
        const item = await store.addPayment(str(body.id, 64), {
          kind,
          amount,
          method: str(body.method, 40) || 'Otro',
          paidAt: localToUtc(paidOn, '12:00').getTime(),
          note: str(body.note, 200) || null,
        })
        if (!item) return fail('NOT_FOUND', 'La cita no existe.', 404)
        return json({ ok: true, item }, 201)
      }

      case 'deletePayment': {
        const item = await store.removePayment(str(body.paymentId, 64))
        if (!item) return fail('NOT_FOUND', 'El pago no existe.', 404)
        return json({ ok: true, item })
      }

      case 'create': {
        const services = parseServices(body.services)
        if (!services) return fail('VALIDATION', 'Elige el procedimiento de cada persona.', 422)
        const date = str(body.date, 10)
        const time = str(body.time, 5)
        if (!isValidDate(date) || !isValidTime(time)) return fail('VALIDATION', 'Revisa la fecha y la hora.', 422)
        const name = str(body.name, LIMITS.name)
        if (name.length < 2) return fail('VALIDATION', 'Escribe el nombre de la clienta.', 422)
        const whatsapp = normalizeWhatsApp(str(body.whatsapp, 30))
        if (!whatsapp) return fail('VALIDATION', 'Escribe un número de WhatsApp válido.', 422)
        const email = str(body.email, LIMITS.email)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('VALIDATION', 'Revisa el correo.', 422)
        const price = body.price === null || body.price === undefined || body.price === '' ? null : Number(body.price)
        if (price !== null && (!Number.isSafeInteger(price) || price < 0 || price > MAX_AMOUNT)) {
          return fail('VALIDATION', 'Escribe un valor válido en pesos.', 422)
        }
        // Manuela puede agendar a cualquier hora (incluso registrar citas pasadas): solo se evita cruzar citas.
        const span = sessionSpan(localToUtc(date, time).getTime(), totalDurationMinutes(services) * 60_000)
        const created = await store.insertBooking({
          status: 'confirmed',
          source: 'panel',
          services,
          ...span,
          eventType: str(body.eventType, LIMITS.eventType) || 'Agendada por WhatsApp o Instagram',
          locationType: body.locationType === 'acordada' ? 'acordada' : 'domicilio',
          locationArea: str(body.locationArea, LIMITS.locationArea) || 'Por definir',
          clientName: name,
          clientWhatsapp: whatsapp,
          clientEmail: email || null,
          notes: str(body.notes, LIMITS.notes) || null,
          guardianConsent: null,
        })
        const item = (price !== null ? await store.setPrice(created.id, price) : null) ?? created
        const { emailSent } = await notifyManualBooking(item, body.notifyClient === true)
        return json({ ok: true, item, notified: emailSent }, 201)
      }

      case 'reschedule': {
        const id = str(body.id, 64)
        const date = str(body.date, 10)
        const time = str(body.time, 5)
        if (!isValidDate(date) || !isValidTime(time)) return fail('VALIDATION', 'Revisa la fecha y la hora.', 422)
        const current = await store.get(id)
        if (!current || current.kind !== 'booking' || current.status === 'cancelled') {
          return fail('NOT_FOUND', 'La cita no existe o ya fue cancelada.', 404)
        }
        const span = sessionSpan(localToUtc(date, time).getTime(), current.endsAt - current.startsAt)
        const item = await store.reschedule(id, span.startsAt, span.endsAt, span.blockedUntil)
        if (!item) return fail('NOT_FOUND', 'La cita no existe o ya fue cancelada.', 404)
        const { emailSent } = await notifyBookingRescheduled(item, current.googleEventId, body.notifyClient === true)
        return json({ ok: true, item, notified: emailSent })
      }

      case 'block': {
        const date = str(body.date, 10)
        const dateTo = str(body.dateTo, 10) || date
        if (!isValidDate(date) || !isValidDate(dateTo) || dateTo < date) {
          return fail('VALIDATION', 'Revisa las fechas del bloqueo.', 422)
        }
        if (dateTo > addDays(date, 60)) return fail('VALIDATION', 'Un bloqueo puede durar máximo 60 días.', 422)
        let startsAt: number
        let endsAt: number
        if (body.allDay === true) {
          startsAt = localToUtc(date, '00:00').getTime()
          endsAt = localToUtc(addDays(dateTo, 1), '00:00').getTime()
        } else {
          const from = str(body.from, 5)
          const to = str(body.to, 5)
          if (!isValidTime(from) || !isValidTime(to) || (date === dateTo && minutesOf(to) <= minutesOf(from))) {
            return fail('VALIDATION', 'Revisa las horas del bloqueo.', 422)
          }
          startsAt = localToUtc(date, from).getTime()
          endsAt = localToUtc(dateTo, to).getTime()
        }
        const item = await store.insertBlock({ startsAt, endsAt, notes: str(body.reason, 140) || null })
        return json({ ok: true, item }, 201)
      }

      case 'unblock': {
        const removed = await store.remove(str(body.id, 64))
        if (!removed) return fail('NOT_FOUND', 'El bloqueo no existe.', 404)
        return json({ ok: true })
      }

      default:
        return fail('VALIDATION', 'Acción no válida.', 400)
    }
  } catch (error) {
    if (error instanceof SlotTakenError) {
      return fail(
        'SLOT_TAKEN',
        body?.action === 'block'
          ? 'Ese rango se cruza con una cita activa. Cancélala primero si necesitas bloquearlo.'
          : 'Ese horario se cruza con otra cita o bloqueo (contando las 2 h de movilización). Elige otra hora.',
        409,
      )
    }
    console.error('[admin/agenda]', error)
    return fail('SERVER', 'No se pudo completar la acción.', 500)
  }
}
