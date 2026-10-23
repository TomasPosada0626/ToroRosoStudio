import { BOOKING_RULES } from '../shared/booking-rules.js'
import { DEPOSIT_TEXT, depositWhatsAppMessage } from '../shared/deposit.js'
import { googleCalendarUrl } from '../shared/ics.js'
import { capitalize, formatDateLong, formatTime, utcToLocal } from '../shared/time.js'
import type { AgendaItem } from '../shared/types.js'
import { formatWhatsApp } from '../shared/validation.js'
import { env } from './env.js'
import { calendarEventFor, present, waLink, type Presented } from './present.js'

/*
 * Correos con la identidad de Toro Roso Studio: negro profundo, satén ciruela y rosa metálico,
 * títulos romanos espaciados (como "TORO ROSO"), el destello ✦ y el lema "Elegancia para cada
 * ocasión". Se arman con tablas y estilos en línea porque es lo único que respetan todos los
 * clientes de correo (Gmail, Outlook, Apple Mail). Las fuentes web no cargan en Gmail, así que
 * se usan serif y sans del sistema con el mismo espaciado de la marca.
 */

const C = {
  page: '#050505',
  card: '#120912',
  inset: '#0b060b',
  line: '#3a2434',
  rose: '#B7839D',
  roseLight: '#D9B1C6',
  mauve: '#70465F',
  pearl: '#F2E9EE',
  muted: '#bfaeb7',
  soft: '#8f7d87',
}
const SERIF = "'Cormorant Garamond', Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif"
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
/** Rosa metálico: degradado donde se ve, color sólido donde no. */
const METAL = `background-color:${C.rose};background-image:linear-gradient(115deg,${C.mauve} 0%,${C.rose} 32%,${C.roseLight} 52%,${C.rose} 72%,${C.mauve} 100%);`

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

function button(href: string, label: string, primary = true): string {
  const style = primary
    ? `${METAL}color:#050505;border:1px solid ${C.rose};`
    : `background:transparent;color:${C.pearl};border:1px solid ${C.rose};`
  return `<a href="${esc(href)}" style="${style}display:inline-block;padding:15px 28px;margin:6px 4px;border-radius:999px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;text-decoration:none;mso-padding-alt:0">${esc(label)}</a>`
}

const buttons = (...items: string[]) => `<div style="text-align:center;margin:4px 0 26px">${items.join('')}</div>`

/** Línea — ✦ — línea */
const ornament = (margin = '0 0 26px') =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:${margin}"><tr>
    <td style="border-bottom:1px solid ${C.line};width:45%">&nbsp;</td>
    <td align="center" style="padding:0 12px;font-family:${SERIF};font-size:14px;line-height:1;color:${C.rose};white-space:nowrap;position:relative;top:7px">&#10022;</td>
    <td style="border-bottom:1px solid ${C.line};width:45%">&nbsp;</td>
  </tr></table>`

function rows(entries: [string, string][]): string {
  return entries
    .filter(([, value]) => value)
    .map(
      ([label, value], i) => `<tr>
        <td style="padding:13px 18px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${SANS};font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${C.rose};width:34%;vertical-align:top">${esc(label)}</td>
        <td style="padding:13px 18px 13px 0;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${SANS};font-size:15px;line-height:1.5;color:${C.pearl};vertical-align:top">${esc(value).replace(/\n/g, '<br>')}</td>
      </tr>`,
    )
    .join('')
}

const table = (inner: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 26px;background:${C.inset};border:1px solid ${C.line};border-radius:18px;border-collapse:separate;overflow:hidden">${inner}</table>`

