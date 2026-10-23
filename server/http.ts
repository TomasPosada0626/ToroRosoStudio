import type { ApiError, ApiErrorCode } from '../shared/types.js'
import type { FieldErrors } from '../shared/validation.js'

const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...BASE_HEADERS, ...headers } })
}

export function fail(code: ApiErrorCode, error: string, status: number, fields?: FieldErrors): Response {
  const body: ApiError = { ok: false, code, error, ...(fields ? { fields } : {}) }
  return json(body, status)
}

/** Lee un cuerpo JSON pequeño; devuelve null si no es válido o es demasiado grande. */
export async function readJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  try {
    const text = await request.text()
    if (!text || text.length > maxBytes) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** Las peticiones que modifican datos deben venir del propio sitio. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  )
}

/* Límite de peticiones en memoria. Es de mejor esfuerzo (cada instancia serverless tiene
   su propia memoria), suficiente para frenar abusos básicos sin servicios extra. */
const hits = new Map<string, number[]>()

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  const limited = recent.length >= limit
  if (!limited) recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5_000) hits.clear()
  return limited
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Ejecuta una promesa con tiempo máximo; si se excede, devuelve `fallback`. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}
