import { useRef, useState, type ReactNode } from 'react'
import { BOOKING_RULES, SERVICE_NAMES } from '../../../shared/booking-rules'
import { PAYMENT_METHODS, billingOf, formatCOP, type PaymentMethod } from '../../../shared/billing'
import { depositWhatsAppMessage } from '../../../shared/deposit'
import { capitalize, formatDateLong, formatDuration, formatTime, todayLocal, utcToLocal } from '../../../shared/time'
import type { AgendaItem, Payment, PaymentKind } from '../../../shared/types'
import { LOCATION_LABELS, formatWhatsApp } from '../../../shared/validation'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { Ban, Calendar, Check, Mail, MapPin, Pencil, Phone, Plus, Trash, WhatsAppIcon } from '../ui/Icons'
import { ServiceGlyph } from '../ui/ServiceIcon'
import { CancelForm, useBookingActions } from './actions'
import { useAdminData } from './AdminData'
import { RescheduleForm } from './BookingForms'
import { ago, firstName, timeRange, viewStatus, waUrl } from './model'
import { MoneyInput, Sheet, StatusPill, labelClass, useToast } from './ui'

/** Panel lateral con todo sobre una cita: datos, acciones y cobro. */
export function BookingDrawer() {
  const { items, openId, open } = useAdminData()
  const current = items.find((i) => i.id === openId) ?? null
  // Mantiene el contenido visible mientras el panel se cierra.
  const last = useRef<AgendaItem | null>(null)
  if (current) last.current = current
  const item = current ?? last.current
  const title = !item ? '' : item.kind === 'block' ? 'Horario bloqueado' : (item.clientName ?? 'Cita')
  return (
    <Sheet open={Boolean(current)} onClose={() => open(null)} title={title}>
      {item && <BookingDetail key={item.id} item={item} />}
    </Sheet>
  )
}

