import { neon } from '@neondatabase/serverless'
import { isServiceId, type ServiceId } from '../shared/booking-rules.js'
import type { BusyInterval } from '../shared/availability.js'
import type { AgendaItem, Payment, PaymentKind } from '../shared/types.js'
import type { LocationType } from '../shared/validation.js'
import { env } from './env.js'

/** El horario se cruzó con otra cita o bloqueo (lo garantiza la base de datos). */
export class SlotTakenError extends Error {
  constructor() {
    super('SLOT_TAKEN')
  }
}

export interface NewBooking {
  status: 'pending' | 'confirmed'
  services: ServiceId[]
  startsAt: number
  endsAt: number
  blockedUntil: number
  eventType: string
  locationType: LocationType
  locationArea: string
  clientName: string
  clientWhatsapp: string
  clientEmail: string | null
  notes: string | null
  /** true = autorización del acudiente confirmada (quinceañeras); null = no aplica. */
  guardianConsent: boolean | null
  /** 'panel' cuando la crea Manuela a mano (por defecto 'web'). */
  source?: 'web' | 'panel'
}

export interface NewBlock {
  startsAt: number
  endsAt: number
  notes: string | null
}

export interface NewPayment {
  kind: PaymentKind
  amount: number
  method: string
  paidAt: number
  note: string | null
}

export interface AgendaStore {
  kind: 'postgres' | 'memory'
  /** Intervalos que ocupan la agenda: citas por confirmar, confirmadas y bloqueos. */
  listBusy(from: number, to: number): Promise<BusyInterval[]>
  insertBooking(booking: NewBooking): Promise<AgendaItem>
  insertBlock(block: NewBlock): Promise<AgendaItem>
  list(from: number, to: number, includeCancelled: boolean): Promise<AgendaItem[]>
  get(id: string): Promise<AgendaItem | null>
  /** Pasa una cita "por confirmar" a confirmada. */
  confirm(id: string): Promise<AgendaItem | null>
  /** Cancela (o rechaza) una cita por confirmar o confirmada; libera el horario. */
  cancel(id: string, reason: string | null): Promise<AgendaItem | null>
  /** Cambia fecha y hora (misma duración). Lanza SlotTakenError si se cruza con otra cita. */
  reschedule(id: string, startsAt: number, endsAt: number, blockedUntil: number): Promise<AgendaItem | null>
  /** Valor acordado del servicio (null = sin precio). */
  setPrice(id: string, price: number | null): Promise<AgendaItem | null>
  addPayment(bookingId: string, payment: NewPayment): Promise<AgendaItem | null>
  /** Borra un pago y devuelve la cita actualizada. */
  removePayment(paymentId: string): Promise<AgendaItem | null>
  remove(id: string): Promise<boolean>
  /** Citas activas (futuras, por confirmar o confirmadas) de un mismo número de WhatsApp. */
  countActiveForClient(whatsapp: string, now: number): Promise<number>
  /** Citas confirmadas entre `from` y `to` que aún no recibieron recordatorio. */
  listDueReminders(from: number, to: number): Promise<AgendaItem[]>
  markReminded(id: string): Promise<void>
  setGoogleEventId(id: string, eventId: string | null): Promise<void>
}

const iso = (ms: number) => new Date(ms).toISOString()
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Código corto y legible para la clienta, sin caracteres ambiguos (0/O, 1/I). */
export function bookingCode(prefix = 'TR'): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return `${prefix}-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`
}

/* ── Postgres (Neon) ─────────────────────────────────────────────── */

type Timestamp = string | Date

const ms = (value: Timestamp) => new Date(value).getTime()
const msOrNull = (value: Timestamp | null) => (value ? ms(value) : null)
type Row = {
  id: string
  code: string
  kind: string
  status: string
  services: string[] | null
  starts_at: Timestamp
  ends_at: Timestamp
  blocked_until: Timestamp
  event_type: string | null
  location_type: string | null
  location_area: string | null
  client_name: string | null
  client_whatsapp: string | null
  client_email: string | null
  notes: string | null
  guardian_consent: boolean | null
  google_event_id: string | null
  created_at: Timestamp
  confirmed_at: Timestamp | null
  cancelled_at: Timestamp | null
  reminder_sent_at: Timestamp | null
  price: number | null
  cancel_reason: string | null
  payments?: PaymentRow[] | null
  source: string | null
}

