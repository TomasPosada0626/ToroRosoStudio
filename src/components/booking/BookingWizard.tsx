import { track } from '@vercel/analytics'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { computeDaySlots } from '../../../shared/availability'
import { BOOKING_RULES, requiresGuardianConsent, totalDurationMinutes, type ServiceId } from '../../../shared/booking-rules'
import { capitalize, formatDateLong, formatDuration, formatTime } from '../../../shared/time'
import type { CreateBookingResponse } from '../../../shared/types'
import {
  LIMITS,
  LOCATION_LABELS,
  LOCATION_TYPES,
  formatWhatsApp,
  validateBookingRequest,
  type BookingField,
  type BookingRequest,
  type FieldErrors,
  type LocationType,
} from '../../../shared/validation'
import { SERVICES } from '../../config/services'
import { ApiRequestError, api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { bookingRequestMessage, waLink } from '../../lib/whatsapp'
import { EASE_LUXE } from '../fx/Reveal'
import { useScrollTo } from '../providers/SmoothScroll'
import { Button } from '../ui/Button'
import { ArrowLeft, ArrowRight, Check, Lock, WhatsAppIcon } from '../ui/Icons'
import { BookingSuccess, RequestSent } from './BookingSuccess'
import { BookingSummary, bookingPromise } from './BookingSummary'
import { Calendar, bookingDateRange, monthKeyOf, monthOf, type MonthRef } from './Calendar'
import { Field, GroupError, describedBy, fieldId } from './fields'
import { PeoplePicker } from './PeoplePicker'
import { SlotPicker, type SlotOption } from './SlotPicker'
import { invalidateAvailability, useDaySlots, useMonthAvailability } from './useAvailability'

type Step = 0 | 1 | 2 | 3
const STEPS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmar'] as const
const STEP_FIELDS: BookingField[][] = [
  ['services'],
  ['date', 'time'],
  ['name', 'whatsapp', 'email', 'eventType', 'locationType', 'locationArea', 'notes', 'guardianConsent', 'consent'],
  [],
]
const FIELD_ORDER = STEP_FIELDS.flat()
const stepOf = (field: string): Step => Math.max(0, STEP_FIELDS.findIndex((f) => f.includes(field as BookingField))) as Step

interface Draft {
  services: (ServiceId | null)[]
  date: string | null
  time: string | null
  endTime: string | null
  eventChoice: string
  eventOther: string
  locationType: LocationType | ''
  locationArea: string
  name: string
  whatsapp: string
  email: string
  notes: string
  consent: boolean
  /** Autorización del acudiente o representante (quinceañeras). */
  guardianConsent: boolean
  /** Campo trampa para robots (invisible). */
  website: string
}

interface Banner {
  message: string
  /** Ofrece enviar la misma solicitud por WhatsApp cuando la agenda en línea no pudo recibirla. */
  whatsapp?: boolean
}

const emptyDraft = (service?: ServiceId): Draft => ({
  services: [service ?? null],
  date: null,
  time: null,
  endTime: null,
  eventChoice: '',
  eventOther: '',
  locationType: 'domicilio',
  locationArea: '',
  name: '',
  whatsapp: '',
  email: '',
  notes: '',
  consent: false,
  guardianConsent: false,
  website: '',
})

export function BookingWizard({ initialService }: { initialService?: ServiceId }) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialService))
  const [step, setStep] = useState<Step>(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [mode, setMode] = useState<'online' | 'whatsapp'>('online')
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [result, setResult] = useState<CreateBookingResponse | null>(null)
  const [requestMessage, setRequestMessage] = useState<string | null>(null)
  const startedAt = useRef(Date.now())
  const rootRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const scrollTo = useScrollTo()

  const services = draft.services.every(Boolean) ? (draft.services as ServiceId[]) : null
  const duration = services ? totalDurationMinutes(services) : 0
  const primary = draft.services[0] ?? null
  const eventType = draft.eventChoice === 'Otro' ? draft.eventOther.trim() : draft.eventChoice
  const online = mode === 'online'
  const manualApproval = BOOKING_RULES.approval === 'manual'

  const range = useMemo(() => bookingDateRange(), [])
  const [viewMonth, setViewMonth] = useState<MonthRef>(() => monthOf(range.minDate))
  const month = useMonthAvailability(services, monthKeyOf(viewMonth), step === 1 && online)
  const day = useDaySlots(services, draft.date, step === 1 && online)

  useEffect(() => {
    track('agenda_inicio')
  }, [])

  useEffect(() => {
    if (month.status === 'offline' || day.status === 'offline') setMode('whatsapp')
  }, [month.status, day.status])

  // En modo WhatsApp se ofrecen horas válidas según el horario de atención (sin agenda real).
  const preferredTimes: SlotOption[] | null = useMemo(() => {
    if (online || !draft.date || !duration) return null
    return computeDaySlots({ date: draft.date, durationMinutes: duration, busy: [], now: new Date() }).map(
      ({ time, endTime }) => ({ time, endTime }),
    )
  }, [online, draft.date, duration])

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    const touched = Object.keys(patch)
    setErrors((e) => {
      const next = { ...e }
      for (const key of touched) delete next[key as BookingField]
      if ('eventChoice' in patch || 'eventOther' in patch) delete next.eventType
      if ('endTime' in patch) delete next.time
      return next
    })
  }

  const payload = () => ({
    services: draft.services,
    date: draft.date ?? '',
    time: draft.time ?? '',
    eventType,
    locationType: draft.locationType,
    locationArea: draft.locationArea,
    name: draft.name,
    whatsapp: draft.whatsapp,
    email: draft.email.trim(),
    notes: draft.notes,
    consent: draft.consent,
    guardianConsent: draft.guardianConsent,
  })

  const errorsFor = (target: Step): FieldErrors => {
    const check = validateBookingRequest(payload())
    if (check.ok) return {}
    const fields = target === 3 ? FIELD_ORDER : STEP_FIELDS[target]
    return Object.fromEntries(Object.entries(check.errors).filter(([key]) => fields.includes(key as BookingField)))
  }

  const focusFirstError = (found: FieldErrors) => {
    const first = FIELD_ORDER.find((f) => found[f])
    if (!first) return
    requestAnimationFrame(() => {
      const el = document.getElementById(fieldId(first))
      el?.focus({ preventScroll: true })
      if (el) scrollTo(el, { offset: -140 })
    })
  }

  const goTo = (next: Step) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
    requestAnimationFrame(() => {
      if (rootRef.current) scrollTo(rootRef.current, { offset: -110 })
      headingRef.current?.focus({ preventScroll: true })
    })
  }

  const next = () => {
    const found = errorsFor(step)
    if (Object.keys(found).length) {
      setErrors(found)
      focusFirstError(found)
      return
    }
    setErrors({})
    setBanner(null)
    track('agenda_paso', { paso: STEPS[step + 1] })
    goTo((step + 1) as Step)
  }

  const back = () => {
    setBanner(null)
    goTo((step - 1) as Step)
  }

  /** Muestra un aviso general y lo trae a la vista (el botón de enviar queda lejos, al final del paso). */
  const showBanner = (next: Banner) => {
    setBanner(next)
    requestAnimationFrame(() => rootRef.current && scrollTo(rootRef.current, { offset: -110 }))
  }

  const sendByWhatsApp = (request: BookingRequest) => {
    const message = bookingRequestMessage({ ...request, whatsapp: formatWhatsApp(request.whatsapp) })
    const link = waLink(message)
    if (link) window.open(link, '_blank', 'noopener')
    setRequestMessage(message)
  }

  const submit = async () => {
    const check = validateBookingRequest(payload())
    if (!check.ok) {
      setErrors(check.errors)
      const first = FIELD_ORDER.find((f) => check.errors[f])
      if (first) goTo(stepOf(first))
      return
    }

    if (!online) {
      sendByWhatsApp(check.value)
      return
    }

    setSubmitting(true)
    setBanner(null)
    try {
      const response = await api.createBooking({
        ...check.value,
        website: draft.website,
        elapsedMs: Date.now() - startedAt.current,
      })
      invalidateAvailability()
      track('agenda_enviada', { personas: check.value.services.length, estado: response.booking.status })
      setResult(response)
      requestAnimationFrame(() => rootRef.current && scrollTo(rootRef.current, { offset: -110 }))
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'SLOT_TAKEN') {
          invalidateAvailability()
          update({ time: null, endTime: null })
          setBanner({ message: error.message })
          goTo(1)
        } else if (error.code === 'VALIDATION' && error.fields) {
          setErrors(error.fields)
          const first = FIELD_ORDER.find((f) => error.fields?.[f])
          goTo(first ? stepOf(first) : 0)
        } else if (error.code === 'NOT_CONFIGURED') {
          setMode('whatsapp')
          showBanner({ message: 'La agenda en línea no está disponible en este momento. Puedes enviar tu solicitud por WhatsApp.' })
        } else showBanner({ message: error.message, whatsapp: true })
      } else showBanner({ message: 'Ocurrió un error inesperado. Intenta de nuevo, por favor.', whatsapp: true })
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setDraft(emptyDraft())
    setResult(null)
    setRequestMessage(null)
    setErrors({})
    setBanner(null)
    startedAt.current = Date.now()
    goTo(0)
  }

  if (result) {
    return (
      <div ref={rootRef} className="scroll-mt-32 py-6">
        <BookingSuccess booking={result.booking} emailSent={result.emailSent} email={draft.email.trim()} onReset={reset} />
      </div>
    )
  }
  if (requestMessage) {
    return (
      <div ref={rootRef} className="py-6">
        <RequestSent message={requestMessage} onReset={reset} />
      </div>
    )
  }

  const stepTitle = [
    '¿Qué procedimiento necesita cada persona?',
    online ? 'Elige la fecha y el horario' : 'Elige la fecha y tu hora preferida',
    'Cuéntanos sobre ti y tu evento',
    manualApproval && online ? 'Revisa y envía tu solicitud' : 'Revisa y confirma tu cita',
  ][step]

  return (
    <div ref={rootRef} className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-8">
        <Stepper step={step} onJump={(s) => s < step && goTo(s)} />

        {!online && (
          <p className="mt-6 flex items-start gap-3 rounded-2xl border border-rose/30 bg-rose/8 px-5 py-4 text-sm leading-relaxed text-pearl/90">
            <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-rose" />
            La agenda en línea aún no está activa: completa tus datos y enviaremos tu solicitud por WhatsApp. El estudio te
            confirmará la disponibilidad.
          </p>
        )}

        {banner && (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#f0a3bb]/40 bg-[#f0a3bb]/10 px-5 py-4 text-sm text-pearl sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{banner.message}</p>
            {banner.whatsapp && online && step === 3 && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  const check = validateBookingRequest(payload())
                  if (check.ok) sendByWhatsApp(check.value)
                }}
              >
                <WhatsAppIcon className="size-4" /> Enviar por WhatsApp
              </Button>
            )}
          </div>
        )}

        <div className="relative mt-8">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: EASE_LUXE }}
            >
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-2xl tracking-[0.04em] text-pearl outline-none md:text-3xl"
              >
                {stepTitle}
              </h2>
              <p className="sr-only" aria-live="polite">
                Paso {step + 1} de {STEPS.length}: {STEPS[step]}
              </p>

              <div className="mt-8">
                {step === 0 && (
                  <PeoplePicker
                    services={draft.services}
                    onChange={(next) => update({ services: next, time: null, endTime: null })}
                    error={errors.services}
                  />
                )}

                {step === 1 && (
                  <div className="grid gap-8 xl:grid-cols-2">
                    <div id={fieldId('date')} tabIndex={-1} className="outline-none">
                      <Calendar
                        value={draft.date}
                        onChange={(date) => update({ date, time: null, endTime: null })}
                        month={viewMonth}
                        onMonthChange={setViewMonth}
                        availability={online ? (month.days ?? {}) : null}
                        loading={online && month.status === 'loading'}
                        minDate={range.minDate}
                        maxDate={range.maxDate}
                      />
                      <GroupError name="date" error={errors.date} />
                      {online && month.status === 'error' && (
                        <p className="mt-3 text-xs text-[#f0a3bb]">
                          {month.error}{' '}
                          <button type="button" onClick={month.retry} className="underline underline-offset-4">
                            Reintentar
                          </button>
                        </p>
                      )}
                    </div>
                    <div id={fieldId('time')} tabIndex={-1} className="outline-none">
                      <p className="mb-4 text-[0.6875rem] font-medium tracking-[0.22em] text-pearl/85 uppercase">
                        {draft.date ? capitalize(formatDateLong(draft.date)) : 'Primero elige una fecha'}
                      </p>
                      {draft.date ? (
                        <SlotPicker
                          slots={online ? day.slots : preferredTimes}
                          status={online ? day.status : 'ready'}
                          error={day.error}
                          value={draft.time}
                          onChange={(slot) => update({ time: slot.time, endTime: slot.endTime })}
                          onRetry={day.retry}
                        />
                      ) : (
                        <div className="grid h-full min-h-48 place-items-center rounded-[1.5rem] border border-dashed border-rose/25 p-8 text-center text-sm text-smoke">
                          Los días con horarios libres tienen un punto rose gold.
                        </div>
                      )}
                      <GroupError name="time" error={errors.time} />
                      {!online && draft.date && (
                        <p className="mt-4 text-xs leading-relaxed text-smoke">
                          Es tu hora preferida: la disponibilidad se confirma por WhatsApp.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <DetailsStep
                    draft={draft}
                    errors={errors}
                    update={update}
                    eventOptions={primary ? SERVICES[primary].eventTypes : ['Otro']}
                  />
                )}

                {step === 3 && <ReviewStep draft={draft} eventType={eventType} online={online} onEdit={goTo} />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex flex-col-reverse gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="flex items-center justify-center gap-2 text-[0.6875rem] tracking-[0.26em] text-smoke uppercase transition hover:text-pearl"
            >
              <ArrowLeft className="size-4" /> Atrás
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          {step < 3 ? (
            <Button size="lg" onClick={next}>
              Continuar <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={submit} disabled={submitting} aria-busy={submitting}>
              {submitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border border-noir/30 border-t-noir" /> Enviando…
                </>
              ) : online ? (
                <>
                  <Check className="size-4" /> {manualApproval ? 'Enviar solicitud' : 'Confirmar mi cita'}
                </>
              ) : (
                <>
                  <WhatsAppIcon className="size-4" /> Enviar por WhatsApp
                </>
              )}
            </Button>
          )}
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-[0.7rem] text-smoke sm:justify-end">
          <Lock className="size-3.5 text-rose" /> Tus datos solo se usan para gestionar tu cita.{' '}
          <Link to="/privacidad" target="_blank" className="underline underline-offset-4 hover:text-pearl">
            Política de datos
          </Link>
        </p>
      </div>

      <div className="hidden lg:col-span-4 lg:block">
        <div className="sticky top-28">
          <BookingSummary data={draft} onlineMode={online} />
        </div>
      </div>
    </div>
  )
}

