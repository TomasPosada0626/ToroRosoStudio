import { AnimatePresence, motion } from 'motion/react'
import { BOOKING_RULES, describeServices, totalDurationMinutes, type ServiceId } from '../../../shared/booking-rules'
import { formatDuration } from '../../../shared/time'
import { BOOKABLE_SERVICES } from '../../config/services'
import { cn } from '../../lib/cn'
import { contactLink } from '../../lib/whatsapp'
import { EASE_LUXE } from '../fx/Reveal'
import { Check, Minus, Plus } from '../ui/Icons'
import { ServiceGlyph } from '../ui/ServiceIcon'
import { GroupError, fieldId } from './fields'

/** Servicios "protagonistas": sus acompañantes suelen elegir maquillaje social. */
const PROTAGONISTS: ServiceId[] = ['novias', 'prueba', 'quinceaneras', 'graduaciones']
const companionFor = (first: ServiceId | null): ServiceId | null =>
  first === null ? null : PROTAGONISTS.includes(first) ? 'social' : first

/** Número de personas y procedimiento de cada una; calcula la duración total. */
export function PeoplePicker({
  services,
  onChange,
  error,
}: {
  services: (ServiceId | null)[]
  onChange: (next: (ServiceId | null)[]) => void
  error?: string
}) {
  const count = services.length
  const max = BOOKING_RULES.maxPeople
  const complete = services.every(Boolean) ? (services as ServiceId[]) : null
  const group = contactLink(`Hola, Toro Roso Studio ✨ Quiero agendar maquillaje para más de ${max} personas.`)

  const setCount = (next: number) => {
    if (next < 1 || next > max) return
    onChange(
      next > count
        ? [...services, ...Array.from({ length: next - count }, () => companionFor(services[0]))]
        : services.slice(0, next),
    )
  }

  const choose = (index: number, id: ServiceId) => {
    const next = [...services]
    next[index] = id
    if (index === 0) for (let i = 1; i < next.length; i++) next[i] ??= companionFor(id)
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-noir/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id="personas-label" className="font-display text-lg tracking-[0.06em] text-pearl">
            ¿Cuántas personas se maquillarán?
          </p>
          <p className="mt-1 text-xs text-smoke">
            Hasta {max} en línea.{' '}
            <a href={group.href} target="_blank" rel="noopener noreferrer" className="text-rose underline-offset-4 hover:underline">
              ¿Más personas? Escríbenos
            </a>
          </p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto" role="group" aria-labelledby="personas-label">
          <button
            type="button"
            onClick={() => setCount(count - 1)}
            disabled={count <= 1}
            aria-label="Quitar una persona"
            className="grid size-12 place-items-center rounded-full border border-rose/40 text-pearl transition hover:border-rose disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <output aria-live="polite" className="w-10 text-center font-display text-3xl text-pearl tabular-nums">
            {count}
          </output>
          <button
            type="button"
            onClick={() => setCount(count + 1)}
            disabled={count >= max}
            aria-label="Agregar una persona"
            className="grid size-12 place-items-center rounded-full border border-rose/40 text-pearl transition hover:border-rose disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <ol className="mt-6 flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {services.map((current, index) => (
            <motion.li
              key={index}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE_LUXE }}
            >
              <fieldset id={index === 0 ? fieldId('services') : undefined} tabIndex={-1} className="outline-none">
                <legend className="mb-3 flex items-center gap-3">
                  <span className="bg-metal grid size-7 place-items-center rounded-full font-display text-xs text-noir">
                    {index + 1}
                  </span>
                  <span className="text-[0.6875rem] font-medium tracking-[0.22em] text-pearl uppercase">
                    Persona {index + 1}
                    {index === 0 && count > 1 && <span className="text-smoke"> · principal</span>}
                  </span>
                </legend>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {BOOKABLE_SERVICES.map((service) => {
                    const checked = current === service.id
                    return (
                      <label
                        key={service.id}
                        className={cn(
                          'group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-2 py-4 text-center transition-colors duration-300 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rose-light',
                          checked ? 'border-rose bg-rose/12' : 'border-line bg-noir/30 hover:border-rose/50',
                        )}
                      >
                        <input
                          type="radio"
                          name={`persona-${index}`}
                          value={service.id}
                          checked={checked}
                          onChange={() => choose(index, service.id)}
                          className="sr-only"
                        />
                        {checked && (
                          <span className="bg-metal absolute top-2 right-2 grid size-5 place-items-center rounded-full text-noir">
                            <Check className="size-3" />
                          </span>
                        )}
                        <ServiceGlyph id={service.id} className={cn('size-8', checked ? 'text-rose-light' : 'text-rose')} />
                        <span className="text-[0.6875rem] font-medium tracking-[0.14em] text-pearl uppercase">{service.name}</span>
                        <span className="text-xs text-smoke">
                          {formatDuration(BOOKING_RULES.serviceMinutes[service.id])}
                          {service.price ? ` · ${service.price}` : ''}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <GroupError name="services" error={error} />

      <div
        aria-live="polite"
        className="mt-8 flex flex-col gap-1 rounded-3xl border border-rose/25 bg-linear-to-r from-plum-800/60 to-noir/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="text-[0.6875rem] tracking-[0.24em] text-rose uppercase">Duración estimada de la sesión</span>
        <span className="font-display text-xl text-pearl">
          {complete ? formatDuration(totalDurationMinutes(complete)) : '—'}
          {complete && complete.length > 1 && (
            <span className="ml-3 font-sans text-xs text-smoke">{describeServices(complete)}</span>
          )}
        </span>
      </div>
    </div>
  )
}
