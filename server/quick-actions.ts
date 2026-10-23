import { createHmac, timingSafeEqual } from 'node:crypto'
import { adminConfigured } from './auth.js'
import { env } from './env.js'

/*
 * Enlaces firmados para que Manuela confirme o rechace una solicitud con un toque
 * desde el correo de aviso, sin iniciar sesión. Vencen a los 7 días y solo sirven
 * para esa cita y esa acción.
 */

export type QuickAction = 'confirm' | 'reject'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

const sign = (payload: string) =>
  createHmac('sha256', `${env.sessionSecret}::toro-roso-quick`).update(payload).digest('base64url')

export function quickActionUrl(id: string, action: QuickAction): string | null {
  if (!adminConfigured()) return null
  const exp = String(Date.now() + TTL_MS)
  const sig = sign(`${id}.${action}.${exp}`)
  return `${env.siteUrl}/api/admin/quick?${new URLSearchParams({ id, action, exp, sig }).toString()}`
}

export function verifyQuickAction(params: { id: string; action: string; exp: string; sig: string }): QuickAction | null {
  if (!adminConfigured()) return null
  if (params.action !== 'confirm' && params.action !== 'reject') return null
  const exp = Number(params.exp)
  if (!Number.isFinite(exp) || exp < Date.now()) return null
  const expected = Buffer.from(sign(`${params.id}.${params.action}.${params.exp}`))
  const given = Buffer.from(params.sig)
  return expected.length === given.length && timingSafeEqual(expected, given) ? params.action : null
}
