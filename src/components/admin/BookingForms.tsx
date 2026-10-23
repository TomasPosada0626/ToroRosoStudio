import { useMemo, useState, type FormEvent } from 'react'
import { BOOKING_RULES, SERVICE_IDS, SERVICE_NAMES, totalDurationMinutes, type ServiceId } from '../../../shared/booking-rules'
import { capitalize, formatDateLong, formatDuration, formatTime, localToUtc, minutesOf, timeOf, todayLocal, utcToLocal } from '../../../shared/time'
import type { AgendaItem } from '../../../shared/types'
import { LOCATION_LABELS, LOCATION_TYPES, type LocationType } from '../../../shared/validation'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { Close, Plus } from '../ui/Icons'
import { useAdminData } from './AdminData'
import { firstName, isActive } from './model'
import { MoneyInput, labelClass, useToast } from './ui'

/*
 * Formularios del panel para agendar a mano y reprogramar. Manuela puede elegir cualquier hora
 * (incluso fuera del horario de la web o una fecha pasada para registrarla); solo se evita que
 * una cita se cruce con otra, contando el tiempo de movilización.
 */

const FIRST = minutesOf('06:00')
const LAST = minutesOf('21:00')
const HOURS = BOOKING_RULES.weeklyHours[0]

/** Horas de inicio para una sesión de `durationMs` en `date`, marcando las que chocan con otras citas. */
function useTimeOptions(date: string, durationMs: number, excludeId?: string) {
  const { items } = useAdminData()
  return useMemo(() => {
    const busy = items.filter((i) => isActive(i) && i.id !== excludeId)
    const buffer = BOOKING_RULES.bufferAfterMinutes * 60_000
    const options: { time: string; clash: AgendaItem | null; outside: boolean }[] = []
    for (let t = FIRST; t <= LAST; t += BOOKING_RULES.slotStepMinutes) {
      const time = timeOf(t)
      const start = localToUtc(date, time).getTime()
      const until = start + durationMs + buffer
      const clash = busy.find((i) => start < i.blockedUntil && i.startsAt < until) ?? null
      const outside = HOURS
        ? t < minutesOf(HOURS.firstStart) || t > minutesOf(HOURS.lastStart) || t + durationMs / 60_000 > minutesOf(HOURS.latestEnd)
        : false
      options.push({ time, clash, outside })
    }
    return options
  }, [items, date, durationMs, excludeId])
}