function Block({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-7 border-t border-line pt-6', className)}>
      <h3 className={labelClass}>{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

const chip = 'inline-flex items-center gap-2 rounded-full border border-rose/35 px-4 py-2 text-xs text-pearl transition hover:border-rose'

function BookingDetail({ item }: { item: AgendaItem }) {
  const { open, upsert, removeItem } = useAdminData()
  const { confirm } = useBookingActions()
  const toast = useToast()
  const [mode, setMode] = useState<'idle' | 'cancel' | 'reschedule'>('idle')
  const [busy, setBusy] = useState(false)
  const status = viewStatus(item)
  const start = utcToLocal(item.startsAt)
  const until = utcToLocal(item.blockedUntil)
  const bill = billingOf(item)
  const deposit = BOOKING_RULES.depositRequired

  if (item.kind === 'block') {
    const end = utcToLocal(item.endsAt)
    const allDay = start.time === '00:00' && end.time === '00:00'
    return (
      <div>
        <StatusPill status="block" />
        <p className="mt-4 font-display text-2xl text-pearl">{capitalize(formatDateLong(start.date))}</p>
        <p className="mt-1 text-smoke">{allDay ? 'Todo el día' : timeRange(item)}</p>
        {item.notes && <p className="mt-5 rounded-2xl bg-noir/50 px-4 py-3 text-pearl/85">{item.notes}</p>}
        <div className="mt-7">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await api.admin.unblock(item.id)
                removeItem(item.id)
                open(null)
                toast('Bloqueo eliminado: el horario vuelve a estar disponible.')
              } catch (e) {
                toast(e instanceof Error ? e.message : 'No se pudo quitar el bloqueo.')
              } finally {
                setBusy(false)
              }
            }}
          >
            Quitar bloqueo
          </Button>
        </div>
      </div>
    )
  }

  const greeting = `Hola, ${firstName(item)}. Te escribo de Toro Roso Studio sobre tu cita ${item.code} (${formatDateLong(start.date)}, ${formatTime(start.time)}).`

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={status} />
        <span className="text-xs tracking-[0.16em] text-smoke">{item.code}</span>
        {item.source === 'panel' && <span className="text-xs text-smoke">· Agendada por ti</span>}
        {deposit && item.status === 'confirmed' && (
          <span
            className={cn(
              'rounded-full px-3 py-1 text-[0.6875rem] tracking-[0.14em] uppercase',
              bill.depositPaid ? 'border border-rose/40 text-rose-light' : 'border border-[#f0a3bb]/50 text-[#f0a3bb]',
            )}
          >
            {bill.depositPaid ? 'Anticipo recibido' : 'Anticipo pendiente'}
          </span>
        )}
      </div>
      <p className="mt-5 font-display text-2xl leading-tight text-pearl md:text-3xl">{capitalize(formatDateLong(start.date))}</p>
      <p className="mt-1 text-lg text-pearl/85">{timeRange(item)}</p>
      <p className="mt-1 text-xs text-smoke">
        {formatDuration(Math.round((item.endsAt - item.startsAt) / 60_000))} de servicio · agenda ocupada hasta{' '}
        {formatTime(until.time)} (movilización)
      </p>

      {/* Acciones principales según el estado */}
      {mode === 'cancel' ? (
        <div className="mt-6">
          <CancelForm item={item} onDone={() => setMode('idle')} onBack={() => setMode('idle')} />
        </div>
      ) : mode === 'reschedule' ? (
        <div className="mt-6">
          <RescheduleForm item={item} onDone={() => setMode('idle')} onBack={() => setMode('idle')} />
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          {item.status === 'pending' && (
            <>
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  await confirm(item)
                  setBusy(false)
                }}
              >
                <Check className="size-4" /> Confirmar cita
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode('cancel')}>
                <Ban className="size-4" /> Rechazar
              </Button>
            </>
          )}
          {status === 'confirmed' && deposit && !bill.depositPaid && item.clientWhatsapp && (
            <a href={waUrl(item.clientWhatsapp, depositWhatsAppMessage(item))} target="_blank" rel="noopener noreferrer" className={buttonMetal}>
              <WhatsAppIcon className="size-4" /> Coordinar anticipo
            </a>
          )}
          {(item.status === 'pending' || status === 'confirmed') && (
            <Button size="sm" variant="outline" onClick={() => setMode('reschedule')}>
              <Calendar className="size-4" /> Reprogramar
            </Button>
          )}
          {status === 'confirmed' && (
            <Button size="sm" variant="outline" onClick={() => setMode('cancel')}>
              <Ban className="size-4" /> Cancelar cita
            </Button>
          )}
        </div>
      )}

      {item.cancelReason && (item.status === 'cancelled') && (
        <p className="mt-6 rounded-2xl border border-line bg-noir/50 px-4 py-3 text-sm text-pearl/85">
          <span className="text-smoke">Motivo: </span>
          {item.cancelReason}
        </p>
      )}

      <Block title="Clienta">
        <p className="text-lg text-pearl">{item.clientName}</p>
        <p className="mt-1 text-sm text-smoke">
          {item.eventType} · solicitó {ago(item.createdAt)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.clientWhatsapp && (
            <>
              <a href={waUrl(item.clientWhatsapp, greeting)} target="_blank" rel="noopener noreferrer" className={chip}>
                <WhatsAppIcon className="size-4 text-rose" /> {formatWhatsApp(item.clientWhatsapp)}
              </a>
              <a href={`tel:+${item.clientWhatsapp}`} className={chip}>
                <Phone className="size-4 text-rose" /> Llamar
              </a>
            </>
          )}
          {item.clientEmail && (
            <a href={`mailto:${item.clientEmail}`} className={cn(chip, 'max-w-full')}>
              <Mail className="size-4 shrink-0 text-rose" /> <span className="truncate">{item.clientEmail}</span>
            </a>
          )}
        </div>
        <p className="mt-4 flex items-start gap-2 text-sm text-pearl/85">
          <MapPin className="mt-0.5 size-4 shrink-0 text-rose" />
          {item.locationType ? LOCATION_LABELS[item.locationType] : ''} · {item.locationArea}
        </p>
        {item.guardianConsent && (
          <p className="mt-2 flex items-center gap-2 text-sm text-pearl/85">
            <Check className="size-4 text-rose" /> Autorización del acudiente confirmada (quinceañera)
          </p>
        )}
        {item.notes && <p className="mt-4 rounded-2xl bg-noir/50 px-4 py-3 text-sm whitespace-pre-line text-pearl/85">“{item.notes}”</p>}
      </Block>

      <Block title={`Servicio · ${item.services.length} ${item.services.length === 1 ? 'persona' : 'personas'}`}>
        <ul className="grid gap-2">
          {item.services.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-sm">
              <span className="flex items-center gap-3 text-pearl">
                <ServiceGlyph id={s} className="size-5 text-rose" /> Persona {i + 1}: {SERVICE_NAMES[s]}
              </span>
              <span className="text-xs text-smoke">{formatDuration(BOOKING_RULES.serviceMinutes[s])}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Billing item={item} onSaved={upsert} />
    </div>
  )
}

