import { BOOKING_RULES } from '../../shared/booking-rules.js'
import type { AdminSessionResponse } from '../../shared/types.js'
import { adminConfigured, isAuthenticated } from '../../server/auth.js'
import { emailConfigured } from '../../server/email.js'
import { googleCalendarConfigured } from '../../server/google-calendar.js'
import { env } from '../../server/env.js'
import { json } from '../../server/http.js'
import { getStore } from '../../server/store.js'

/** GET /api/admin/session — estado del panel (sin datos sensibles). */
export async function GET(request: Request): Promise<Response> {
  const authenticated = isAuthenticated(request)
  const store = getStore()
  const body: AdminSessionResponse = {
    ok: true,
    configured: adminConfigured(),
    authenticated,
    storage: authenticated ? (store?.kind ?? 'none') : 'none',
    email: authenticated ? emailConfigured() : false,
    google: authenticated ? googleCalendarConfigured() : false,
    approval: BOOKING_RULES.approval,
    account: authenticated ? env.adminEmail : null,
  }
  return json(body)
}