function Stepper({ step, onJump }: { step: Step; onJump: (step: Step) => void }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Pasos de la agenda">
      {STEPS.map((label, i) => {
        const done = i < step
        const current = i === step
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onJump(i as Step)}
              disabled={!done}
              aria-current={current ? 'step' : undefined}
              className="flex items-center gap-2.5 disabled:cursor-default"
            >
              <span
                className={cn(
                  'relative grid size-9 shrink-0 place-items-center rounded-full border font-display text-xs transition-colors duration-500',
                  current && 'bg-metal border-transparent text-noir',
                  done && 'border-rose bg-rose/15 text-rose',
                  !current && !done && 'border-rose/25 text-smoke',
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[0.6875rem] tracking-[0.22em] uppercase md:block',
                  current ? 'text-pearl' : 'text-smoke',
                )}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="relative h-px flex-1 overflow-hidden bg-rose/15">
                <motion.span
                  className="bg-metal absolute inset-0 origin-left"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: EASE_LUXE }}
                />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function DetailsStep({
  draft,
  errors,
  update,
  eventOptions,
}: {
  draft: Draft
  errors: FieldErrors
  update: (patch: Partial<Draft>) => void
  eventOptions: string[]
}) {
  const options = eventOptions.includes('Otro') ? eventOptions : [...eventOptions, 'Otro']
  return (
    <div className="grid gap-7 md:grid-cols-2">
      <Field name="name" label="Nombre completo" error={errors.name}>
        <input
          id={fieldId('name')}
          className="field"
          autoComplete="name"
          maxLength={LIMITS.name}
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy('name', undefined, errors.name)}
          placeholder="Nombre y apellido"
        />
      </Field>

      <Field name="whatsapp" label="WhatsApp" hint="Celular colombiano o número con indicativo (+…)." error={errors.whatsapp}>
        <input
          id={fieldId('whatsapp')}
          className="field"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={draft.whatsapp}
          onChange={(e) => update({ whatsapp: e.target.value })}
          aria-invalid={Boolean(errors.whatsapp)}
          aria-describedby={describedBy('whatsapp', true, errors.whatsapp)}
          placeholder="300 123 4567"
        />
      </Field>

      <Field
        name="email"
        label="Correo electrónico"
        optional
        hint="Recomendado: ahí te enviamos la confirmación y el recordatorio para tu calendario."
        error={errors.email}
        className="md:col-span-2"
      >
        <input
          id={fieldId('email')}
          className="field"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          value={draft.email}
          onChange={(e) => update({ email: e.target.value })}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy('email', true, errors.email)}
          placeholder="tucorreo@ejemplo.com"
        />
      </Field>

      <Field name="eventType" label="Tipo de evento" error={errors.eventType}>
        <select
          id={fieldId('eventType')}
          className="field"
          value={draft.eventChoice}
          onChange={(e) => update({ eventChoice: e.target.value })}
          aria-invalid={Boolean(errors.eventType)}
          aria-describedby={describedBy('eventType', undefined, errors.eventType)}
        >
          <option value="" disabled>
            Selecciona una opción
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      {draft.eventChoice === 'Otro' ? (
        <Field name="eventOther" label="¿Cuál?" error={errors.eventType}>
          <input
            id={fieldId('eventOther')}
            className="field"
            maxLength={LIMITS.eventType}
            value={draft.eventOther}
            onChange={(e) => update({ eventOther: e.target.value })}
            placeholder="Cuéntanos el tipo de evento"
          />
        </Field>
      ) : (
        <span className="hidden md:block" />
      )}

      <fieldset className="md:col-span-2">
        <legend className="mb-3 text-[0.6875rem] font-medium tracking-[0.22em] text-pearl/85 uppercase">Lugar del servicio</legend>
        <div id={fieldId('locationType')} tabIndex={-1} className="grid gap-3 outline-none sm:grid-cols-2">
          {LOCATION_TYPES.map((type) => {
            const checked = draft.locationType === type
            return (
              <label
                key={type}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-colors duration-300 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rose-light',
                  checked ? 'border-rose bg-rose/12' : 'border-line bg-noir/30 hover:border-rose/50',
                )}
              >
                <input
                  type="radio"
                  name="locationType"
                  value={type}
                  checked={checked}
                  onChange={() => update({ locationType: type })}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-full border',
                    checked ? 'border-rose bg-rose' : 'border-rose/40',
                  )}
                >
                  {checked && <span className="size-2 rounded-full bg-noir" />}
                </span>
                <span>
                  <span className="block text-sm text-pearl">{LOCATION_LABELS[type]}</span>
                  <span className="block text-xs text-smoke">
                    {type === 'domicilio' ? 'Vamos hasta tu casa o lugar de preparación.' : 'Un lugar que acordemos juntas.'}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        <GroupError name="locationType" error={errors.locationType} />
      </fieldset>

      <Field
        name="locationArea"
        label="Municipio y barrio"
        hint="Sin dirección exacta; la coordinamos por WhatsApp."
        error={errors.locationArea}
        className="md:col-span-2"
      >
        <input
          id={fieldId('locationArea')}
          className="field"
          autoComplete="address-level2"
          maxLength={LIMITS.locationArea}
          value={draft.locationArea}
          onChange={(e) => update({ locationArea: e.target.value })}
          aria-invalid={Boolean(errors.locationArea)}
          aria-describedby={describedBy('locationArea', true, errors.locationArea)}
          placeholder="Ej.: Envigado, Zúñiga"
        />
      </Field>

      <Field
        name="notes"
        label="Comentarios o necesidades especiales"
        optional
        hint={`${draft.notes.length}/${LIMITS.notes} · Alergias, referencias de tu look, horario de la ceremonia…`}
        error={errors.notes}
        className="md:col-span-2"
      >
        <textarea
          id={fieldId('notes')}
          className="field min-h-32 resize-y"
          maxLength={LIMITS.notes}
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={describedBy('notes', true, errors.notes)}
          placeholder="Cuéntanos lo que debamos saber"
        />
      </Field>

      <div className="hidden" aria-hidden>
        <label>
          Sitio web
          <input tabIndex={-1} autoComplete="off" value={draft.website} onChange={(e) => update({ website: e.target.value })} />
        </label>
      </div>

      {requiresGuardianConsent(draft.services) && (
        <div className="md:col-span-2">
          <label
            className={cn(
              'flex cursor-pointer items-start gap-4 rounded-2xl border px-5 py-4 transition-colors duration-300 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rose-light',
              errors.guardianConsent
                ? 'border-[#f0a3bb]/60'
                : draft.guardianConsent
                  ? 'border-rose/60 bg-rose/8'
                  : 'border-line',
            )}
          >
            <input
              id={fieldId('guardianConsent')}
              type="checkbox"
              checked={draft.guardianConsent}
              onChange={(e) => update({ guardianConsent: e.target.checked })}
              aria-invalid={Boolean(errors.guardianConsent)}
              aria-describedby={describedBy('guardianConsent', undefined, errors.guardianConsent)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
                draft.guardianConsent ? 'bg-metal border-transparent text-noir' : 'border-rose/50',
              )}
            >
              {draft.guardianConsent && <Check className="size-3.5" />}
            </span>
            <span className="text-sm leading-relaxed text-pearl/85">
              <span className="mb-1 block text-[0.6875rem] tracking-[0.22em] text-rose uppercase">Quinceañera · menor de edad</span>
              Cuento con la autorización del acudiente o representante legal de la quinceañera para agendar esta cita (o soy su
              acudiente o representante).
            </span>
          </label>
          <GroupError name="guardianConsent" error={errors.guardianConsent} />
        </div>
      )}

      <div className="md:col-span-2">
        <label
          className={cn(
            'flex cursor-pointer items-start gap-4 rounded-2xl border px-5 py-4 transition-colors duration-300 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rose-light',
            errors.consent ? 'border-[#f0a3bb]/60' : draft.consent ? 'border-rose/60 bg-rose/8' : 'border-line',
          )}
        >
          <input
            id={fieldId('consent')}
            type="checkbox"
            checked={draft.consent}
            onChange={(e) => update({ consent: e.target.checked })}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy('consent', undefined, errors.consent)}
            className="sr-only"
          />
          <span
            aria-hidden
            className={cn(
              'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
              draft.consent ? 'bg-metal border-transparent text-noir' : 'border-rose/50',
            )}
          >
            {draft.consent && <Check className="size-3.5" />}
          </span>
          <span className="text-sm leading-relaxed text-pearl/85">
            Autorizo a Toro Roso Studio a tratar mis datos personales para gestionar mi cita, de acuerdo con la{' '}
            <Link to="/privacidad" target="_blank" className="text-rose underline underline-offset-4 hover:text-rose-light">
              política de privacidad y tratamiento de datos
            </Link>
            .
          </span>
        </label>
        <GroupError name="consent" error={errors.consent} />
      </div>
    </div>
  )
}

