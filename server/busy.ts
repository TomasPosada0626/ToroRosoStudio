import type { BusyInterval } from '../shared/availability.js'
import { googleBusy } from './google-calendar.js'
import type { AgendaStore } from './store.js'

/** Horarios ocupados: citas y bloqueos de la agenda + compromisos del Google Calendar de Manuela (si está conectado). */
export async function busyBetween(store: AgendaStore, from: number, to: number): Promise<BusyInterval[]> {
  const [own, google] = await Promise.all([store.listBusy(from, to), googleBusy(from, to)])
  return google.length ? [...own, ...google] : own
}