function TimePicker({
  date,
  durationMs,
  value,
  onChange,
  excludeId,
}: {
  date: string
  durationMs: number
  value: string | null
  onChange: (time: string) => void
  excludeId?: string
}) {
  const options = useTimeOptions(date, durationMs, excludeId)
  const free = options.filter((o) => !o.clash)
  return (
    <div>
      {free.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rose/30 px-4 py-6 text-center text-sm text-smoke">
          Ese día no hay espacio para una sesión de {formatDuration(durationMs / 60_000)}. Prueba otra fecha.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Hora de inicio">
          {options.map((o) => (
            <button
              key={o.time}
              type="button"
              role="radio"
              aria-checked={value === o.time}
              disabled={Boolean(o.clash)}
              title={o.clash ? `Se cruza con ${o.clash.kind === 'block' ? 'un bloqueo' : `la cita de ${firstName(o.clash)}`}` : undefined}
              onClick={() => onChange(o.time)}
              className={cn(
                'rounded-xl border px-1 py-2.5 text-xs tabular-nums transition',
                o.clash && 'cursor-not-allowed border-transparent text-smoke/35 line-through',
                !o.clash && value === o.time && 'bg-metal border-transparent font-medium text-noir',
                !o.clash && value !== o.time && (o.outside ? 'border-dashed border-rose/25 text-pearl/60' : 'border-rose/30 text-pearl hover:border-rose'),
              )}
            >
              {formatTime(o.time).replace(/\s?([ap])\.\s?m\./, '$1m')}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-smoke">
        Tachadas: se cruzan con otra cita (contando 2 h de movilización). Punteadas: fuera del horario de la web, pero puedes usarlas.
      </p>
      {value && (
        <p className="mt-2 text-sm text-pearl">
          {formatTime(value)} – {formatTime(utcToLocal(localToUtc(date, value).getTime() + durationMs).time)}
        </p>
      )}
    </div>
  )
}

/* ── Nueva cita a mano ─────────────────────────────────────────── */

export function NewBookingForm({ initialDate, onDone }: { initialDate: string; onDone: (item: AgendaItem) => void }) {
  const { upsert } = useAdminData()
  const toast = useToast()
  const [services, setServices] = useState<ServiceId[]>(['social'])
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [eventType, setEventType] = useState('')
  const [locationType, setLocationType] = useState<LocationType>('domicilio')
  const [locationArea, setLocationArea] = useState('')
  const [notes, setNotes] = useState('')
  const [price, setPrice] = useState<number | null>(null)
  const [notify, setNotify] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const durationMs = totalDurationMinutes(services) * 60_000

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!time) return setError('Elige la hora de inicio.')
    setBusy(true)
    setError(null)
    try {
      const response = await api.admin.createBooking({
        services,
        date,
        time,
        name,
        whatsapp,
        email: email.trim() || undefined,
        eventType,
        locationType,
        locationArea,
        notes,
        price,
        notifyClient: Boolean(email.trim()) && notify,
      })
      upsert(response.item)
      toast(`Cita de ${firstName(response.item)} agendada${response.notified ? ' y confirmación enviada por correo' : ''}.`)
      onDone(response.item)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agendar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-7">
      <p className="text-sm leading-relaxed text-smoke">
        Para clientas que te escriben por WhatsApp o Instagram. La cita queda confirmada, bloquea la agenda y entra al historial y a
        las cuentas.
      </p>

      <fieldset className="grid gap-3">
        <legend className={labelClass}>Servicio de cada persona</legend>
        {services.map((service, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs text-smoke">Persona {index + 1}</span>
            <select
              className="field"
              value={service}
              onChange={(e) => {
                setServices(services.map((s, i) => (i === index ? (e.target.value as ServiceId) : s)))
                setTime(null)
              }}
              aria-label={`Servicio de la persona ${index + 1}`}
            >
              {SERVICE_IDS.map((id) => (
                <option key={id} value={id}>
                  {SERVICE_NAMES[id]} · {formatDuration(BOOKING_RULES.serviceMinutes[id])}
                </option>
              ))}
            </select>
            {services.length > 1 && (
              <button
                type="button"
                aria-label={`Quitar persona ${index + 1}`}
                onClick={() => {
                  setServices(services.filter((_, i) => i !== index))
                  setTime(null)
                }}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-rose/30 text-smoke hover:text-pearl"
              >
                <Close className="size-4" />
              </button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setServices([...services, 'social'])
              setTime(null)
            }}
            className="inline-flex items-center gap-2 text-[0.6875rem] tracking-[0.2em] text-rose uppercase hover:text-rose-light"
          >
            <Plus className="size-4" /> Agregar persona
          </button>
          <span className="text-sm text-pearl/85">Duración: {formatDuration(durationMs / 60_000)}</span>
        </div>
      </fieldset>

      <label className="flex flex-col gap-2.5">
        <span className={labelClass}>Fecha</span>
        <input
          type="date"
          className="field"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setTime(null)
          }}
          required
        />
        {date < todayLocal() && <span className="text-xs text-smoke">Fecha pasada: sirve para registrar un servicio que ya hiciste.</span>}
      </label>

      <div className="grid gap-2.5">
        <span className={labelClass}>Hora de inicio · {capitalize(formatDateLong(date))}</span>
        <TimePicker date={date} durationMs={durationMs} value={time} onChange={setTime} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>Nombre de la clienta</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="off" />
        </label>
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>WhatsApp</span>
          <input className="field" type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="300 123 4567" required />
        </label>
        <label className="flex flex-col gap-2.5 sm:col-span-2">
          <span className={labelClass}>Correo (opcional)</span>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
        </label>
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>Tipo de evento (opcional)</span>
          <input className="field" value={eventType} onChange={(e) => setEventType(e.target.value)} maxLength={60} placeholder="Ej.: boda, quince, grado" />
        </label>
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>Valor del servicio (opcional)</span>
          <MoneyInput value={price} onChange={setPrice} />
        </label>
      </div>

      <div className="grid gap-3">
        <span className={labelClass}>Lugar</span>
        <div className="flex flex-wrap gap-2">
          {LOCATION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setLocationType(t)}
              aria-pressed={locationType === t}
              className={cn(
                'rounded-full border px-4 py-2 text-xs transition',
                locationType === t ? 'border-rose bg-rose/15 text-pearl' : 'border-line text-smoke hover:text-pearl',
              )}
            >
              {LOCATION_LABELS[t]}
            </button>
          ))}
        </div>
        <input className="field" value={locationArea} onChange={(e) => setLocationArea(e.target.value)} maxLength={80} placeholder="Municipio y barrio" />
      </div>

      <label className="flex flex-col gap-2.5">
        <span className={labelClass}>Notas (opcional)</span>
        <textarea className="field min-h-20 resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={600} />
      </label>

      {email.trim() && (
        <label className="flex items-center gap-3 text-sm text-pearl">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-rose" />
          Enviarle la confirmación por correo
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm text-[#f0a3bb]">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !time}>
        {busy ? 'Agendando…' : 'Agendar cita'}
      </Button>
    </form>
  )
}

/* ── Reprogramar ───────────────────────────────────────────────── */

export function RescheduleForm({ item, onDone, onBack }: { item: AgendaItem; onDone: () => void; onBack: () => void }) {
  const { upsert } = useAdminData()
  const toast = useToast()
  const current = utcToLocal(item.startsAt)
  const [date, setDate] = useState(current.date)
  const [time, setTime] = useState<string | null>(null)
  const [notify, setNotify] = useState(Boolean(item.clientEmail))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const durationMs = item.endsAt - item.startsAt

  const save = async () => {
    if (!time) return
    setBusy(true)
    setError(null)
    try {
      const response = await api.admin.reschedule(item.id, date, time, notify)
      upsert(response.item)
      toast(`Cita reprogramada para el ${formatDateLong(date)}, ${formatTime(time)}${response.notified ? '. Le avisamos por correo.' : '.'}`)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reprogramar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5 rounded-2xl border border-rose/35 bg-rose/5 p-4">
      <p className="text-sm text-pearl/85">
        Ahora: {capitalize(formatDateLong(current.date))}, {formatTime(current.time)}. Elige el nuevo día y la hora.
      </p>
      <label className="flex flex-col gap-2.5">
        <span className={labelClass}>Nueva fecha</span>
        <input
          type="date"
          className="field"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setTime(null)
          }}
        />
      </label>
      <TimePicker date={date} durationMs={durationMs} value={time} onChange={setTime} excludeId={item.id} />
      {item.clientEmail ? (
        <label className="flex items-center gap-3 text-sm text-pearl">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-rose" />
          Avisarle del cambio por correo
        </label>
      ) : (
        <p className="text-xs text-smoke">No dejó correo: avísale del cambio por WhatsApp.</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-[#f0a3bb]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={busy || !time} onClick={save}>
          {busy ? 'Guardando…' : 'Guardar nuevo horario'}
        </Button>
        <button type="button" onClick={onBack} className="text-[0.6875rem] tracking-[0.2em] text-smoke uppercase hover:text-pearl">
          Volver
        </button>
      </div>
    </div>
  )
}