function ReviewBlock({
  title,
  step,
  onEdit,
  children,
}: {
  title: string
  step: Step
  onEdit: (step: Step) => void
  children: ReactNode
}) {
  return (
    <div className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.6875rem] tracking-[0.28em] text-rose uppercase">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-[0.6875rem] tracking-[0.22em] text-smoke uppercase hover:text-pearl"
        >
          Editar
        </button>
      </div>
      <div className="mt-3 text-pearl">{children}</div>
    </div>
  )
}

function ReviewStep({
  draft,
  eventType,
  online,
  onEdit,
}: {
  draft: Draft
  eventType: string
  online: boolean
  onEdit: (step: Step) => void
}) {
  const services = draft.services.filter((s): s is ServiceId => s !== null)
  return (
    <div className="rounded-[1.75rem] border border-rose/25 bg-linear-to-b from-plum-900/80 to-noir/80 p-6 md:p-8">
      <ReviewBlock onEdit={onEdit} title="Servicio" step={0}>
        <ul className="flex flex-col gap-1">
          {services.map((s, i) => (
            <li key={i}>
              Persona {i + 1}: {SERVICES[s].name}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-smoke">Duración estimada: {formatDuration(totalDurationMinutes(services))}</p>
      </ReviewBlock>
      <ReviewBlock onEdit={onEdit} title={online ? 'Fecha y horario' : 'Fecha y hora preferida'} step={1}>
        <p>{draft.date ? capitalize(formatDateLong(draft.date)) : '—'}</p>
        <p className="text-sm text-smoke">
          {draft.time ? `${formatTime(draft.time)}${draft.endTime ? ` – ${formatTime(draft.endTime)}` : ''}` : '—'}
        </p>
      </ReviewBlock>
      <ReviewBlock onEdit={onEdit} title="Tus datos" step={2}>
        <p>{draft.name}</p>
        <p className="text-sm text-smoke">
          {draft.whatsapp}
          {draft.email ? ` · ${draft.email}` : ''}
        </p>
        <p className="mt-2 text-sm text-smoke">
          {eventType} · {draft.locationType ? LOCATION_LABELS[draft.locationType] : ''} · {draft.locationArea}
        </p>
        {requiresGuardianConsent(services) && draft.guardianConsent && (
          <p className="mt-2 flex items-center gap-2 text-sm text-smoke">
            <Check className="size-3.5 text-rose" /> Cuentas con la autorización del acudiente o representante.
          </p>
        )}
        {draft.notes && <p className="mt-2 text-sm whitespace-pre-line text-smoke">“{draft.notes}”</p>}
      </ReviewBlock>
      <p className="mt-2 rounded-2xl bg-noir/50 px-5 py-4 text-sm leading-relaxed text-pearl/85">
        {online
          ? `${bookingPromise(true)} Para grupos de más de ${BOOKING_RULES.maxPeople} personas, escríbenos.`
          : 'Se abrirá WhatsApp con tu solicitud lista para enviar. Tu cita queda confirmada cuando Toro Roso Studio verifique la disponibilidad y te responda.'}
      </p>
    </div>
  )
}
