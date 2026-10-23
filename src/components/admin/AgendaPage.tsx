import { useMemo, useState, type FormEvent } from 'react'
import { SERVICE_NAMES, describeServices } from '../../../shared/booking-rules'
import {
  addDays,
  capitalize,
  daysInMonth,
  formatDateLong,
  formatMonthName,
  formatTime,
  toDateKey,
  todayLocal,
  utcToLocal,
  weekdayOf,
} from '../../../shared/time'
import type { AgendaItem } from '../../../shared/types'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { Ban, Calendar, Check, ChevronLeft, ChevronRight, Clock, Inbox, Lock, MapPin, Plus, Wallet } from '../ui/Icons'
import { ServiceGlyph } from '../ui/ServiceIcon'
import { CancelForm, useBookingActions } from './actions'
import { NewBookingForm } from './BookingForms'
import { useAdminData } from './AdminData'
import { ago, firstName, isActive, isBooking, needsDeposit, shortTime, timeRange, viewStatus } from './model'
import { Card, EmptyState, Kpi, SectionTitle, Sheet, StatusPill, labelClass, useToast } from './ui'

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/** Días que ocupa una cita o bloqueo (los bloqueos pueden durar varios días). */
function daysOf(item: AgendaItem): string[] {
  const first = utcToLocal(item.startsAt).date
  if (item.kind === 'booking') return [first]
  const last = utcToLocal(item.endsAt - 1).date
  const days: string[] = []
  for (let d = first; d <= last && days.length < 62; d = addDays(d, 1)) days.push(d)
  return days
}

