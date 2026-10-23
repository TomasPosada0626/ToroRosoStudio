import { useMemo, useState } from 'react'
import { describeServices } from '../../../shared/booking-rules'
import { PAYMENT_KINDS, billingOf, formatCOP } from '../../../shared/billing'
import { capitalize, formatDateLong, formatMonthName, todayLocal, utcToLocal } from '../../../shared/time'
import type { AgendaItem, Payment } from '../../../shared/types'
import { formatWhatsApp } from '../../../shared/validation'
import { cn } from '../../lib/cn'
import { Download, Search, TrendUp, User, Users, Wallet, WhatsAppIcon } from '../ui/Icons'
import { useAdminData } from './AdminData'
import {
  currentMonthKey,
  downloadCsv,
  groupClients,
  isBooking,
  monthKey,
  needsDeposit,
  STATUS_LABEL,
  viewStatus,
  waUrl,
  type ClientSummary,
} from './model'
import { Card, EmptyState, Kpi, Segmented, SectionTitle, Sheet, StatusPill } from './ui'

type View = 'servicios' | 'clientas' | 'pagos'
type Filter = 'todas' | 'pending' | 'confirmed' | 'done' | 'deposit' | 'balance' | 'cancelled'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pending', label: 'Por confirmar' },
  { value: 'confirmed', label: 'Próximas' },
  { value: 'done', label: 'Realizadas' },
  { value: 'deposit', label: 'Sin anticipo' },
  { value: 'balance', label: 'Con saldo' },
  { value: 'cancelled', label: 'Canceladas' },
]

const monthLabel = (key: string, short = false) => {
  const name = capitalize(formatMonthName(Number(key.slice(5, 7))))
  return short ? name.slice(0, 3) : `${name} ${key.slice(0, 4)}`
}
const shiftMonth = (key: string, delta: number) => {
  const index = Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1 + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}
const dateShort = (ms: number) => {
  const d = utcToLocal(ms).date
  return `${Number(d.slice(8))} ${formatMonthName(Number(d.slice(5, 7))).slice(0, 3)} ${d.slice(0, 4)}`
}

