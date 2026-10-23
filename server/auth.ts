import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { env } from './env.js'

/*
 * Acceso al panel de Manuela: una sola cuenta (ADMIN_EMAIL + ADMIN_PASSWORD) y una cookie firmada.
 * Las clientas no necesitan cuenta ni contraseña para agendar.
 */

const COOKIE = 'trs_admin'
const TTL_SECONDS = 12 * 60 * 60

const sha256 = (value: string) => createHash('sha256').update(value).digest()
const sign = (payload: string) =>
  createHmac('sha256', `${env.sessionSecret}::toro-roso-admin`).update(payload).digest('base64url')

/** El panel se habilita con un correo administrador y una contraseña de al menos 10 caracteres. */
export const adminConfigured = () => env.adminPassword.length >= 10 && env.adminEmail.includes('@')

/** Compara correo y contraseña sin revelar cuál de los dos falló. */
export function credentialsMatch(email: string, password: string): boolean {
  if (!adminConfigured()) return false
  const emailOk = timingSafeEqual(sha256(email.trim().toLowerCase()), sha256(env.adminEmail))
  const passwordOk = timingSafeEqual(sha256(password), sha256(env.adminPassword))
  return emailOk && passwordOk
}

export function sessionCookie(request: Request): string {
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE}=${expires}.${sign(String(expires))}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${TTL_SECONDS}${secure}`
}

export const clearedSessionCookie = `${COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0`

export function isAuthenticated(request: Request): boolean {
  if (!adminConfigured()) return false
  const entry = (request.headers.get('cookie') ?? '').split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`))
  if (!entry) return false
  const [expires, signature] = entry.slice(COOKIE.length + 1).split('.')
  if (!expires || !signature || Number(expires) * 1000 < Date.now()) return false
  const expected = Buffer.from(sign(expires))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
