import { buildIcs } from '../shared/ics.js'
import type { AgendaItem } from '../shared/types.js'
import {
  clientCancellationEmail,
  clientConfirmationEmail,
  clientReminderEmail,
  clientRescheduledEmail,
  clientRequestReceivedEmail,
  studioDigestEmail,
  studioNotificationEmail,
} from './email-templates.js'
import { sendEmail, type EmailMessage } from './email.js'
import { env } from './env.js'
import { createGoogleEvent, deleteGoogleEvent } from './google-calendar.js'
import { withTimeout } from './http.js'
import { calendarEventFor, present } from './present.js'
import { quickActionUrl } from './quick-actions.js'
import { getStore } from './store.js'

const TIMEOUT_MS = 7_000

const replyToStudio = () => env.publicContactEmail || env.studioNotifyEmail || undefined

const icsFor = (item: AgendaItem, audience: 'client' | 'studio', status: 'CONFIRMED' | 'TENTATIVE'): EmailMessage['ics'] => ({
  filename: `cita-${item.code.toLowerCase()}.ics`,
  content: buildIcs(calendarEventFor(item, audience), { status }),
  method: 'PUBLISH',
})

/*
 * WhatsApp automático (opcional) mediante WhatsApp Cloud API de Meta.
 * Requiere plantillas aprobadas con 5 variables en el cuerpo, por ejemplo:
 *   "Hola {{1}}, tu cita de {{2}} con Toro Roso Studio quedó confirmada para el {{3}}, {{4}}. Código: {{5}}."
 */
async function sendWhatsAppTemplate(to: string, template: string, params: string[]): Promise<boolean> {
  const { token, phoneNumberId, language, apiVersion } = env.whatsappCloud
  if (!token || !phoneNumberId || !template) return false
  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: language },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    })
    if (!response.ok) {
      console.error('[whatsapp] Cloud API respondió', response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('[whatsapp] No se pudo enviar el mensaje:', error)
    return false
  }
}

const templateParams = (item: AgendaItem) => {
  const p = present(item)
  return [p.firstName, p.serviceLong, p.dateLong, p.timeRange, p.code]
}

/** Crea el evento en el Google Calendar de Manuela (si está configurado) y guarda su id. */
async function syncGoogleEvent(item: AgendaItem): Promise<boolean> {
  const eventId = await createGoogleEvent(item)
  if (eventId) await getStore()?.setGoogleEventId(item.id, eventId)
  return Boolean(eventId)
}

/** Avisos al crear una cita (por confirmar o confirmada). */
export async function notifyBookingCreated(item: AgendaItem): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
  const pending = item.status === 'pending'

  const clientEmail = item.clientEmail
    ? sendEmail({
        to: item.clientEmail,
        replyTo: replyToStudio(),
        ...(pending ? clientRequestReceivedEmail(item) : clientConfirmationEmail(item)),
        ics: pending ? undefined : icsFor(item, 'client', 'CONFIRMED'),
      })
    : Promise.resolve(false)

  const quick = pending ? { confirm: quickActionUrl(item.id, 'confirm'), reject: quickActionUrl(item.id, 'reject') } : null
  const studioEmail = env.studioNotifyEmail
    ? sendEmail({
        to: env.studioNotifyEmail,
        replyTo: item.clientEmail ?? undefined,
        ...studioNotificationEmail(item, quick),
        ics: icsFor(item, 'studio', pending ? 'TENTATIVE' : 'CONFIRMED'),
      })
    : Promise.resolve(false)

  const whatsapp =
    !pending && item.clientWhatsapp
      ? sendWhatsAppTemplate(item.clientWhatsapp, env.whatsappCloud.template, templateParams(item))
      : Promise.resolve(false)

  const google = pending ? Promise.resolve(false) : syncGoogleEvent(item)

  const [emailSent, studioSent, whatsappSent] = await Promise.all([
    withTimeout(clientEmail, TIMEOUT_MS, false),
    withTimeout(studioEmail, TIMEOUT_MS, false),
    withTimeout(whatsapp, TIMEOUT_MS, false),
    withTimeout(google, TIMEOUT_MS, false),
  ])
  if (env.studioNotifyEmail && !studioSent) console.error('[notify] No se pudo avisar al estudio de la cita', item.code)
  return { emailSent, whatsappSent }
}