type PaymentRow = {
  id: string
  booking_id: string
  kind: string
  amount: number
  method: string
  paid_at: Timestamp
  note: string | null
  created_at: Timestamp
}

const PAYMENT_KIND_SET = new Set<string>(['anticipo', 'saldo', 'otro'])

function paymentFromRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    kind: (PAYMENT_KIND_SET.has(row.kind) ? row.kind : 'otro') as PaymentKind,
    amount: Number(row.amount),
    method: row.method,
    paidAt: ms(row.paid_at),
    note: row.note,
    createdAt: ms(row.created_at),
  }
}

function fromRow(row: Row): AgendaItem {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind === 'block' ? 'block' : 'booking',
    status: row.status === 'pending' || row.status === 'cancelled' ? row.status : 'confirmed',
    services: (row.services ?? []).filter(isServiceId),
    startsAt: ms(row.starts_at),
    endsAt: ms(row.ends_at),
    blockedUntil: ms(row.blocked_until),
    eventType: row.event_type,
    locationType: row.location_type === 'domicilio' || row.location_type === 'acordada' ? row.location_type : null,
    locationArea: row.location_area,
    clientName: row.client_name,
    clientWhatsapp: row.client_whatsapp,
    clientEmail: row.client_email,
    notes: row.notes,
    guardianConsent: row.guardian_consent,
    googleEventId: row.google_event_id,
    createdAt: ms(row.created_at),
    confirmedAt: msOrNull(row.confirmed_at),
    cancelledAt: msOrNull(row.cancelled_at),
    reminderSentAt: msOrNull(row.reminder_sent_at),
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    cancelReason: row.cancel_reason ?? null,
    payments: (row.payments ?? []).map(paymentFromRow).sort((a, b) => a.paidAt - b.paidAt),
    source: row.source === 'panel' ? 'panel' : 'web',
  }
}

const pgCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : ''

