import { adminConfigured, credentialsMatch, sessionCookie } from '../../server/auth.js'
import { clientIp, fail, isRateLimited, isSameOrigin, json, readJson, wait } from '../../server/http.js'

/** POST /api/admin/login — { email, password } */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return fail('FORBIDDEN', 'Origen no permitido.', 403)
  if (!adminConfigured()) {
    return fail(
      'NOT_CONFIGURED',
      'El panel aún no está activo: configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 10 caracteres).',
      503,
    )
  }
  if (isRateLimited(`login:${clientIp(request)}`, 8, 15 * 60_000)) {
    return fail('RATE_LIMITED', 'Demasiados intentos. Espera 15 minutos.', 429)
  }
  const body = (await readJson(request, 2_048)) as { email?: unknown; password?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!credentialsMatch(email, password)) {
    await wait(700)
    return fail('UNAUTHORIZED', 'Correo o contraseña incorrectos.', 401)
  }
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request) })
}