/** Avisos cuando Manuela confirma una solicitud. */
export async function notifyBookingConfirmed(item: AgendaItem): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
  const clientEmail = item.clientEmail
    ? sendEmail({
        to: item.clientEmail,
        replyTo: replyToStudio(),
        ...clientConfirmationEmail(item),
        ics: icsFor(item, 'client', 'CONFIRMED'),
      })
    : Promise.resolve(false)
  const whatsapp = item.clientWhatsapp
    ? sendWhatsAppTemplate(item.clientWhatsapp, env.whatsappCloud.template, templateParams(item))
    : Promise.resolve(false)
  const [emailSent, whatsappSent] = await Promise.all([
    withTimeout(clientEmail, TIMEOUT_MS, false),
    withTimeout(whatsapp, TIMEOUT_MS, false),
    withTimeout(syncGoogleEvent(item), TIMEOUT_MS, false),
  ])
  return { emailSent, whatsappSent }
}

/** Avisos al rechazar una solicitud o cancelar una cita. Libera también el evento de Google. */
export async function notifyBookingCancelled(
  item: AgendaItem,
  reason: 'cancelled' | 'rejected',
  notifyClient: boolean,
): Promise<boolean> {
  const google = item.googleEventId ? deleteGoogleEvent(item.googleEventId) : Promise.resolve()
  const email =
    notifyClient && item.clientEmail
      ? sendEmail({
          to: item.clientEmail,
          replyTo: replyToStudio(),
          ...clientCancellationEmail(item, reason),
          ...(reason === 'cancelled'
            ? {
                ics: {
                  filename: `cita-${item.code.toLowerCase()}.ics`,
                  content: buildIcs(calendarEventFor(item, 'client'), { method: 'CANCEL' }),
                  method: 'CANCEL' as const,
                },
              }
            : {}),
        })
      : Promise.resolve(false)
  const [sent] = await Promise.all([withTimeout(email, TIMEOUT_MS, false), withTimeout(google, TIMEOUT_MS, undefined)])
  return sent
}

/** Recordatorio del día anterior (correo y, si está configurado, WhatsApp automático). */
export async function sendReminder(item: AgendaItem): Promise<boolean> {
  const email = item.clientEmail
    ? sendEmail({ to: item.clientEmail, replyTo: replyToStudio(), ...clientReminderEmail(item) })
    : Promise.resolve(false)
  const whatsapp = item.clientWhatsapp
    ? sendWhatsAppTemplate(item.clientWhatsapp, env.whatsappCloud.reminderTemplate, templateParams(item))
    : Promise.resolve(false)
  const [emailSent, whatsappSent] = await Promise.all([
    withTimeout(email, TIMEOUT_MS, false),
    withTimeout(whatsapp, TIMEOUT_MS, false),
  ])
  return emailSent || whatsappSent
}

/** Resumen diario de la agenda para Manuela. */
export async function sendStudioDigest(data: { today: AgendaItem[]; tomorrow: AgendaItem[]; pending: AgendaItem[] }): Promise<boolean> {
  if (!env.studioNotifyEmail) return false
  return withTimeout(sendEmail({ to: env.studioNotifyEmail, ...studioDigestEmail(data) }), TIMEOUT_MS, false)
}

/** Cita creada a mano por Manuela (ya confirmada). Si ella lo elige, la clienta recibe la confirmación. */
export async function notifyManualBooking(item: AgendaItem, notifyClient: boolean): Promise<{ emailSent: boolean }> {
  if (notifyClient) return notifyBookingConfirmed(item)
  await withTimeout(syncGoogleEvent(item), TIMEOUT_MS, false)
  return { emailSent: false }
}

/** Cita reprogramada: mueve el evento de Google Calendar y, si Manuela lo elige, avisa a la clienta. */
export async function notifyBookingRescheduled(
  item: AgendaItem,
  previousEventId: string | null,
  notifyClient: boolean,
): Promise<{ emailSent: boolean }> {
  const google = (async () => {
    if (previousEventId) await deleteGoogleEvent(previousEventId)
    return item.status === 'confirmed' ? syncGoogleEvent(item) : false
  })()
  const clientEmail =
    notifyClient && item.clientEmail
      ? sendEmail({
          to: item.clientEmail,
          replyTo: replyToStudio(),
          ...clientRescheduledEmail(item),
          ...(item.status === 'confirmed' ? { ics: icsFor(item, 'client', 'CONFIRMED') } : {}),
        })
      : Promise.resolve(false)
  const [emailSent] = await Promise.all([withTimeout(clientEmail, TIMEOUT_MS, false), withTimeout(google, TIMEOUT_MS, false)])
  return { emailSent }
}