function postgresStore(url: string): AgendaStore {
  const sql = neon(url)
  let schemaReady: Promise<void> | null = null

  /*
   * Crea la tabla la primera vez. La restricción EXCLUDE impide, a nivel de base de datos,
   * que dos citas activas se crucen (incluido el tiempo de movilización), incluso si dos
   * personas reservan exactamente al mismo tiempo.
   */
  const ensureSchema = () => {
    schemaReady ??= (async () => {
      await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`
      await sql`
        CREATE TABLE IF NOT EXISTS agenda (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          code text NOT NULL UNIQUE,
          kind text NOT NULL CHECK (kind IN ('booking', 'block')),
          status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
          services text[] NOT NULL DEFAULT '{}',
          starts_at timestamptz NOT NULL,
          ends_at timestamptz NOT NULL,
          blocked_until timestamptz NOT NULL,
          event_type text,
          location_type text,
          location_area text,
          client_name text,
          client_whatsapp text,
          client_email text,
          notes text,
          guardian_consent boolean,
          google_event_id text,
          created_at timestamptz NOT NULL DEFAULT now(),
          confirmed_at timestamptz,
          cancelled_at timestamptz,
          reminder_sent_at timestamptz,
          CONSTRAINT agenda_valid_range CHECK (ends_at > starts_at AND blocked_until >= ends_at),
          CONSTRAINT agenda_no_overlap EXCLUDE USING gist (
            tstzrange(starts_at, blocked_until, '[)') WITH &&
          ) WHERE (status IN ('pending', 'confirmed'))
        )`
      await sql`CREATE INDEX IF NOT EXISTS agenda_starts_at_idx ON agenda (starts_at)`
      await sql`CREATE INDEX IF NOT EXISTS agenda_client_idx ON agenda (client_whatsapp)`
      // Cobros (se agregan también a tablas creadas antes de esta versión).
      await sql`ALTER TABLE agenda ADD COLUMN IF NOT EXISTS price integer CHECK (price >= 0)`
      await sql`ALTER TABLE agenda ADD COLUMN IF NOT EXISTS cancel_reason text`
      await sql`ALTER TABLE agenda ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web'`
      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_id uuid NOT NULL REFERENCES agenda (id) ON DELETE CASCADE,
          kind text NOT NULL CHECK (kind IN ('anticipo', 'saldo', 'otro')),
          amount integer NOT NULL CHECK (amount > 0),
          method text NOT NULL,
          paid_at timestamptz NOT NULL,
          note text,
          created_at timestamptz NOT NULL DEFAULT now()
        )`
      await sql`CREATE INDEX IF NOT EXISTS payments_booking_idx ON payments (booking_id)`
    })().catch((error) => {
      schemaReady = null
      throw error
    })
    return schemaReady
  }

  const insert = async (values: NewBooking | NewBlock, kind: 'booking' | 'block'): Promise<AgendaItem> => {
    await ensureSchema()
    const b = kind === 'booking' ? (values as NewBooking) : null
    const status = b ? b.status : 'confirmed'
    const blockedUntil = b ? b.blockedUntil : values.endsAt
    for (let attempt = 0; ; attempt++) {
      try {
        const rows = (await sql`
          INSERT INTO agenda (
            code, kind, status, services, starts_at, ends_at, blocked_until,
            event_type, location_type, location_area, client_name, client_whatsapp, client_email, notes,
            guardian_consent, confirmed_at, source
          ) VALUES (
            ${bookingCode(kind === 'block' ? 'BL' : 'TR')}, ${kind}, ${status}, ${b?.services ?? []},
            ${iso(values.startsAt)}, ${iso(values.endsAt)}, ${iso(blockedUntil)},
            ${b?.eventType ?? null}, ${b?.locationType ?? null}, ${b?.locationArea ?? null},
            ${b?.clientName ?? null}, ${b?.clientWhatsapp ?? null}, ${b?.clientEmail ?? null}, ${values.notes},
            ${b?.guardianConsent ?? null}, ${status === 'confirmed' ? iso(Date.now()) : null}, ${b?.source ?? 'web'}
          )
          RETURNING *`) as Row[]
        return fromRow({ ...rows[0], payments: [] })
      } catch (error) {
        const code = pgCode(error)
        if (code === '23P01') throw new SlotTakenError()
        // Código de reserva repetido (muy improbable): se genera otro.
        if (code === '23505' && attempt < 3) continue
        throw error
      }
    }
  }

  const one = (rows: Row[]) => (rows[0] ? fromRow(rows[0]) : null)

  const store: AgendaStore = {
    kind: 'postgres',
    async listBusy(from, to) {
      await ensureSchema()
      const rows = (await sql`
        SELECT starts_at, blocked_until FROM agenda
        WHERE status IN ('pending', 'confirmed') AND starts_at < ${iso(to)} AND blocked_until > ${iso(from)}`) as Pick<
        Row,
        'starts_at' | 'blocked_until'
      >[]
      return rows.map((r) => ({ start: ms(r.starts_at), end: ms(r.blocked_until) }))
    },
    insertBooking: (booking) => insert(booking, 'booking'),
    insertBlock: (block) => insert(block, 'block'),
    async list(from, to, includeCancelled) {
      await ensureSchema()
      const rows = (await sql`
        SELECT a.*, COALESCE((SELECT json_agg(p) FROM payments p WHERE p.booking_id = a.id), '[]'::json) AS payments
        FROM agenda a
        WHERE a.starts_at < ${iso(to)} AND a.blocked_until > ${iso(from)}
          AND (${includeCancelled} OR a.status <> 'cancelled')
        ORDER BY a.starts_at ASC
        LIMIT 3000`) as Row[]
      return rows.map(fromRow)
    },
    async get(id) {
      if (!UUID_RE.test(id)) return null
      await ensureSchema()
      return one(
        (await sql`
          SELECT a.*, COALESCE((SELECT json_agg(p) FROM payments p WHERE p.booking_id = a.id), '[]'::json) AS payments
          FROM agenda a WHERE a.id = ${id}`) as Row[],
      )
    },
    async confirm(id) {
      if (!UUID_RE.test(id)) return null
      await ensureSchema()
      const rows = (await sql`
        UPDATE agenda SET status = 'confirmed', confirmed_at = now()
        WHERE id = ${id} AND status = 'pending'
        RETURNING id`) as { id: string }[]
      return rows.length ? store.get(id) : null
    },
    async cancel(id, reason) {
      if (!UUID_RE.test(id)) return null
      await ensureSchema()
      const rows = (await sql`
        UPDATE agenda SET status = 'cancelled', cancelled_at = now(), cancel_reason = ${reason}
        WHERE id = ${id} AND status IN ('pending', 'confirmed')
        RETURNING id`) as { id: string }[]
      return rows.length ? store.get(id) : null
    },
    async reschedule(id, startsAt, endsAt, blockedUntil) {
      if (!UUID_RE.test(id)) return null
      await ensureSchema()
      try {
        const rows = (await sql`
          UPDATE agenda
          SET starts_at = ${iso(startsAt)}, ends_at = ${iso(endsAt)}, blocked_until = ${iso(blockedUntil)}, reminder_sent_at = NULL
          WHERE id = ${id} AND kind = 'booking' AND status IN ('pending', 'confirmed')
          RETURNING id`) as { id: string }[]
        return rows.length ? store.get(id) : null
      } catch (error) {
        if (pgCode(error) === '23P01') throw new SlotTakenError()
        throw error
      }
    },
    async setPrice(id, price) {
      if (!UUID_RE.test(id)) return null
      await ensureSchema()
      const rows = (await sql`UPDATE agenda SET price = ${price} WHERE id = ${id} AND kind = 'booking' RETURNING id`) as {
        id: string
      }[]
      return rows.length ? store.get(id) : null
    },
    async addPayment(bookingId, p) {
      if (!UUID_RE.test(bookingId)) return null
      await ensureSchema()
      const rows = (await sql`
        INSERT INTO payments (booking_id, kind, amount, method, paid_at, note)
        SELECT id, ${p.kind}, ${p.amount}, ${p.method}, ${iso(p.paidAt)}, ${p.note}
        FROM agenda WHERE id = ${bookingId} AND kind = 'booking'
        RETURNING booking_id`) as { booking_id: string }[]
      return rows.length ? store.get(bookingId) : null
    },
    async removePayment(paymentId) {
      if (!UUID_RE.test(paymentId)) return null
      await ensureSchema()
      const rows = (await sql`DELETE FROM payments WHERE id = ${paymentId} RETURNING booking_id`) as { booking_id: string }[]
      return rows.length ? store.get(rows[0].booking_id) : null
    },
    async remove(id) {
      if (!UUID_RE.test(id)) return false
      await ensureSchema()
      const rows = (await sql`DELETE FROM agenda WHERE id = ${id} AND kind = 'block' RETURNING id`) as { id: string }[]
      return rows.length > 0
    },
    async countActiveForClient(whatsapp, now) {
      await ensureSchema()
      const rows = (await sql`
        SELECT count(*)::int AS total FROM agenda
        WHERE client_whatsapp = ${whatsapp} AND status IN ('pending', 'confirmed') AND ends_at > ${iso(now)}`) as {
        total: number
      }[]
      return rows[0]?.total ?? 0
    },
    async listDueReminders(from, to) {
      await ensureSchema()
      const rows = (await sql`
        SELECT a.*, COALESCE((SELECT json_agg(p) FROM payments p WHERE p.booking_id = a.id), '[]'::json) AS payments
        FROM agenda a
        WHERE a.kind = 'booking' AND a.status = 'confirmed' AND a.reminder_sent_at IS NULL
          AND starts_at >= ${iso(from)} AND starts_at < ${iso(to)}
        ORDER BY starts_at ASC`) as Row[]
      return rows.map(fromRow)
    },
    async markReminded(id) {
      await ensureSchema()
      await sql`UPDATE agenda SET reminder_sent_at = now() WHERE id = ${id}`
    },
    async setGoogleEventId(id, eventId) {
      await ensureSchema()
      await sql`UPDATE agenda SET google_event_id = ${eventId} WHERE id = ${id}`
    },
  }
  return store
}

/* ── Memoria (solo desarrollo local, se borra al reiniciar) ─────── */

function memoryStore(): AgendaStore {
  const items: AgendaItem[] = []
  const active = (i: AgendaItem) => i.status === 'pending' || i.status === 'confirmed'
  const overlaps = (startsAt: number, until: number, exceptId?: string) =>
    items.some((i) => i.id !== exceptId && active(i) && startsAt < i.blockedUntil && i.startsAt < until)

  const insert = (values: NewBooking | NewBlock, kind: 'booking' | 'block'): AgendaItem => {
    const b = kind === 'booking' ? (values as NewBooking) : null
    const status = b ? b.status : 'confirmed'
    const blockedUntil = b ? b.blockedUntil : values.endsAt
    if (overlaps(values.startsAt, blockedUntil)) throw new SlotTakenError()
    const now = Date.now()
    const item: AgendaItem = {
      id: crypto.randomUUID(),
      code: bookingCode(kind === 'block' ? 'BL' : 'TR'),
      kind,
      status,
      services: b ? [...b.services] : [],
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      blockedUntil,
      eventType: b?.eventType ?? null,
      locationType: b?.locationType ?? null,
      locationArea: b?.locationArea ?? null,
      clientName: b?.clientName ?? null,
      clientWhatsapp: b?.clientWhatsapp ?? null,
      clientEmail: b?.clientEmail ?? null,
      notes: values.notes,
      guardianConsent: b?.guardianConsent ?? null,
      googleEventId: null,
      createdAt: now,
      confirmedAt: status === 'confirmed' ? now : null,
      cancelledAt: null,
      reminderSentAt: null,
      price: null,
      cancelReason: null,
      payments: [],
      source: b?.source ?? 'web',
    }
    items.push(item)
    return item
  }

  const find = (id: string) => items.find((i) => i.id === id)

  return {
    kind: 'memory',
    listBusy: async (from, to) =>
      items.filter((i) => active(i) && i.startsAt < to && i.blockedUntil > from).map((i) => ({ start: i.startsAt, end: i.blockedUntil })),
    insertBooking: async (booking) => insert(booking, 'booking'),
    insertBlock: async (block) => insert(block, 'block'),
    list: async (from, to, includeCancelled) =>
      items
        .filter((i) => i.startsAt < to && i.blockedUntil > from && (includeCancelled || i.status !== 'cancelled'))
        .sort((a, b) => a.startsAt - b.startsAt),
    get: async (id) => find(id) ?? null,
    confirm: async (id) => {
      const item = find(id)
      if (!item || item.status !== 'pending') return null
      item.status = 'confirmed'
      item.confirmedAt = Date.now()
      return item
    },
    cancel: async (id, reason) => {
      const item = find(id)
      if (!item || !active(item)) return null
      item.status = 'cancelled'
      item.cancelledAt = Date.now()
      item.cancelReason = reason
      return item
    },
    reschedule: async (id, startsAt, endsAt, blockedUntil) => {
      const item = find(id)
      if (!item || item.kind !== 'booking' || !active(item)) return null
      if (overlaps(startsAt, blockedUntil, id)) throw new SlotTakenError()
      Object.assign(item, { startsAt, endsAt, blockedUntil, reminderSentAt: null })
      return item
    },
    setPrice: async (id, price) => {
      const item = find(id)
      if (!item || item.kind !== 'booking') return null
      item.price = price
      return item
    },
    addPayment: async (bookingId, p) => {
      const item = find(bookingId)
      if (!item || item.kind !== 'booking') return null
      item.payments = [...item.payments, { id: crypto.randomUUID(), bookingId, ...p, createdAt: Date.now() }].sort(
        (a, b) => a.paidAt - b.paidAt,
      )
      return item
    },
    removePayment: async (paymentId) => {
      const item = items.find((i) => i.payments.some((p) => p.id === paymentId))
      if (!item) return null
      item.payments = item.payments.filter((p) => p.id !== paymentId)
      return item
    },
    remove: async (id) => {
      const index = items.findIndex((i) => i.id === id && i.kind === 'block')
      if (index < 0) return false
      items.splice(index, 1)
      return true
    },
    countActiveForClient: async (whatsapp, now) =>
      items.filter((i) => i.clientWhatsapp === whatsapp && active(i) && i.endsAt > now).length,
    listDueReminders: async (from, to) =>
      items
        .filter((i) => i.kind === 'booking' && i.status === 'confirmed' && !i.reminderSentAt && i.startsAt >= from && i.startsAt < to)
        .sort((a, b) => a.startsAt - b.startsAt),
    markReminded: async (id) => {
      const item = find(id)
      if (item) item.reminderSentAt = Date.now()
    },
    setGoogleEventId: async (id, eventId) => {
      const item = find(id)
      if (item) item.googleEventId = eventId
    },
  }
}

let cached: AgendaStore | null | undefined

/**
 * Postgres si hay DATABASE_URL; memoria en desarrollo; `null` en producción sin base
 * de datos (la web pasa entonces al modo de solicitud por WhatsApp).
 */
export function getStore(): AgendaStore | null {
  if (cached !== undefined) return cached
  const url = env.databaseUrl
  if (url) cached = postgresStore(url)
  else if (!env.isProduction) {
    console.warn('[agenda] Sin DATABASE_URL: usando memoria local (solo para desarrollo).')
    cached = memoryStore()
  } else cached = null
  return cached
}
