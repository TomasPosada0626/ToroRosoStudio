import { motion } from 'motion/react'
import { useState } from 'react'
import { BOOKING_RULES, SERVICE_LONG_NAMES, SERVICE_NAMES, describeServices } from '../../../shared/booking-rules'
import { DEPOSIT_TEXT } from '../../../shared/deposit'
import { buildIcs, googleCalendarUrl, type CalendarEvent } from '../../../shared/ics'
import { capitalize, formatDateLong, formatDuration, formatTime } from '../../../shared/time'
import type { PublicBooking } from '../../../shared/types'
import { LOCATION_LABELS } from '../../../shared/validation'
import { SITE } from '../../config/site'
import { bookingSummaryMessage, contactLink, waLink } from '../../lib/whatsapp'
import { EASE_LUXE } from '../fx/Reveal'
import { Button, ButtonLink } from '../ui/Button'
import { Calendar, Check, Copy, Download, InstagramIcon, WhatsAppIcon } from '../ui/Icons'
import { Sparkle } from '../ui/Sparkle'

/** Destellos que estallan alrededor del check de confirmación. */
function SparkleBurst() {
  const sparks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2
    const distance = 70 + (i % 3) * 22
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, size: i % 2 ? 'size-3' : 'size-2' }
  })
  return (
    <div className="relative mx-auto grid size-24 place-items-center" aria-hidden>
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="absolute text-rose-light"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0, 1.2, 0.6] }}
          transition={{ duration: 1.4, ease: EASE_LUXE, delay: 0.25 + i * 0.02 }}
        >
          <Sparkle className={s.size} />
        </motion.span>
      ))}
      <motion.span
        className="bg-metal grid size-24 place-items-center rounded-full text-noir shadow-[0_20px_60px_-15px_rgba(217,177,198,0.8)]"
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <Check className="size-10" />
      </motion.span>
    </div>
  )
}

function calendarEvent(b: PublicBooking): CalendarEvent {
  const single = b.services.length === 1 ? b.services[0] : null
  const title = single ? SERVICE_LONG_NAMES[single] : `Maquillaje para ${b.services.length} personas`
  return {
    uid: `${b.code}@tororosostudio`,
    title: `${title} · Toro Roso Studio${b.status === 'pending' ? ' (por confirmar)' : ''}`,
    description: [
      `Código de reserva: ${b.code}`,
      ...b.services.map((s, i) => `Persona ${i + 1}: ${SERVICE_NAMES[s]}`),
      '',
      `WhatsApp: +${SITE.contact.whatsapp}`,
      `Instagram: ${SITE.contact.instagram.handle}`,
    ].join('\n'),
    location: `${LOCATION_LABELS[b.locationType]} · ${b.locationArea}`,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
  }
}

