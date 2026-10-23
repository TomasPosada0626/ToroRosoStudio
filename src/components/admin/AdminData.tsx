import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { addDays, todayLocal } from '../../../shared/time'
import type { AgendaItem } from '../../../shared/types'
import { api } from '../../lib/api'

/*
 * Toda la agenda que usa el panel (3 años hacia atrás y 1 hacia adelante), cargada una vez
 * y compartida por las dos páginas. Cada acción devuelve la cita actualizada y se reemplaza aquí.
 */

interface AdminDataValue {
  items: AgendaItem[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
  reload: () => Promise<void>
  upsert: (item: AgendaItem) => void
  removeItem: (id: string) => void
  /** Cita abierta en el panel lateral. */
  openId: string | null
  open: (id: string | null) => void
}

const AdminDataContext = createContext<AdminDataValue | null>(null)

export function useAdminData(): AdminDataValue {
  const value = useContext(AdminDataContext)
  if (!value) throw new Error('useAdminData fuera de AdminDataProvider')
  return value
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AgendaItem[]>([])
  const [status, setStatus] = useState<AdminDataValue['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      const today = todayLocal()
      const response = await api.admin.agenda({ from: addDays(today, -3 * 365), to: addDays(today, 400), cancelled: true })
      setItems(response.items)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la agenda.')
      setStatus((s) => (s === 'ready' ? 'ready' : 'error'))
    }
  }, [])

  useEffect(() => {
    reload()
    // Se actualiza al volver a la pestaña (por si llegó una solicitud nueva).
    const onFocus = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [reload])

  const upsert = useCallback((item: AgendaItem) => {
    setItems((list) => {
      const exists = list.some((i) => i.id === item.id)
      const next = exists ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item]
      return next.sort((a, b) => a.startsAt - b.startsAt)
    })
  }, [])

  const removeItem = useCallback((id: string) => setItems((list) => list.filter((i) => i.id !== id)), [])

  const value = useMemo(
    () => ({ items, status, error, reload, upsert, removeItem, openId, open: setOpenId }),
    [items, status, error, reload, upsert, removeItem, openId],
  )
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}