/** Código de reserva destacado, como en la pantalla de confirmación de la web. */
const codeBlock = (code: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr><td align="center" style="padding:18px 16px;border:1px solid ${C.rose};border-radius:18px;background:${C.inset}">
    <div style="font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.soft}">Código de reserva</div>
    <div style="margin-top:6px;font-family:${SERIF};font-size:30px;letter-spacing:6px;color:${C.roseLight}">${esc(code)}</div>
  </td></tr></table>`

function layout(params: {
  preheader: string
  eyebrow: string
  title: string
  body: string
  /** 'studio' = avisos para Manuela (pie más corto). */
  audience?: 'client' | 'studio'
}): string {
  const site = env.siteUrl
  const client = params.audience !== 'studio'
  const whatsapp = env.studioWhatsApp
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(params.title)}</title></head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">${esc(params.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.page}" style="background:${C.page}">
    <tr><td align="center" style="padding:28px 12px 36px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.card}" style="max-width:600px;background-color:${C.card};background-image:radial-gradient(120% 70% at 50% 0%,#2b1027 0%,${C.card} 60%);border:1px solid ${C.line};border-radius:28px;border-collapse:separate;overflow:hidden">
        <tr><td style="height:4px;line-height:4px;font-size:0;${METAL}">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 32px 6px">
          <a href="${site}" style="text-decoration:none"><img src="${site}/brand/logo-640.png" width="230" alt="Toro Roso Studio" style="display:block;width:230px;max-width:72%;height:auto;border:0;outline:none"></a>
        </td></tr>
        <tr><td align="center" style="padding:6px 32px 0;font-family:${SERIF};font-style:italic;font-size:17px;color:${C.rose}">Elegancia para cada ocasión</td></tr>
        <tr><td style="padding:26px 40px 0">${ornament('0')}</td></tr>
        <tr><td align="center" style="padding:24px 32px 0;font-family:${SANS};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.rose}">&#10022;&nbsp;&nbsp;${esc(params.eyebrow)}&nbsp;&nbsp;&#10022;</td></tr>
        <tr><td align="center" style="padding:12px 32px 26px;font-family:${SERIF};font-size:28px;line-height:1.25;letter-spacing:3px;text-transform:uppercase;color:${C.pearl}">${esc(params.title)}</td></tr>
        <tr><td style="padding:0 36px 14px">${params.body}</td></tr>
        <tr><td style="padding:0 40px">${ornament('0 0 4px')}</td></tr>
        <tr><td align="center" style="padding:18px 32px 34px;font-family:${SANS};font-size:12px;line-height:1.9;color:${C.muted}">
          <div style="font-family:${SERIF};font-size:15px;letter-spacing:4px;text-transform:uppercase;color:${C.pearl}">Toro Roso Studio</div>
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.soft}">Maquillaje profesional · Envigado, Antioquia</div>
          <div style="margin-top:12px">
            <a href="https://wa.me/${whatsapp}" style="color:${C.roseLight};text-decoration:none">WhatsApp ${esc(formatWhatsApp(whatsapp))}</a>
            &nbsp;·&nbsp;
            <a href="https://www.instagram.com/tororosostudio/" style="color:${C.roseLight};text-decoration:none">@tororosostudio</a>
            &nbsp;·&nbsp;
            <a href="${site}" style="color:${C.roseLight};text-decoration:none">${esc(site.replace(/^https?:\/\//, ''))}</a>
          </div>
          ${
            client
              ? `<div style="margin-top:14px;font-size:11px;color:${C.soft}">Recibes este correo porque agendaste una cita en Toro Roso Studio.</div>`
              : ''
          }
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

const paragraph = (html: string) =>
  `<p style="margin:0 0 18px;font-family:${SANS};font-size:15px;line-height:1.75;color:${C.muted}">${html}</p>`

/** Aviso destacado dentro del correo (ej.: el anticipo o el motivo de un rechazo). */
const note = (html: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="padding:16px 18px;border-left:3px solid ${C.rose};background:#1b0d19;border-radius:0 14px 14px 0;font-family:${SANS};font-size:14px;line-height:1.7;color:${C.pearl}">${html}</td></tr></table>`

const detailRows = (p: Presented, extra: [string, string][] = []) =>
  codeBlock(p.code) +
  table(
    rows([
      ['Servicio', p.serviceLong],
      ['Personas', p.breakdown],
      ['Fecha', p.dateLong],
      ['Hora', p.timeRange],
      ['Duración', p.durationText],
      ['Lugar', p.location],
      ['Evento', p.eventType],
      ...extra,
    ]),
  )

const studioWhatsAppButton = (p: Presented, label = 'Escribir por WhatsApp') =>
  button(waLink(env.studioWhatsApp, `Hola, Toro Roso Studio. Tengo la cita ${p.code} (${p.serviceName}, ${p.dateLong}).`), label, false)

const textDetails = (p: Presented) =>
  [`Servicio: ${p.serviceLong}`, p.breakdown, `Fecha: ${p.dateLong}`, `Hora: ${p.timeRange}`, `Lugar: ${p.location}`, `Código: ${p.code}`]

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

/* ── Para la clienta ─────────────────────────────────────────────── */

/** Solicitud recibida: el horario quedó apartado y está por confirmar. */
export function clientRequestReceivedEmail(item: AgendaItem): RenderedEmail {
  const p = present(item)
  const body = [
    paragraph(
      `Hola, ${esc(p.firstName)}. Gracias por elegir Toro Roso Studio. Apartamos este horario para ti mientras Manuela revisa tu solicitud; te confirmaremos la cita muy pronto.`,
    ),
    detailRows(p),
    ...(BOOKING_RULES.depositRequired ? [note(esc(DEPOSIT_TEXT.pending))] : []),
    buttons(studioWhatsAppButton(p)),
    paragraph('Si necesitas cambiar algo, escríbenos indicando tu código de reserva.'),
  ].join('')
  return {
    subject: `Recibimos tu solicitud · ${p.serviceName} · ${p.dateLong}`,
    html: layout({ preheader: `Tu horario quedó apartado. Código ${p.code}.`, eyebrow: 'Solicitud recibida', title: 'Tu horario quedó apartado', body }),
    text: [
      `Hola, ${p.firstName}. Apartamos tu horario mientras Manuela revisa tu solicitud.`,
      '',
      ...textDetails(p),
      ...(BOOKING_RULES.depositRequired ? ['', DEPOSIT_TEXT.pending] : []),
    ].join('\n'),
  }
}

/** Cita confirmada. */
export function clientConfirmationEmail(item: AgendaItem): RenderedEmail {
  const p = present(item)
  const calendarUrl = googleCalendarUrl(calendarEventFor(item, 'client'))
  const body = [
    paragraph(`Hola, ${esc(p.firstName)}. Tu cita en Toro Roso Studio está confirmada. Estos son los detalles:`),
    detailRows(p),
    ...(BOOKING_RULES.depositRequired ? [note(esc(DEPOSIT_TEXT.confirmed))] : []),
    buttons(button(calendarUrl, 'Agregar a mi calendario'), studioWhatsAppButton(p)),
    paragraph(
      'Te contactaremos por WhatsApp para coordinar los detalles finales. Un día antes te enviaremos un recordatorio. Si necesitas cambiar o cancelar tu cita, escríbenos indicando tu código de reserva.',
    ),
  ].join('')
  return {
    subject: `Tu cita está confirmada · ${p.serviceName} · ${p.dateLong}`,
    html: layout({ preheader: `${p.dateLong}, ${p.timeRange} · Código ${p.code}`, eyebrow: 'Confirmación de cita', title: 'Tu cita está confirmada', body }),
    text: [
      `Hola, ${p.firstName}. Tu cita en Toro Roso Studio está confirmada.`,
      '',
      ...textDetails(p),
      ...(BOOKING_RULES.depositRequired ? ['', DEPOSIT_TEXT.confirmed] : []),
      '',
      `Agregar a Google Calendar: ${calendarUrl}`,
    ].join('\n'),
  }
}

/** La cita cambió de fecha u hora. */
export function clientRescheduledEmail(item: AgendaItem): RenderedEmail {
  const p = present(item)
  const calendarUrl = googleCalendarUrl(calendarEventFor(item, 'client'))
  const body = [
    paragraph(`Hola, ${esc(p.firstName)}. Tu cita en Toro Roso Studio cambió de horario. Estos son los nuevos datos:`),
    detailRows(p),
    buttons(button(calendarUrl, 'Agregar a mi calendario'), studioWhatsAppButton(p)),
    paragraph('Si el nuevo horario no te queda bien, escríbenos por WhatsApp indicando tu código de reserva.'),
  ].join('')
  return {
    subject: `Tu cita cambió de horario · ${p.dateLong}, ${p.timeStart}`,
    html: layout({ preheader: `Nuevo horario: ${p.dateLong}, ${p.timeRange}`, eyebrow: 'Cambio de horario', title: 'Tu cita tiene nuevo horario', body }),
    text: [`Hola, ${p.firstName}. Tu cita cambió de horario.`, '', ...textDetails(p), '', `Agregar a Google Calendar: ${calendarUrl}`].join('\n'),
  }
}

/** Cita rechazada (no se pudo confirmar) o cancelada. */
export function clientCancellationEmail(item: AgendaItem, reason: 'cancelled' | 'rejected'): RenderedEmail {
  const p = present(item)
  const rejected = reason === 'rejected'
  const body = [
    paragraph(
      rejected
        ? `Hola, ${esc(p.firstName)}. Lamentablemente no podemos atender tu solicitud en este horario:`
        : `Hola, ${esc(p.firstName)}. Te confirmamos que tu cita fue cancelada:`,
    ),
    detailRows(p),
    ...(item.cancelReason ? [note(`<strong>Motivo:</strong> ${esc(item.cancelReason)}`)] : []),
    paragraph('Escríbenos por WhatsApp y con gusto te ayudamos a encontrar otra fecha, o agenda de nuevo en línea.'),
    buttons(button(`${env.siteUrl}/agenda`, 'Elegir otra fecha'), studioWhatsAppButton(p, 'WhatsApp')),
  ].join('')
  const title = rejected ? 'No pudimos confirmar tu cita' : 'Tu cita fue cancelada'
  return {
    subject: `${title} · ${p.serviceName} · ${p.dateLong}`,
    html: layout({ preheader: `Cita ${p.code}.`, eyebrow: 'Actualización de tu cita', title, body }),
    text: [
      `Hola, ${p.firstName}. ${title}.`,
      '',
      ...textDetails(p),
      ...(item.cancelReason ? ['', `Motivo: ${item.cancelReason}`] : []),
      '',
      `Agenda de nuevo: ${env.siteUrl}/agenda`,
    ].join('\n'),
  }
}

/** Recordatorio del día anterior. */
export function clientReminderEmail(item: AgendaItem): RenderedEmail {
  const p = present(item)
  const calendarUrl = googleCalendarUrl(calendarEventFor(item, 'client'))
  const body = [
    paragraph(`Hola, ${esc(p.firstName)}. Te recordamos tu cita de mañana con Toro Roso Studio:`),
    detailRows(p),
    buttons(button(calendarUrl, 'Ver en mi calendario'), studioWhatsAppButton(p)),
    paragraph('Si necesitas algo antes de tu cita, escríbenos por WhatsApp.'),
  ].join('')
  return {
    subject: `Tu cita es mañana · ${p.timeStart} · Toro Roso Studio`,
    html: layout({ preheader: `${p.dateLong}, ${p.timeRange}`, eyebrow: 'Recordatorio', title: 'Te esperamos mañana', body }),
    text: [`Hola, ${p.firstName}. Te recordamos tu cita de mañana.`, '', ...textDetails(p)].join('\n'),
  }
}

/* ── Para Manuela ────────────────────────────────────────────────── */

/** Aviso de nueva cita (o solicitud por confirmar, con botones de un toque). */
export function studioNotificationEmail(
  item: AgendaItem,
  quick: { confirm: string | null; reject: string | null } | null,
): RenderedEmail {
  const p = present(item)
  const pending = item.status === 'pending'
  const deposit = BOOKING_RULES.depositRequired
  // Ya confirmada: el mensaje listo es el del anticipo. Por confirmar: un saludo general.
  const greeting =
    !pending && deposit
      ? depositWhatsAppMessage(item)
      : `Hola, ${p.firstName}. Te escribo de Toro Roso Studio sobre tu cita ${p.code} (${p.serviceName}, ${p.dateLong}, ${p.timeStart}).`
  const quickButtons =
    pending && quick?.confirm && quick.reject ? buttons(button(quick.confirm, 'Confirmar cita'), button(quick.reject, 'Rechazar', false)) : ''
  const body = [
    paragraph(
      pending
        ? `Llegó una nueva solicitud desde la página web. El horario ya quedó apartado: confírmala o recházala con un toque.${
            deposit ? ' Al confirmarla, te aparecerá un botón para escribirle por WhatsApp y coordinar el anticipo.' : ''
          }`
        : `Se agendó una nueva cita desde la página web. El horario ya quedó bloqueado en la agenda.${
            deposit ? ' Escríbele por WhatsApp para coordinar el anticipo.' : ''
          }`,
    ),
    quickButtons,
    detailRows(p, [
      ['Clienta', p.clientName],
      ['WhatsApp', p.whatsappPretty],
      ['Correo', p.email],
      ['Agenda bloqueada hasta', `${p.blockedUntil} (incluye movilización)`],
      ['Autorización de acudiente', p.guardian],
      ['Comentarios', p.notes],
    ]),
    buttons(
      ...(item.clientWhatsapp
        ? [button(waLink(item.clientWhatsapp, greeting), !pending && deposit ? 'Coordinar anticipo' : `Escribir a ${p.firstName}`)]
        : []),
      button(`${env.siteUrl}/admin`, 'Abrir agenda', false),
    ),
  ].join('')
  const title = pending ? 'Nueva solicitud por confirmar' : 'Nueva cita agendada'
  return {
    subject: `${pending ? 'Por confirmar' : 'Nueva cita'} · ${p.serviceName} · ${p.dateLong}, ${p.timeStart} · ${p.clientName}`,
    html: layout({ preheader: `${p.clientName} · ${p.timeRange} · ${p.location}`, eyebrow: 'Agenda Toro Roso', title, body, audience: 'studio' }),
    text: [
      `${title} desde la web.`,
      '',
      ...textDetails(p),
      `Bloqueado hasta: ${p.blockedUntil}`,
      `Clienta: ${p.clientName} · ${p.whatsappPretty}`,
      ...(p.email ? [`Correo: ${p.email}`] : []),
      ...(p.guardian ? [`Autorización de acudiente: ${p.guardian}`] : []),
      ...(p.notes ? [`Comentarios: ${p.notes}`] : []),
      ...(quick?.confirm ? ['', `Confirmar: ${quick.confirm}`, `Rechazar: ${quick.reject}`] : []),
      '',
      `Agenda: ${env.siteUrl}/admin`,
    ].join('\n'),
  }
}

/** Resumen diario para Manuela: citas de hoy, de mañana y solicitudes por confirmar. */
export function studioDigestEmail(data: { today: AgendaItem[]; tomorrow: AgendaItem[]; pending: AgendaItem[] }): RenderedEmail {
  const line = (item: AgendaItem, withDate = false) => {
    const p = present(item)
    const start = utcToLocal(item.startsAt)
    const when = withDate ? `${capitalize(formatDateLong(start.date))}, ${formatTime(start.time)}` : p.timeRange
    return [when, `${p.serviceName} · ${p.clientName}${p.location ? ` · ${p.location}` : ''}`] as [string, string]
  }
  const section = (title: string, items: AgendaItem[], withDate = false) =>
    `<p style="margin:26px 0 6px;font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.rose}">${esc(title)}</p>` +
    (items.length
      ? table(rows(items.map((i) => line(i, withDate))))
      : paragraph('Sin citas.'))
  const today = capitalize(formatDateLong(utcToLocal(Date.now()).date))
  const body = [
    paragraph(`Este es el resumen de tu agenda para hoy, ${esc(today.toLowerCase())}.`),
    section(`Hoy (${data.today.length})`, data.today),
    section(`Mañana (${data.tomorrow.length})`, data.tomorrow),
    data.pending.length ? section(`Por confirmar (${data.pending.length})`, data.pending, true) : '',
    buttons(button(`${env.siteUrl}/admin`, 'Abrir agenda')),
  ].join('')
  return {
    subject: `Tu agenda de hoy · ${data.today.length} ${data.today.length === 1 ? 'cita' : 'citas'}${data.pending.length ? ` · ${data.pending.length} por confirmar` : ''}`,
    html: layout({ preheader: `Hoy: ${data.today.length} · Mañana: ${data.tomorrow.length}`, eyebrow: 'Agenda Toro Roso', title: 'Tu agenda del día', body, audience: 'studio' }),
    text: [
      `Hoy (${data.today.length}):`,
      ...data.today.map((i) => line(i).join(' · ')),
      '',
      `Mañana (${data.tomorrow.length}):`,
      ...data.tomorrow.map((i) => line(i).join(' · ')),
      ...(data.pending.length ? ['', `Por confirmar (${data.pending.length}):`, ...data.pending.map((i) => line(i, true).join(' · '))] : []),
      '',
      `Agenda: ${env.siteUrl}/admin`,
    ].join('\n'),
  }
}
