import { BOOKING_RULES } from '../../shared/booking-rules.js'
import { addDays, localToUtc, todayLocal, utcToLocal } from '../../shared/time.js'
import type { AgendaItem } from '../../shared/types.js'
import { env } from '../../server/env.js'
import { fail, json } from '../../server/http.js'
import { sendReminder, sendStudioDigest } from '../../server/notify.js'
import { getStore } from '../../server/store.js'

/*
 * Tarea diaria (Vercel Cron, ver vercel.json): todas las mañanas
 *  1. Envía el recordatorio a las clientas con cita confirmada para mañana.
 *  2. Envía a Manuela el resumen de su agenda (hoy, mañana y solicitudes por confirmar).
 * Vercel la llama con el encabezado "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: Request): Promise<Response> {
  const secret = env.cronSecret
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) return fail('UNAUTHORIZED', 'No autorizado.', 401)
  } else if (env.isProduction) {
    return fail('NOT_CONFIGURED', 'Configura CRON_SECRET para activar los recordatorios.', 503)
  }

  const store = getStore()
  if (!store) return fail('NOT_CONFIGURED', 'Conecta la base de datos para usar la agenda.', 503)

  const startOf = (date: string) => localToUtc(date, '00:00').getTime()
  const today = todayLocal()
  const tomorrow = addDays(today, 1)
  const dayAfter = addDays(today, 2)

  try {
    const due = await store.listDueReminders(startOf(tomorrow), startOf(dayAfter))
    const results = await Promise.all(
      due.map(async (item) => {
        const sent = await sendReminder(item)
        if (sent) await store.markReminded(item.id)
        return sent
      }),
    )

    const upcoming = await store.list(startOf(today), startOf(addDays(today, BOOKING_RULES.maxAdvanceDays + 1)), false)
    const bookingsOn = (date: string) =>
      upcoming.filter((i: AgendaItem) => i.kind === 'booking' && i.status === 'confirmed' && utcToLocal(i.startsAt).date === date)
    const digest = {
      today: bookingsOn(today),
      tomorrow: bookingsOn(tomorrow),
      pending: upcoming.filter((i) => i.status === 'pending' && i.startsAt > Date.now()),
    }
    const hasNews = digest.today.length + digest.tomorrow.length + digest.pending.length > 0
    const digestSent = hasNews ? await sendStudioDigest(digest) : false

    return json({ ok: true, reminders: { due: due.length, sent: results.filter(Boolean).length }, digestSent })
  } catch (error) {
    console.error('[cron/reminders]', error)
    return fail('SERVER', 'No se pudieron enviar los recordatorios.', 500)
  }
}