export function AgendaPage() {
  const { items, open } = useAdminData()
  const today = todayLocal()
  const now = Date.now()
  const [selected, setSelected] = useState(today)
  const [blockDate, setBlockDate] = useState<string | null>(null)
  const [newDate, setNewDate] = useState<string | null>(null)

  const live = useMemo(() => items.filter(isActive), [items])
  const pending = useMemo(() => live.filter((i) => i.status === 'pending').sort((a, b) => a.startsAt - b.startsAt), [live])
  const upcoming = useMemo(
    () => live.filter((i) => isBooking(i) && i.status === 'confirmed' && i.endsAt >= now).slice(0, 6),
    [live, now],
  )
  const weekEnd = new Date(now + 7 * 86_400_000).getTime()
  const todayCount = live.filter((i) => isBooking(i) && utcToLocal(i.startsAt).date === today).length
  const weekCount = live.filter((i) => isBooking(i) && i.status === 'confirmed' && i.startsAt >= now && i.startsAt < weekEnd).length
  const deposits = items.filter((i) => needsDeposit(i) && i.endsAt >= now).length

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaItem[]>()
    for (const item of live) for (const day of daysOf(item)) map.set(day, [...(map.get(day) ?? []), item])
    return map
  }, [live])

  return (
    <div className="flex flex-col gap-10">
      <div className="-mt-4 flex flex-wrap gap-3 md:-mt-6">
        <Button size="sm" onClick={() => setNewDate(today)}>
          <Plus className="size-4" /> Nueva cita
        </Button>
        <span className="self-center text-xs text-smoke">Para clientas que te escriben por WhatsApp o Instagram.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={Inbox}
          label="Por confirmar"
          value={pending.length}
          hint={pending.length ? 'Toca para revisarlas' : 'Todo al día'}
          highlight={pending.length > 0}
          onClick={pending.length ? () => document.getElementById('solicitudes')?.scrollIntoView({ behavior: 'smooth' }) : undefined}
        />
        <Kpi icon={Clock} label="Hoy" value={todayCount} hint={todayCount === 1 ? 'cita en la agenda' : 'citas en la agenda'} />
        <Kpi icon={Calendar} label="Próximos 7 días" value={weekCount} hint="citas confirmadas" />
        <Kpi icon={Wallet} label="Anticipos pendientes" value={deposits} hint="citas confirmadas sin anticipo" highlight={deposits > 0} />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section id="solicitudes" className="scroll-mt-28 xl:col-span-7">
          <SectionTitle
            title="Solicitudes por confirmar"
            hint="El horario ya está apartado mientras decides. Al confirmar o rechazar, la clienta recibe el correo."
          />
          {pending.length === 0 ? (
            <EmptyState title="Todo al día" text="No hay solicitudes nuevas. Te llegará un correo cuando alguien agende." />
          ) : (
            <div className="flex flex-col gap-4">
              {pending.map((item) => (
                <RequestCard key={item.id} item={item} onOpen={() => open(item.id)} />
              ))}
            </div>
          )}
        </section>

        <section className="xl:col-span-5">
          <SectionTitle title="Próximas citas" hint="Confirmadas, en orden." />
          {upcoming.length === 0 ? (
            <EmptyState title="Agenda libre" text="Aún no hay citas confirmadas próximas." />
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((item) => (
                <li key={item.id}>
                  <ItemRow item={item} onOpen={() => open(item.id)} showDate />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <SectionTitle
          title="Calendario"
          hint="Toca un día para ver sus citas o bloquearlo."
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setNewDate(selected)}>
                <Plus className="size-4" /> Nueva cita
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBlockDate(selected >= today ? selected : today)}>
                <Lock className="size-4" /> Bloquear horario
              </Button>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <MonthCalendar className="lg:col-span-8" byDay={byDay} selected={selected} onSelect={setSelected} />
          <DayPanel
            className="lg:col-span-4"
            date={selected}
            items={byDay.get(selected) ?? []}
            onOpen={(id) => open(id)}
            onBlock={() => setBlockDate(selected)}
            onNew={() => setNewDate(selected)}
          />
        </div>
      </section>

      <Sheet open={blockDate !== null} onClose={() => setBlockDate(null)} title="Bloquear horario">
        {blockDate && <BlockForm key={blockDate} initialDate={blockDate} onDone={() => setBlockDate(null)} />}
      </Sheet>
      <Sheet open={newDate !== null} onClose={() => setNewDate(null)} title="Nueva cita" wide>
        {newDate && (
          <NewBookingForm
            key={newDate}
            initialDate={newDate}
            onDone={(item) => {
              setNewDate(null)
              setSelected(utcToLocal(item.startsAt).date)
              open(item.id)
            }}
          />
        )}
      </Sheet>
    </div>
  )
}

function RequestCard({ item, onOpen }: { item: AgendaItem; onOpen: () => void }) {
  const { confirm } = useBookingActions()
  const [mode, setMode] = useState<'idle' | 'reject'>('idle')
  const [busy, setBusy] = useState(false)
  const start = utcToLocal(item.startsAt)
  return (
    <article className="rounded-3xl border border-rose/60 bg-rose/[0.07] p-5 shadow-[0_0_50px_-30px_rgba(217,177,198,0.9)] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl leading-tight text-pearl md:text-2xl">{capitalize(formatDateLong(start.date))}</p>
          <p className="mt-1 text-pearl/85">{timeRange(item)}</p>
        </div>
        <span className="text-xs text-smoke">Llegó {ago(item.createdAt)}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.services.map((s, i) => (
          <span key={i} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-pearl/90">
            <ServiceGlyph id={s} className="size-4 text-rose" /> {SERVICE_NAMES[s]}
          </span>
        ))}
      </div>
      <p className="mt-4 text-pearl">
        <span className="font-medium">{item.clientName}</span> <span className="text-smoke">· {item.eventType}</span>
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-pearl/80">
        <MapPin className="size-4 shrink-0 text-rose" /> {item.locationArea}
      </p>
      {item.guardianConsent && (
        <p className="mt-1 flex items-center gap-2 text-sm text-pearl/80">
          <Check className="size-4 text-rose" /> Autorización del acudiente confirmada
        </p>
      )}
      {item.notes && <p className="mt-3 line-clamp-3 rounded-2xl bg-noir/50 px-4 py-3 text-sm text-pearl/80">“{item.notes}”</p>}

      {mode === 'reject' ? (
        <div className="mt-5">
          <CancelForm item={item} onDone={() => setMode('idle')} onBack={() => setMode('idle')} />
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await confirm(item)
              setBusy(false)
            }}
          >
            <Check className="size-4" /> {busy ? 'Confirmando…' : 'Confirmar'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode('reject')}>
            <Ban className="size-4" /> Rechazar
          </Button>
          <button type="button" onClick={onOpen} className="ml-auto text-[0.6875rem] tracking-[0.2em] text-rose uppercase hover:text-rose-light">
            Ver detalle
          </button>
        </div>
      )}
    </article>
  )
}

