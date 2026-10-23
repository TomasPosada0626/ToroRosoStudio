import { isSameOrigin } from '../../server/http.js'
import { notifyBookingCancelled, notifyBookingConfirmed } from '../../server/notify.js'
import { present, waLink } from '../../server/present.js'
import { verifyQuickAction, type QuickAction } from '../../server/quick-actions.js'
import { getStore, type AgendaStore } from '../../server/store.js'
import { BOOKING_RULES } from '../../shared/booking-rules.js'
import { depositWhatsAppMessage } from '../../shared/deposit.js'
import type { AgendaItem } from '../../shared/types.js'

/*
 * Confirmar o rechazar una solicitud con un toque desde el correo de aviso.
 * GET muestra la cita y un botón; la acción solo ocurre con POST (así los antivirus de
 * correo que "visitan" los enlaces no confirman ni rechazan nada por error).
 */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · Toro Roso Studio</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(70% 60% at 50% 0%,#2b1027,#050505 70%);color:#F2E9EE;font-family:Georgia,serif}
main{max-width:460px;width:100%;text-align:center;border:1px solid rgba(183,131,157,.3);border-radius:28px;padding:40px 28px;background:rgba(14,7,16,.88)}
img{width:180px;height:auto}h1{font-weight:400;font-size:28px;margin:26px 0 10px}
p,label{font-family:Helvetica,Arial,sans-serif;color:#bfaeb7;line-height:1.6;font-size:15px}
dl{text-align:left;font-family:Helvetica,Arial,sans-serif;font-size:15px;margin:22px 0;border-top:1px solid #3a2434}
dt{color:#B7839D;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:14px}dd{margin:4px 0 0;white-space:pre-line}
.reason{display:block;text-align:left;font-size:13px;margin:4px 0 8px}
textarea{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:12px 14px;border-radius:14px;border:1px solid rgba(183,131,157,.35);background:#050505;color:#F2E9EE;font:15px/1.5 Helvetica,Arial,sans-serif;resize:vertical}
.btn{display:inline-block;margin:10px 6px 0;padding:15px 28px;border-radius:999px;font:600 12px/1 Helvetica,Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;text-decoration:none;border:1px solid #B7839D;cursor:pointer}
.primary{background:#B7839D;color:#050505}.ghost{background:transparent;color:#F2E9EE}
</style></head><body><main><img src="/brand/logo-640.png" alt="Toro Roso Studio"><h1>${esc(title)}</h1>${body}</main></body></html>`
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  })
}

const agendaLink = '<p><a class="btn ghost" href="/admin">Abrir agenda</a></p>'
const LABELS: Record<QuickAction, { ask: string; button: string; done: string }> = {
  confirm: { ask: '¿Confirmar esta cita?', button: 'Sí, confirmar', done: 'Cita confirmada' },
  reject: { ask: '¿Rechazar esta solicitud?', button: 'Sí, rechazar', done: 'Solicitud rechazada' },
}

function readParams(source: URLSearchParams) {
  return {
    id: source.get('id') ?? '',
    action: source.get('action') ?? '',
    exp: source.get('exp') ?? '',
    sig: source.get('sig') ?? '',
  }
}

type Loaded =
  | { ok: false; response: Response }
  | { ok: true; action: QuickAction; item: AgendaItem; store: AgendaStore }

async function loadPending(params: ReturnType<typeof readParams>): Promise<Loaded> {
  const action = verifyQuickAction(params)
  if (!action) return { ok: false, response: page('Enlace no válido', '<p>Este enlace venció o no es válido. Gestiona la cita desde la agenda.</p>' + agendaLink, 400) }
  const store = getStore()
  if (!store) return { ok: false, response: page('Agenda no disponible', '<p>Conecta la base de datos para usar la agenda.</p>', 503) }
  const item = await store.get(params.id)
  if (!item) return { ok: false, response: page('Cita no encontrada', '<p>La cita ya no existe.</p>' + agendaLink, 404) }
  if (item.status !== 'pending') {
    const state = item.status === 'confirmed' ? 'confirmada' : 'cancelada'
    return { ok: false, response: page('Ya gestionada', `<p>Esta solicitud ya está ${state}.</p>${agendaLink}`) }
  }
  return { ok: true, action, item, store }
}

/** GET /api/admin/quick?id&action&exp&sig — muestra la cita y pide confirmar la acción. */
export async function GET(request: Request): Promise<Response> {
  const params = readParams(new URL(request.url).searchParams)
  const loaded = await loadPending(params)
  if (!loaded.ok) return loaded.response
  const { action, item } = loaded
  const p = present(item)
  const hidden = Object.entries(params)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${esc(value)}">`)
    .join('')
  const notify =
    action === 'reject'
      ? `<label class="reason">Motivo del rechazo (opcional${item.clientEmail ? ', se incluye en el correo a la clienta' : ''})
          <textarea name="reason" maxlength="500" rows="3" placeholder="Ej.: ese día ya tengo una boda; puedo atenderte a partir de las 3:00 p. m."></textarea></label>${
            item.clientEmail
              ? '<p><label><input type="checkbox" name="notify" value="1" checked> Avisar a la clienta por correo</label></p>'
              : ''
          }`
      : ''
  return page(
    LABELS[action].ask,
    `<dl>
      <dt>Clienta</dt><dd>${esc(p.clientName)} · ${esc(p.whatsappPretty)}</dd>
      <dt>Servicio</dt><dd>${esc(p.breakdown)}</dd>
      <dt>Fecha y hora</dt><dd>${esc(p.dateLong)}, ${esc(p.timeRange)}</dd>
      <dt>Lugar</dt><dd>${esc(p.location)}</dd>
      ${p.guardian ? `<dt>Autorización de acudiente</dt><dd>${esc(p.guardian)}</dd>` : ''}
      ${p.notes ? `<dt>Comentarios</dt><dd>${esc(p.notes)}</dd>` : ''}
    </dl>
    <form method="post" action="/api/admin/quick">${hidden}${notify}
      <button class="btn primary" type="submit">${LABELS[action].button}</button>
      <a class="btn ghost" href="/admin">Abrir agenda</a>
    </form>`,
  )
}

/** POST /api/admin/quick — ejecuta la acción firmada. */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return page('Origen no permitido', '<p>Abre el enlace desde tu correo.</p>', 403)
  const form = new URLSearchParams(await request.text())
  const params = readParams(form)
  const loaded = await loadPending(params)
  if (!loaded.ok) return loaded.response
  const { action, item, store } = loaded
  const p = present(item)

  if (action === 'confirm') {
    const confirmed = await store.confirm(item.id)
    if (!confirmed) return page('Ya gestionada', `<p>Esta solicitud ya no está por confirmar.</p>${agendaLink}`)
    const { emailSent } = await notifyBookingConfirmed(confirmed)
    // Siguiente paso: escribirle por WhatsApp para coordinar el anticipo (mensaje listo).
    const depositLink =
      BOOKING_RULES.depositRequired && confirmed.clientWhatsapp
        ? `<p><a class="btn primary" href="${esc(waLink(confirmed.clientWhatsapp, depositWhatsAppMessage(confirmed)))}" target="_blank" rel="noopener noreferrer">Coordinar anticipo por WhatsApp</a></p>`
        : ''
    return page(
      LABELS.confirm.done,
      `<p>La cita de ${esc(p.firstName)} (${esc(p.dateLong.toLowerCase())}, ${esc(p.timeRange)}) quedó confirmada.${
        emailSent ? ' Le enviamos la confirmación por correo.' : ''
      }</p>${depositLink}${agendaLink}`,
    )
  }

  const cancelled = await store.cancel(item.id, (form.get('reason') ?? '').trim().slice(0, 500) || null)
  if (!cancelled) return page('Ya gestionada', `<p>Esta solicitud ya no está por confirmar.</p>${agendaLink}`)
  const notified = await notifyBookingCancelled(cancelled, 'rejected', form.get('notify') === '1')
  return page(
    LABELS.reject.done,
    `<p>El horario quedó libre en la agenda.${notified ? ` Le avisamos a ${esc(p.firstName)} por correo.` : ''}</p>${agendaLink}`,
  )
}
