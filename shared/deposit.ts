import { SERVICE_LONG_NAMES } from './booking-rules.js'
import { formatDateLong, formatTime, utcToLocal } from './time.js'
import type { AgendaItem } from './types.js'

/*
 * Anticipo para separar la fecha (ver `depositRequired` en booking-rules.ts).
 * Se coordina por WhatsApp DESPUÉS de que Manuela confirma la cita: la web solo lo anuncia;
 * el monto y el medio de pago se acuerdan por chat.
 */

export const DEPOSIT_TEXT = {
  /** Mientras la solicitud está por confirmar. */
  pending: 'Cuando Manuela confirme tu fecha, te escribirá por WhatsApp para coordinar el anticipo que la separa.',
  /** Cuando la cita ya está confirmada. */
  confirmed: 'Manuela te escribirá por WhatsApp para coordinar el anticipo que separa tu fecha.',
} as const

/** Mensaje listo para que Manuela le escriba a la clienta después de confirmar (ella completa los datos de pago). */
export function depositWhatsAppMessage(item: Pick<AgendaItem, 'clientName' | 'services' | 'startsAt'>): string {
  const start = utcToLocal(item.startsAt)
  const firstName = (item.clientName ?? '').trim().split(/\s+/)[0]
  const service =
    item.services.length === 1
      ? SERVICE_LONG_NAMES[item.services[0]].toLowerCase()
      : `maquillaje para ${item.services.length} personas`
  // La hora ya termina en punto ("2:00 p. m."), por eso no va al final de la frase.
  return `Hola${firstName ? `, ${firstName}` : ''} ✨ Te escribo de Toro Roso Studio. Tu cita de ${service} del ${formatDateLong(start.date)} a las ${formatTime(start.time)} quedó confirmada. Para separar tu fecha, te comparto la información del anticipo: `
}