export function BookingSuccess({
  booking,
  emailSent,
  email,
  onReset,
}: {
  booking: PublicBooking
  emailSent: boolean
  email: string
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const pending = booking.status === 'pending'
  const event = calendarEvent(booking)
  const whatsapp = waLink(bookingSummaryMessage(booking))

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      /* el portapapeles puede no estar disponible; el código sigue visible */
    }
  }

  const downloadIcs = () => {
    const ics = buildIcs(event, { status: pending ? 'TENTATIVE' : 'CONFIRMED' })
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `cita-${booking.code.toLowerCase()}.ics`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
  }

  const deposit = BOOKING_RULES.depositRequired
  const message = pending
    ? `Manuela revisará tu solicitud y te confirmará la fecha por WhatsApp${emailSent ? ` y en ${email}` : ''}.${
        deposit ? ' Luego te escribirá para coordinar el anticipo que la separa.' : ''
      } Para agilizarlo, envíale el resumen por WhatsApp.`
    : `${emailSent ? `Te enviamos la confirmación a ${email}; revisa también la carpeta de spam.` : 'Guarda tu código de reserva.'} ${
        deposit ? DEPOSIT_TEXT.confirmed : 'Te contactaremos por WhatsApp para coordinar los detalles finales y la cotización.'
      }`

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE_LUXE }}
      className="mx-auto max-w-2xl text-center"
      role="status"
    >
      <SparkleBurst />
      <h2 className="mt-10 font-display text-[clamp(1.9rem,5vw,3.2rem)] leading-tight tracking-[0.05em] text-pearl uppercase">
        {pending ? '¡Recibimos tu solicitud!' : '¡Tu cita está confirmada!'}
      </h2>
      <p className="text-metal font-script text-4xl">{pending ? 'Tu horario quedó apartado' : 'Te esperamos'}</p>

      <div className="mx-auto mt-10 max-w-md rounded-[1.75rem] border border-rose/30 bg-linear-to-b from-plum-900 to-noir p-6">
        <p className="text-[0.6875rem] tracking-[0.3em] text-smoke uppercase">Código de reserva</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <p className="text-metal font-display text-4xl tracking-[0.14em]">{booking.code}</p>
          <button
            type="button"
            onClick={copyCode}
            aria-label="Copiar código de reserva"
            className="grid size-10 place-items-center rounded-full border border-rose/30 text-rose transition hover:border-rose"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
        <span aria-live="polite" className="text-xs text-rose-light">
          {copied ? 'Código copiado' : ''}
        </span>
        {pending && (
          <p className="mx-auto mt-3 inline-flex rounded-full border border-rose/40 px-4 py-1.5 text-[0.6875rem] tracking-[0.2em] text-rose-light uppercase">
            Por confirmar
          </p>
        )}
        <dl className="mt-4 grid gap-3 border-t border-line pt-5 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-smoke">Servicio</dt>
            <dd className="text-right text-pearl">{describeServices(booking.services)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-smoke">Fecha</dt>
            <dd className="text-right text-pearl">{capitalize(formatDateLong(booking.date))}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-smoke">Hora</dt>
            <dd className="text-right text-pearl">
              {formatTime(booking.time)} – {formatTime(booking.endTime)}
              <span className="block text-xs text-smoke">{formatDuration(booking.durationMinutes)} aprox.</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-smoke">Lugar</dt>
            <dd className="text-right text-pearl">
              {LOCATION_LABELS[booking.locationType]} · {booking.locationArea}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-smoke">{message}</p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
        {whatsapp && (
          <ButtonLink to={whatsapp} size="sm">
            <WhatsAppIcon className="size-4" /> Enviar resumen por WhatsApp
          </ButtonLink>
        )}
        <ButtonLink to={googleCalendarUrl(event)} variant="outline" size="sm">
          <Calendar className="size-4" /> Google Calendar
        </ButtonLink>
        <Button variant="outline" size="sm" onClick={downloadIcs}>
          <Download className="size-4" /> Descargar .ics
        </Button>
      </div>

      <div className="mt-10 flex justify-center gap-6 text-[0.6875rem] tracking-[0.24em] uppercase">
        <button type="button" onClick={onReset} className="text-smoke hover:text-pearl">
          Agendar otra cita
        </button>
        <ButtonLink to="/" variant="ghost">
          Volver al inicio
        </ButtonLink>
      </div>
    </motion.div>
  )
}

/** Modo sin agenda en línea: la solicitud se envía por WhatsApp (o se copia para Instagram). */
export function RequestSent({ message, onReset }: { message: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false)
  const whatsapp = waLink(message)
  const instagram = contactLink(message)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      /* sin portapapeles: el mensaje sigue visible */
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE_LUXE }}
      className="mx-auto max-w-2xl text-center"
      role="status"
    >
      <SparkleBurst />
      <h2 className="mt-10 font-display text-[clamp(1.8rem,4.6vw,3rem)] leading-tight tracking-[0.05em] text-pearl uppercase">
        Tu solicitud está lista
      </h2>
      <p className="mx-auto mt-4 max-w-lg leading-relaxed text-smoke">
        {whatsapp
          ? 'Abrimos WhatsApp con tu solicitud. Revísala y envíala: tu cita queda confirmada cuando Toro Roso Studio verifique la disponibilidad y te responda.'
          : 'Copia tu solicitud y envíala por mensaje directo de Instagram. Tu cita queda confirmada cuando el estudio verifique la disponibilidad y te responda.'}
      </p>
      <pre
        className="mx-auto mt-8 max-h-72 max-w-lg overflow-auto rounded-2xl border border-line bg-noir/60 p-5 text-left font-sans text-xs leading-relaxed whitespace-pre-wrap text-pearl/85"
        data-lenis-prevent
      >
        {message.replace(/\*/g, '')}
      </pre>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {whatsapp ? (
          <ButtonLink to={whatsapp}>
            <WhatsAppIcon className="size-4" /> Abrir WhatsApp de nuevo
          </ButtonLink>
        ) : (
          <ButtonLink to={instagram.href}>
            <InstagramIcon className="size-4" /> Abrir Instagram
          </ButtonLink>
        )}
        <Button variant="outline" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copiado' : 'Copiar mensaje'}
        </Button>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-10 text-[0.6875rem] tracking-[0.24em] text-smoke uppercase hover:text-pearl"
      >
        Empezar de nuevo
      </button>
    </motion.div>
  )
}