export function ClientsPage() {
  const { items, open } = useAdminData()
  const [view, setView] = useState<View>('servicios')
  const [month, setMonth] = useState<string>('todos')
  const [client, setClient] = useState<ClientSummary | null>(null)
  const now = Date.now()
  const thisMonth = currentMonthKey()
  const thisYear = todayLocal().slice(0, 4)

  const bookings = useMemo(() => items.filter(isBooking), [items])
  const payments = useMemo(
    () =>
      bookings
        .flatMap((b) => b.payments.map((p) => ({ payment: p, booking: b })))
        .sort((a, b) => b.payment.paidAt - a.payment.paidAt),
    [bookings],
  )
  const incomeByMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const { payment } of payments) map.set(monthKey(payment.paidAt), (map.get(monthKey(payment.paidAt)) ?? 0) + payment.amount)
    return map
  }, [payments])

  const income = incomeByMonth.get(thisMonth) ?? 0
  const previous = incomeByMonth.get(shiftMonth(thisMonth, -1)) ?? 0
  const yearIncome = [...incomeByMonth.entries()].filter(([k]) => k.startsWith(thisYear)).reduce((s, [, v]) => s + v, 0)
  const receivable = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (billingOf(b).balance ?? 0), 0)
  const doneThisYear = bookings.filter((b) => viewStatus(b, now) === 'done' && utcToLocal(b.startsAt).date.startsWith(thisYear)).length
  const clients = useMemo(() => groupClients(items, now), [items, now])
  const change = previous ? Math.round(((income - previous) / previous) * 100) : null

  const months = useMemo(() => {
    const keys = new Set<string>([thisMonth])
    for (const b of bookings) keys.add(monthKey(b.startsAt))
    for (const { payment } of payments) keys.add(monthKey(payment.paidAt))
    return [...keys].sort().reverse()
  }, [bookings, payments, thisMonth])

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={TrendUp}
          label={`Ingresos de ${formatMonthName(Number(thisMonth.slice(5)))}`}
          value={formatCOP(income)}
          hint={change === null ? 'Pagos recibidos este mes' : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)} % frente al mes anterior`}
        />
        <Kpi icon={Wallet} label={`Ingresos ${thisYear}`} value={formatCOP(yearIncome)} hint="Anticipos y saldos recibidos" />
        <Kpi icon={Wallet} label="Por cobrar" value={formatCOP(receivable)} hint="Saldos de citas confirmadas" highlight={receivable > 0} />
        <Kpi icon={Users} label="Clientas" value={clients.length} hint={`${doneThisYear} servicios realizados en ${thisYear}`} />
      </div>

      <IncomeChart incomeByMonth={incomeByMonth} selected={month} onSelect={(key) => setMonth((m) => (m === key ? 'todos' : key))} />

      <section>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Segmented
            label="Vista"
            value={view}
            onChange={setView}
            options={[
              { value: 'servicios', label: 'Servicios' },
              { value: 'clientas', label: 'Clientas' },
              { value: 'pagos', label: 'Pagos' },
            ]}
            className="w-full md:w-auto"
          />
          {view !== 'clientas' && (
            <select className="field md:max-w-60" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mes">
              <option value="todos">Todos los meses</option>
              {months.map((key) => (
                <option key={key} value={key}>
                  {monthLabel(key)}
                </option>
              ))}
            </select>
          )}
        </div>
        {view === 'servicios' && <ServicesTable bookings={bookings} month={month} onOpen={open} />}
        {view === 'clientas' && <ClientsTable clients={clients} onOpen={setClient} />}
        {view === 'pagos' && <PaymentsTable rows={payments} month={month} onOpen={open} />}
      </section>

      <Sheet open={client !== null} onClose={() => setClient(null)} title={client?.name ?? 'Clienta'}>
        {client && <ClientDetail client={client} onOpen={open} />}
      </Sheet>
    </div>
  )
}

function IncomeChart({
  incomeByMonth,
  selected,
  onSelect,
}: {
  incomeByMonth: Map<string, number>
  selected: string
  onSelect: (key: string) => void
}) {
  const current = currentMonthKey()
  const keys = Array.from({ length: 12 }, (_, i) => shiftMonth(current, i - 11))
  const values = keys.map((k) => incomeByMonth.get(k) ?? 0)
  const max = Math.max(...values, 1)
  const total = values.reduce((a, b) => a + b, 0)
  return (
    <Card>
      <SectionTitle title="Ingresos por mes" hint={`Últimos 12 meses: ${formatCOP(total)}. Toca un mes para filtrar.`} />
      <div className="flex h-52 items-end gap-1.5 md:gap-3" role="list">
        {keys.map((key, i) => {
          const value = values[i]
          const active = selected === key
          return (
            <button
              key={key}
              type="button"
              role="listitem"
              onClick={() => onSelect(key)}
              aria-label={`${monthLabel(key)}: ${formatCOP(value)}`}
              aria-pressed={active}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <span className={cn('text-[0.6875rem] text-pearl tabular-nums transition', active || value === max ? 'opacity-100' : 'opacity-0 group-hover:opacity-100', 'hidden md:block')}>
                {value ? formatCOP(value).replace('$ ', '$') : ''}
              </span>
              <span
                className={cn(
                  'w-full rounded-t-lg transition-all duration-700',
                  value ? 'bg-metal' : 'bg-rose/10',
                  active ? 'ring-2 ring-rose-light ring-offset-2 ring-offset-noir' : 'opacity-85 group-hover:opacity-100',
                )}
                style={{ height: `${Math.max(3, (value / max) * 100)}%` }}
              />
              <span className={cn('text-[0.6875rem] tracking-[0.06em]', key === current ? 'text-rose-light' : 'text-smoke')}>{monthLabel(key, true)}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full md:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-rose" />
      <input className="field pl-11!" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  )
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const matches = (b: AgendaItem, q: string) =>
  !q || normalize(`${b.clientName ?? ''} ${b.clientWhatsapp ?? ''} ${b.code} ${b.eventType ?? ''} ${describeServices(b.services)}`).includes(normalize(q))

function ServicesTable({ bookings, month, onOpen }: { bookings: AgendaItem[]; month: string; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todas')
  const now = Date.now()
  const rows = useMemo(
    () =>
      bookings
        .filter((b) => month === 'todos' || monthKey(b.startsAt) === month)
        .filter((b) => matches(b, query))
        .filter((b) => {
          const status = viewStatus(b, now)
          const bill = billingOf(b)
          switch (filter) {
            case 'pending':
              return status === 'pending'
            case 'confirmed':
              return status === 'confirmed'
            case 'done':
              return status === 'done'
            case 'deposit':
              return needsDeposit(b)
            case 'balance':
              return b.status === 'confirmed' && (bill.balance ?? 0) > 0
            case 'cancelled':
              return status === 'cancelled' || status === 'rejected'
            default:
              return true
          }
        })
        .sort((a, b) => b.startsAt - a.startsAt),
    [bookings, month, query, filter, now],
  )
  const totals = rows.reduce(
    (acc, b) => {
      const bill = billingOf(b)
      return { price: acc.price + (b.price ?? 0), paid: acc.paid + bill.paid, balance: acc.balance + (b.status === 'confirmed' ? (bill.balance ?? 0) : 0) }
    },
    { price: 0, paid: 0, balance: 0 },
  )

  const exportCsv = () =>
    downloadCsv(`servicios-toro-roso-${todayLocal()}.csv`, [
      ['Fecha', 'Hora', 'Código', 'Clienta', 'WhatsApp', 'Servicio', 'Personas', 'Evento', 'Estado', 'Valor', 'Pagado', 'Saldo', 'Anticipo'],
      ...rows.map((b) => {
        const bill = billingOf(b)
        const start = utcToLocal(b.startsAt)
        return [
          start.date,
          start.time,
          b.code,
          b.clientName ?? '',
          b.clientWhatsapp ? formatWhatsApp(b.clientWhatsapp) : '',
          describeServices(b.services),
          b.services.length,
          b.eventType ?? '',
          STATUS_LABEL[viewStatus(b, now)],
          b.price ?? '',
          bill.paid,
          bill.balance ?? '',
          bill.depositPaid ? 'Sí' : 'No',
        ]
      }),
    ])

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre, teléfono o código" />
        <button type="button" onClick={exportCsv} disabled={!rows.length} className="inline-flex items-center gap-2 self-start text-[0.6875rem] tracking-[0.2em] text-rose uppercase hover:text-rose-light disabled:opacity-40">
          <Download className="size-4" /> Exportar a Excel
        </button>
      </div>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1" data-lenis-prevent>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-xs transition',
              filter === f.value ? 'border-rose bg-rose/15 text-pearl' : 'border-line text-smoke hover:text-pearl',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Sin resultados" text="No hay servicios con esos filtros." />
        </div>
      ) : (
        <>
          {/* Computador: tabla */}
          <div className="mt-6 hidden overflow-hidden rounded-3xl border border-line md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-plum-900/60 text-left text-[0.6875rem] tracking-[0.16em] text-smoke uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Clienta</th>
                  <th className="px-3 py-3 font-medium">Servicio</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 text-right font-medium">Valor</th>
                  <th className="px-3 py-3 text-right font-medium">Pagado</th>
                  <th className="px-5 py-3 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const bill = billingOf(b)
                  const live = b.status === 'confirmed'
                  return (
                    <tr key={b.id} onClick={() => onOpen(b.id)} className="cursor-pointer border-t border-line transition hover:bg-rose/5">
                      <td className="px-5 py-3.5 whitespace-nowrap text-pearl">{dateShort(b.startsAt)}</td>
                      <td className="px-3 py-3.5">
                        <button type="button" onClick={() => onOpen(b.id)} className="text-left text-pearl hover:text-rose-light">
                          {b.clientName}
                        </button>
                      </td>
                      <td className="px-3 py-3.5 text-pearl/80">{describeServices(b.services)}</td>
                      <td className="px-3 py-3.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <StatusPill status={viewStatus(b, now)} />
                          {needsDeposit(b) && <span className="text-[0.6875rem] text-[#f0a3bb]">sin anticipo</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right text-pearl tabular-nums">{b.price === null ? <span className="text-smoke">—</span> : formatCOP(b.price)}</td>
                      <td className="px-3 py-3.5 text-right text-pearl/85 tabular-nums">{bill.paid ? formatCOP(bill.paid) : '—'}</td>
                      <td className={cn('px-5 py-3.5 text-right tabular-nums', live && bill.balance ? 'text-rose-light' : 'text-smoke')}>
                        {live && bill.balance !== null ? (bill.balance ? formatCOP(bill.balance) : 'Pagado') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t border-rose/30 bg-plum-900/40 text-sm">
                <tr>
                  <td className="px-5 py-3.5 text-smoke" colSpan={4}>
                    {rows.length} {rows.length === 1 ? 'servicio' : 'servicios'}
                  </td>
                  <td className="px-3 py-3.5 text-right text-pearl tabular-nums">{formatCOP(totals.price)}</td>
                  <td className="px-3 py-3.5 text-right text-pearl tabular-nums">{formatCOP(totals.paid)}</td>
                  <td className="px-5 py-3.5 text-right text-rose-light tabular-nums">{formatCOP(totals.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="mt-6 flex flex-col gap-3 md:hidden">
            {rows.map((b) => {
              const bill = billingOf(b)
              return (
                <li key={b.id}>
                  <button type="button" onClick={() => onOpen(b.id)} className="w-full rounded-2xl border border-line bg-plum-900/30 p-4 text-left">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-pearl">{b.clientName}</span>
                        <span className="block text-xs text-smoke">
                          {dateShort(b.startsAt)} · {describeServices(b.services)}
                        </span>
                      </span>
                      <StatusPill status={viewStatus(b, now)} />
                    </span>
                    <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-pearl/85 tabular-nums">
                      <span>Valor {b.price === null ? '—' : formatCOP(b.price)}</span>
                      <span>Pagado {formatCOP(bill.paid)}</span>
                      {b.status === 'confirmed' && bill.balance ? <span className="text-rose-light">Saldo {formatCOP(bill.balance)}</span> : null}
                      {needsDeposit(b) && <span className="text-[#f0a3bb]">Sin anticipo</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-sm text-smoke md:hidden">
            {rows.length} servicios · pagado {formatCOP(totals.paid)} · por cobrar {formatCOP(totals.balance)}
          </p>
        </>
      )}
    </div>
  )
}

function ClientsTable({ clients, onOpen }: { clients: ClientSummary[]; onOpen: (client: ClientSummary) => void }) {
  const [query, setQuery] = useState('')
  const rows = clients.filter((c) => !query || normalize(`${c.name} ${c.whatsapp ?? ''} ${c.email ?? ''}`).includes(normalize(query)))
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar clienta por nombre o teléfono" />
        <button
          type="button"
          disabled={!rows.length}
          onClick={() =>
            downloadCsv(`clientas-toro-roso-${todayLocal()}.csv`, [
              ['Nombre', 'WhatsApp', 'Correo', 'Citas', 'Realizadas', 'Total pagado', 'Saldo pendiente', 'Última cita', 'Próxima cita'],
              ...rows.map((c) => [
                c.name,
                c.whatsapp ? formatWhatsApp(c.whatsapp) : '',
                c.email ?? '',
                c.bookings.length,
                c.done,
                c.paid,
                c.balance,
                c.last ? utcToLocal(c.last.startsAt).date : '',
                c.upcoming ? utcToLocal(c.upcoming.startsAt).date : '',
              ]),
            ])
          }
          className="inline-flex items-center gap-2 self-start text-[0.6875rem] tracking-[0.2em] text-rose uppercase hover:text-rose-light disabled:opacity-40"
        >
          <Download className="size-4" /> Exportar a Excel
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Sin clientas" text={query ? 'Nadie coincide con la búsqueda.' : 'Aquí aparecerán las clientas que agenden.'} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <li key={c.key}>
              <button type="button" onClick={() => onOpen(c)} className="flex h-full w-full flex-col gap-3 rounded-3xl border border-line bg-plum-900/30 p-5 text-left transition hover:border-rose/60">
                <span className="flex items-center gap-3">
                  <span className="bg-metal grid size-11 shrink-0 place-items-center rounded-full font-display text-lg text-noir">
                    {c.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-pearl">{c.name}</span>
                    <span className="block text-xs text-smoke">{c.whatsapp ? formatWhatsApp(c.whatsapp) : 'Sin número'}</span>
                  </span>
                </span>
                <span className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                  <span>
                    <span className="block font-display text-lg text-pearl">{c.bookings.length}</span>
                    <span className="text-[0.6875rem] text-smoke">citas</span>
                  </span>
                  <span>
                    <span className="block font-display text-lg text-pearl tabular-nums">{formatCOP(c.paid).replace('$ ', '$')}</span>
                    <span className="text-[0.6875rem] text-smoke">pagado</span>
                  </span>
                  <span>
                    <span className={cn('block font-display text-lg tabular-nums', c.balance ? 'text-rose-light' : 'text-pearl')}>
                      {formatCOP(c.balance).replace('$ ', '$')}
                    </span>
                    <span className="text-[0.6875rem] text-smoke">por cobrar</span>
                  </span>
                </span>
                {c.upcoming && (
                  <span className="text-xs text-rose-light">Próxima: {capitalize(formatDateLong(utcToLocal(c.upcoming.startsAt).date))}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ClientDetail({ client, onOpen }: { client: ClientSummary; onOpen: (id: string) => void }) {
  const now = Date.now()
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="bg-metal grid size-14 shrink-0 place-items-center rounded-full font-display text-2xl text-noir">
          {client.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl text-pearl">{client.name}</p>
          <p className="text-sm text-smoke">
            {client.whatsapp ? formatWhatsApp(client.whatsapp) : 'Sin número'}
            {client.email ? ` · ${client.email}` : ''}
          </p>
        </div>
      </div>
      {client.whatsapp && (
        <a
          href={waUrl(client.whatsapp, `Hola, ${client.name.split(' ')[0]} ✨ Te escribo de Toro Roso Studio.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-rose/35 px-4 py-2 text-xs text-pearl hover:border-rose"
        >
          <WhatsAppIcon className="size-4 text-rose" /> Escribirle por WhatsApp
        </a>
      )}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi icon={User} label="Citas" value={client.bookings.length} hint={`${client.done} realizadas`} />
        <Kpi icon={Wallet} label="Pagado" value={formatCOP(client.paid).replace('$ ', '$')} />
        <Kpi icon={Wallet} label="Por cobrar" value={formatCOP(client.balance).replace('$ ', '$')} highlight={client.balance > 0} />
      </div>
      <h3 className="mt-8 text-[0.6875rem] font-medium tracking-[0.22em] text-pearl/80 uppercase">Historial de servicios</h3>
      <ul className="mt-4 flex flex-col gap-2">
        {[...client.bookings].reverse().map((b) => {
          const bill = billingOf(b)
          return (
            <li key={b.id}>
              <button type="button" onClick={() => onOpen(b.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-left hover:border-rose/60">
                <span className="min-w-0">
                  <span className="block text-sm text-pearl">{capitalize(formatDateLong(utcToLocal(b.startsAt).date))}</span>
                  <span className="block truncate text-xs text-smoke">
                    {describeServices(b.services)}
                    {b.price !== null ? ` · ${formatCOP(b.price)}` : ''}
                    {bill.paid ? ` · pagado ${formatCOP(bill.paid)}` : ''}
                  </span>
                </span>
                <StatusPill status={viewStatus(b, now)} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PaymentsTable({
  rows,
  month,
  onOpen,
}: {
  rows: { payment: Payment; booking: AgendaItem }[]
  month: string
  onOpen: (id: string) => void
}) {
  const list = rows.filter(({ payment }) => month === 'todos' || monthKey(payment.paidAt) === month)
  const total = list.reduce((sum, { payment }) => sum + payment.amount, 0)
  const byMethod = new Map<string, number>()
  for (const { payment } of list) byMethod.set(payment.method, (byMethod.get(payment.method) ?? 0) + payment.amount)

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-smoke">{month === 'todos' ? 'Total recibido' : `Recibido en ${monthLabel(month)}`}</p>
          <p className="font-display text-3xl text-pearl tabular-nums">{formatCOP(total)}</p>
          {byMethod.size > 0 && (
            <p className="mt-1 text-xs text-smoke">
              {[...byMethod.entries()].map(([m, v]) => `${m} ${formatCOP(v)}`).join(' · ')}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!list.length}
          onClick={() =>
            downloadCsv(`pagos-toro-roso-${todayLocal()}.csv`, [
              ['Fecha del pago', 'Clienta', 'Código', 'Tipo', 'Medio', 'Valor', 'Nota', 'Fecha de la cita'],
              ...list.map(({ payment, booking }) => [
                utcToLocal(payment.paidAt).date,
                booking.clientName ?? '',
                booking.code,
                PAYMENT_KINDS[payment.kind],
                payment.method,
                payment.amount,
                payment.note ?? '',
                utcToLocal(booking.startsAt).date,
              ]),
            ])
          }
          className="inline-flex items-center gap-2 self-start text-[0.6875rem] tracking-[0.2em] text-rose uppercase hover:text-rose-light disabled:opacity-40"
        >
          <Download className="size-4" /> Exportar a Excel
        </button>
      </div>
      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Sin pagos" text="Registra los anticipos y saldos desde la ficha de cada cita." />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {list.map(({ payment, booking }) => (
            <li key={payment.id}>
              <button type="button" onClick={() => onOpen(booking.id)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-plum-900/30 px-4 py-3 text-left hover:border-rose/60">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-pearl">
                    {booking.clientName} · <span className="text-smoke">{PAYMENT_KINDS[payment.kind]}</span>
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    {dateShort(payment.paidAt)} · {payment.method}
                    {payment.note ? ` · ${payment.note}` : ''}
                  </span>
                </span>
                <span className="shrink-0 font-display text-lg text-pearl tabular-nums">{formatCOP(payment.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
