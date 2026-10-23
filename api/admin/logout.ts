import { clearedSessionCookie } from '../../server/auth.js'
import { json } from '../../server/http.js'

/** POST /api/admin/logout */
export async function POST(): Promise<Response> {
  return json({ ok: true }, 200, { 'set-cookie': clearedSessionCookie })
}
