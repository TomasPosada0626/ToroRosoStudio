import type { ComponentType, ReactNode, SVGProps } from 'react'
import { BOOKING_RULES, SERVICE_NAMES, totalDurationMinutes, type ServiceId } from '../../../shared/booking-rules'
import { capitalize, formatDateLong, formatDuration, formatTime } from '../../../shared/time'
import { LOCATION_LABELS, type LocationType } from '../../../shared/validation'
import { Calendar, Clock, MapPin, Users } from '../ui/Icons'
import { ServiceGlyph } from '../ui/ServiceIcon'
import { Sparkle } from '../ui/Sparkle'

export interface SummaryData {
  services: (ServiceId | null)[]
  date: string | null
  time: string | null
  endTime: string | null
  locationType: LocationType | ''
  locationArea: string
}

function Row({ icon: Icon, label, children }: { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-line py-4 first:border-t-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-rose" />
      <div className="min-w-0">
        <dt className="text-[0.6875rem] tracking-[0.22em] text-smoke uppercase">{label}</dt>
        <dd className="mt-1 text-sm text-pearl">{children}</dd>
      </div>
    </div>
  )
}

/** Texto que explica qué pasa al enviar la cita, según el modo de la agenda. */
export function bookingPromise(onlineMode: boolean): string {
  const deposit = BOOKING_RULES.depositRequired
  if (!onlineMode) return 'Tu cita queda confirmada cuando Toro Roso Studio verifique la disponibilidad y te responda.'
  if (BOOKING_RULES.approval === 'manual') {
    return deposit
      ? 'Al enviar, tu horario queda apartado a tu nombre. Manuela te confirma la fecha y luego coordina contigo por WhatsApp el anticipo que la separa.'
      : 'Al enviar, tu horario queda apartado a tu nombre y Manuela te confirma la cita por WhatsApp.'
  }
  return deposit
    ? 'Al confirmar, el horario queda reservado a tu nombre. Luego coordinamos por WhatsApp el anticipo que separa tu fecha.'
    : 'Al confirmar, el horario queda reservado a tu nombre. Luego coordinamos los detalles y la cotización por WhatsApp.'
}

/** Resumen vivo de la cita mientras se completa la agenda. */
export function BookingSummary({ data, onlineMode }: { data: SummaryData; onlineMode: boolean }) {
  const chosen = data.services.filter((s): s is ServiceId => s !== null)
  const complete = chosen.length === data.services.length
  return (
    <aside aria-label="Resumen de tu cita" className="rounded-[1.75rem] border border-line bg-linear-to-b from-plum-900/80 to-noir/90 p-6">
      <p className="eyebrow flex items-center gap-2 text-rose">
        <Sparkle className="size-2.5" /> Tu cita
      </p>
      <p className="text-metal mt-1 font-script text-3xl">Toro Roso Studio</p>
      <dl className="mt-4">
        <Row icon={Users} label={data.services.length === 1 ? 'Persona' : `${data.services.length} personas`}>
          {chosen.length ? (
            <ul className="flex flex-col gap-1.5">
              {data.services.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  {s ? <ServiceGlyph id={s} className="size-4 text-rose" /> : <span className="size-4" />}
                  <span className="text-smoke">{i + 1}.</span> {s ? SERVICE_NAMES[s] : 'Por elegir'}
                </li>
              ))}
            </ul>
          ) : (
            'Por elegir'
          )}
        </Row>
        <Row icon={Clock} label="Duración estimada">
          {complete && chosen.length ? formatDuration(totalDurationMinutes(chosen)) : '—'}
        </Row>
        <Row icon={Calendar} label="Fecha">
          {data.date ? capitalize(formatDateLong(data.date)) : '—'}
        </Row>
        <Row icon={Clock} label={onlineMode ? 'Horario' : 'Hora preferida'}>
          {data.time ? `${formatTime(data.time)}${data.endTime ? ` – ${formatTime(data.endTime)}` : ''}` : '—'}
        </Row>
        <Row icon={MapPin} label="Lugar">
          {data.locationType
            ? `${LOCATION_LABELS[data.locationType]}${data.locationArea ? ` · ${data.locationArea}` : ''}`
            : '—'}
        </Row>
      </dl>
      <p className="mt-2 border-t border-line pt-4 text-xs leading-relaxed text-smoke">{bookingPromise(onlineMode)}</p>
    </aside>
  )
}