const buttonMetal =
  'bg-metal inline-flex h-10 items-center gap-2 rounded-full px-5 text-[0.6875rem] font-medium tracking-[0.2em] text-noir uppercase'

/* ── Cobro: valor, anticipo, lo que resta y pago final ─────────── */

function MethodPicker({ value, onChange }: { value: PaymentMethod; onChange: (method: PaymentMethod) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Medio de pago">
      {PAYMENT_METHODS.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={cn(
            'rounded-full border px-5 py-2.5 text-xs transition',
            value === m ? 'border-rose bg-rose/15 text-pearl' : 'border-line text-smoke hover:text-pearl',
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

function PaymentLine({ payment, busy, onDelete }: { payment: Payment; busy: boolean; onDelete: () => void }) {
  const [asking, setAsking] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-pearl/85">
        <span className="text-pearl tabular-nums">{formatCOP(payment.amount)}</span> · {payment.method} ·{' '}
        {formatDateLong(utcToLocal(payment.paidAt).date)}
      </p>
      {asking ? (
        <span className="flex shrink-0 items-center gap-3 text-xs">
          <button type="button" disabled={busy} onClick={onDelete} className="text-[#f0a3bb] hover:underline">
            Quitar
          </button>
          <button type="button" onClick={() => setAsking(false)} className="text-smoke hover:text-pearl">
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          aria-label="Quitar este pago"
          onClick={() => setAsking(true)}
          className="grid size-9 shrink-0 place-items-center rounded-full text-smoke hover:text-[#f0a3bb]"
        >
          <Trash className="size-4" />
        </button>
      )}
    </div>
  )
}

function Billing({ item, onSaved }: { item: AgendaItem; onSaved: (item: AgendaItem) => void }) {
  const toast = useToast()
  const bill = billingOf(item)
  const deposits = item.payments.filter((p) => p.kind === 'anticipo')
  const finals = item.payments.filter((p) => p.kind !== 'anticipo')
  const [editingPrice, setEditingPrice] = useState(item.price === null)
  const [price, setPrice] = useState<number | null>(item.price)
  const [form, setForm] = useState<'none' | 'deposit' | 'paid'>('none')
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('Transferencia')
  const [busy, setBusy] = useState(false)

  const run = async (task: () => Promise<{ item: AgendaItem }>, message: string) => {
    setBusy(true)
    try {
      const response = await task()
      onSaved(response.item)
      toast(message)
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const pay = async (kind: PaymentKind, value: number, message: string) => {
    const ok = await run(() => api.admin.addPayment(item.id, { kind, amount: value, method, paidOn: todayLocal() }), message)
    if (ok) setForm('none')
  }

  return (
    <Block title="Cobro">
      <div className="overflow-hidden rounded-2xl border border-line">
        {/* 1. Valor del servicio */}
        <div className="p-4">
          {editingPrice ? (
            <>
              <label className="flex flex-col gap-2.5">
                <span className={labelClass}>Valor del servicio</span>
                <MoneyInput value={price} onChange={setPrice} />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  disabled={busy || price === null}
                  onClick={async () => {
                    if (await run(() => api.admin.setPrice(item.id, price), 'Valor guardado.')) setEditingPrice(false)
                  }}
                >
                  Guardar valor
                </Button>
                {item.price !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrice(item.price)
                      setEditingPrice(false)
                    }}
                    className="text-[0.6875rem] tracking-[0.2em] text-smoke uppercase hover:text-pearl"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={labelClass}>Valor del servicio</p>
                <p className="mt-1 font-display text-2xl text-pearl tabular-nums">{formatCOP(item.price ?? 0)}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPrice(true)}
                aria-label="Cambiar valor"
                className="grid size-10 place-items-center rounded-full border border-rose/30 text-rose hover:border-rose"
              >
                <Pencil className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Anticipo */}
        <div className="border-t border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <p className={labelClass}>Anticipo</p>
            {deposits.length > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-rose-light">
                <Check className="size-3.5" /> Recibido
              </span>
            ) : (
              <span className="text-xs text-[#f0a3bb]">Pendiente</span>
            )}
          </div>
          {deposits.map((p) => (
            <div key={p.id} className="mt-2">
              <PaymentLine payment={p} busy={busy} onDelete={() => run(() => api.admin.deletePayment(p.id), 'Anticipo quitado.')} />
            </div>
          ))}
          {form === 'deposit' ? (
            <div className="mt-4 grid gap-4">
              <label className="flex flex-col gap-2.5">
                <span className="text-xs text-smoke">¿De cuánto fue el anticipo?</span>
                <MoneyInput value={amount} onChange={setAmount} autoFocus />
              </label>
              <MethodPicker value={method} onChange={setMethod} />
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" disabled={busy || !amount} onClick={() => amount && pay('anticipo', amount, 'Anticipo registrado ✓')}>
                  Guardar anticipo
                </Button>
                <button type="button" onClick={() => setForm('none')} className="text-[0.6875rem] tracking-[0.2em] text-smoke uppercase hover:text-pearl">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            deposits.length === 0 &&
            !bill.settled && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setAmount(null)
                  setForm('deposit')
                }}
              >
                <Plus className="size-4" /> Registrar anticipo
              </Button>
            )
          )}
        </div>

        {/* 3. Lo que resta y pago final */}
        <div className={cn('border-t border-line p-4', bill.settled && 'bg-rose/8')}>
          {bill.settled ? (
            <>
              <p className="flex items-center gap-2 font-display text-xl text-rose-light">
                <Check className="size-5" /> Pagado completo
              </p>
              {finals.map((p) => (
                <div key={p.id} className="mt-2">
                  <PaymentLine payment={p} busy={busy} onDelete={() => run(() => api.admin.deletePayment(p.id), 'Pago quitado.')} />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className={labelClass}>Le resta</p>
                <p className="font-display text-2xl text-pearl tabular-nums">
                  {bill.balance === null ? <span className="text-base text-smoke">Falta el valor</span> : formatCOP(bill.balance)}
                </p>
              </div>
              {finals.map((p) => (
                <div key={p.id} className="mt-2">
                  <PaymentLine payment={p} busy={busy} onDelete={() => run(() => api.admin.deletePayment(p.id), 'Pago quitado.')} />
                </div>
              ))}
              {bill.balance !== null && bill.balance > 0 &&
                (form === 'paid' ? (
                  <div className="mt-4 grid gap-4">
                    <p className="text-sm text-pearl/85">
                      Se registrará el pago de <strong className="text-pearl">{formatCOP(bill.balance)}</strong> con fecha de hoy.
                    </p>
                    <MethodPicker value={method} onChange={setMethod} />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm" disabled={busy} onClick={() => pay('saldo', bill.balance!, 'Pago completo registrado ✓')}>
                        <Check className="size-4" /> Confirmar pago
                      </Button>
                      <button type="button" onClick={() => setForm('none')} className="text-[0.6875rem] tracking-[0.2em] text-smoke uppercase hover:text-pearl">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" className="mt-4" onClick={() => setForm('paid')}>
                    <Check className="size-4" /> Marcar como pagado
                  </Button>
                ))}
            </>
          )}
        </div>
      </div>
    </Block>
  )
}