/** Fila compacta de una cita o bloqueo. */
function ItemRow({ item, onOpen, showDate = false }: { item: AgendaItem; onOpen: () => void; showDate?: boolean }) {
  const start = utcToLocal(item.startsAt)
  const isBlock = item.kind === 'block'
  const allDay = isBlock && start.time === '00:00' && utcToLocal(item.endsAt).time === '00:00'
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition hover:border-rose/60',
        isBlock ? 'border-dashed border-rose/30' : 'border-line bg-plum-900/30',
      )}
    >
      <span className="w-[4.75rem] shrink-0 text-center whitespace-nowrap">
        {showDate && <span className="block text-[0.6875rem] tracking-[0.12em] text-rose uppercase">{formatDateLong(start.date).split(',')[0].slice(0, 3)} {Number(start.date.slice(8))}</span>}
        <span className="block font-display text-sm text-pearl">{allDay ? 'Todo el día' : formatTime(start.time)}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-pearl">{isBlock ? item.notes || 'Horario bloqueado' : item.clientName}</span>
        <span className="block truncate text-xs text-smoke">{isBlock ? 'Bloqueo' : describeServices(item.services)}</span>
      </span>
      {!isBlock && <StatusPill status={viewStatus(item)} className="hidden sm:inline-flex" />}
    </button>
  )
}

function MonthCalendar({
  byDay,
  selected,
  onSelect,
  className,
}: {
  byDay: Map<string, AgendaItem[]>
  selected: string
  onSelect: (date: string) => void
  className?: string
}) {
  const today = todayLocal()
  const [month, setMonth] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) })
  const total = daysInMonth(month.year, month.month)
  const first = toDateKey(month.year, month.month, 1)
  const cells = [...Array.from({ length: weekdayOf(first) }, () => null), ...Array.from({ length: total }, (_, i) => toDateKey(month.year, month.month, i + 1))]
  const shift = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const index = year * 12 + (m - 1) + delta
      return { year: Math.floor(index / 12), month: (index % 12) + 1 }
    })

  return (
    <Card className={cn('p-3 md:p-5', className)}>
      <div className="flex items-center justify-between gap-3 px-1">
        <button type="button" aria-label="Mes anterior" onClick={() => shift(-1)} className="grid size-10 place-items-center rounded-full border border-rose/30 text-pearl hover:border-rose">
          <ChevronLeft className="size-4" />
        </button>
        <p className="flex items-baseline gap-2 font-display text-lg tracking-[0.1em] text-pearl uppercase" aria-live="polite">
          {capitalize(formatMonthName(month.month))} <span className="font-sans text-xs tracking-[0.24em] text-rose">{month.year}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMonth({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) })
              onSelect(today)
            }}
            className="hidden rounded-full border border-rose/30 px-3 py-2 text-[0.6875rem] tracking-[0.16em] text-pearl uppercase hover:border-rose sm:block"
          >
            Hoy
          </button>
          <button type="button" aria-label="Mes siguiente" onClick={() => shift(1)} className="grid size-10 place-items-center rounded-full border border-rose/30 text-pearl hover:border-rose">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.6875rem] tracking-[0.2em] text-rose/80" aria-hidden>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`b${i}`} />
          const list = byDay.get(date) ?? []
          const bookings = list.filter(isBooking)
          const hasPending = bookings.some((b) => b.status === 'pending')
          const blocked = list.some((b) => b.kind === 'block')
          const isSelected = date === selected
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={`${formatDateLong(date)}: ${bookings.length ? `${bookings.length} cita${bookings.length > 1 ? 's' : ''}` : 'sin citas'}${hasPending ? ', con solicitudes por confirmar' : ''}${blocked ? ', con bloqueo' : ''}`}
              className={cn(
                'relative flex min-h-14 flex-col items-stretch rounded-xl border p-1 text-left transition md:min-h-24 md:p-1.5',
                isSelected ? 'border-rose bg-rose/12' : 'border-transparent hover:border-rose/30 hover:bg-plum-900/50',
                date < today && 'opacity-55',
                blocked && 'bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(183,131,157,0.08)_6px,rgba(183,131,157,0.08)_12px)]',
              )}
            >
              <span
                className={cn(
                  'grid size-6 place-items-center self-center rounded-full text-xs md:self-start',
                  date === today ? 'bg-metal font-medium text-noir' : 'text-pearl/85',
                )}
              >
                {Number(date.slice(8))}
              </span>
              {/* Celular: puntos. Computador: hora y nombre. */}
              <span className="mt-1 flex flex-wrap justify-center gap-0.5 md:hidden">
                {bookings.slice(0, 4).map((b) => (
                  <span key={b.id} className={cn('size-1.5 rounded-full', b.status === 'pending' ? 'border border-rose' : 'bg-rose')} />
                ))}
              </span>
              <span className="mt-1 hidden flex-col gap-0.5 md:flex">
                {bookings.slice(0, 3).map((b) => (
                  <span
                    key={b.id}
                    className={cn(
                      'truncate rounded-md px-1.5 py-0.5 text-[0.6875rem] leading-tight',
                      b.status === 'pending' ? 'border border-rose/70 text-rose-light' : 'bg-rose/20 text-pearl',
                    )}
                  >
                    {shortTime(utcToLocal(b.startsAt).time)} {firstName(b)}
                  </span>
                ))}
                {bookings.length > 3 && <span className="px-1.5 text-[0.6875rem] text-smoke">+{bookings.length - 3} más</span>}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 px-1 text-xs text-smoke">
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-rose" /> Confirmada</span>
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full border border-rose" /> Por confirmar</span>
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm border border-dashed border-rose" /> Bloqueado</span>
      </div>
    </Card>
  )
}

