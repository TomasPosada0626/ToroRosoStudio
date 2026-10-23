import { useEffect, useState } from 'react'
import type { ServiceId } from '../../../shared/booking-rules'
import { ApiRequestError, api } from '../../lib/api'

export type AvailabilityStatus = 'idle' | 'loading' | 'ready' | 'error' | 'offline'

const TTL_MS = 45_000
const cache = new Map<string, { at: number; data: unknown }>()

/** Olvida la disponibilidad guardada (tras agendar o si un horario se ocupó). */
export function invalidateAvailability() {
  cache.clear()
}

function useAvailability<T>(key: string | null, enabled: boolean, load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ status: AvailabilityStatus; data: T | null; error: string | null }>({
    status: 'idle',
    data: null,
    error: null,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!enabled || !key) return
    const cached = cache.get(key)
    if (cached && Date.now() - cached.at < TTL_MS) {
      setState({ status: 'ready', data: cached.data as T, error: null })
      return
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading', error: null }))
    load(controller.signal)
      .then((data) => {
        cache.set(key, { at: Date.now(), data })
        setState({ status: 'ready', data, error: null })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof ApiRequestError && error.code === 'NOT_CONFIGURED') {
          setState({ status: 'offline', data: null, error: null })
          return
        }
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'No pudimos consultar la agenda.',
        })
      })
    return () => controller.abort()
    // `load` cambia en cada render; la clave ya identifica la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, nonce])

  const retry = () => {
    if (key) cache.delete(key)
    setNonce((n) => n + 1)
  }
  return { ...state, retry }
}

/** Horarios libres por día del mes (`month` = "AAAA-MM"). */
export function useMonthAvailability(services: ServiceId[] | null, month: string, enabled: boolean) {
  const key = services ? `month|${services.join(',')}|${month}` : null
  const result = useAvailability(key, enabled, async (signal) => {
    const response = await api.monthAvailability(services ?? [], month, signal)
    return response.days
  })
  return { status: result.status, days: result.data, error: result.error, retry: result.retry }
}

/** Horarios libres de una fecha. */
export function useDaySlots(services: ServiceId[] | null, date: string | null, enabled: boolean) {
  const key = services && date ? `day|${services.join(',')}|${date}` : null
  const result = useAvailability(key, enabled, async (signal) => {
    const response = await api.dayAvailability(services ?? [], date ?? '', signal)
    return response.slots
  })
  return { status: result.status, slots: result.data, error: result.error, retry: result.retry }
}