function DayPanel({
  date,
  items,
  onOpen,
  onBlock,
  onNew,
  className,
}: {
  date: string
  items: AgendaItem[]
  onOpen: (id: string) => void
  onBlock: () => void
  onNew: () => void
  className?: string
}) {
  const past = date < todayLocal()
  return (
    <Card className={cn('flex flex-col', className)}>
      <p className={labelClass}>{date === todayLocal() ? 'Hoy' : 'Día seleccionado'}</p>
      <p className="mt-2 font-display text-xl leading-tight text-pearl">{capitalize(formatDateLong(date))}</p>
      <div className="mt-5 flex flex-1 flex-col gap-2">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-rose/25 px-4 py-8 text-center text-sm text-smoke">Día libre</p>
        ) : (
          items.map((item) => <ItemRow key={item.id} item={item} onOpen={() => onOpen(item.id)} />)
        )}
      </div>
      <div className="mt-5 grid gap-2">
        <Button size="sm" onClick={onNew}>
          <Plus className="size-4" /> {past ? 'Registrar cita de este día' : 'Agendar cita este día'}
        </Button>
        {!past && (
          <Button size="sm" variant="outline" onClick={onBlock}>
            <Lock className="size-4" /> Bloquear este día u horas
          </Button>
        )}
      </div>
    </Card>
  )
}

function BlockForm({ initialDate, onDone }: { initialDate: string; onDone: () => void }) {
  const { upsert } = useAdminData()
  const toast = useToast()
  const today = todayLocal()
  const [date, setDate] = useState(initialDate)
  const [dateTo, setDateTo] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [from, setFrom] = useState('08:00')
  const [to, setTo] = useState('12:00')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await api.admin.block({ date, dateTo: dateTo || undefined, allDay, from, to, reason })
      upsert({ ...response.item, payments: response.item.payments ?? [] })
      toast('Horario bloqueado: las clientas ya no lo verán disponible.')
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo bloquear el horario.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <p className="leading-relaxed text-smoke">
        Para vacaciones, compromisos personales o servicios que agendaste por fuera de la web. Las clientas no verán esos horarios.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>Desde</span>
          <input type="date" className="field" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>Hasta (opcional)</span>
          <input type="date" className="field" min={date} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm text-pearl">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-4 accent-rose" />
        Bloquear el día completo
      </label>
      {!allDay && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2.5">
            <span className={labelClass}>Hora inicial</span>
            <input type="time" step={1800} className="field" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-2.5">
            <span className={labelClass}>Hora final</span>
            <input type="time" step={1800} className="field" value={to} onChange={(e) => setTo(e.target.value)} required />
          </label>
        </div>
      )}
      <label className="flex flex-col gap-2.5">
        <span className={labelClass}>Motivo (solo lo ves tú)</span>
        <input className="field" maxLength={140} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: vacaciones, cita agendada por Instagram" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-[#f0a3bb]">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? 'Bloqueando…' : 'Bloquear horario'}
      </Button>
    </form>
  )
}
