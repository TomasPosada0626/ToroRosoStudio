import { motion } from 'motion/react'
import { formatTime, minutesOf } from '../../../shared/time'
import { cn } from '../../lib/cn'
import { EASE_LUXE } from '../fx/Reveal'
import { Refresh } from '../ui/Icons'

export interface SlotOption {
  time: string
  endTime: string
}

const GROUPS = [
  { label: 'Mañana', test: (m: number) => m < 12 * 60 },
  { label: 'Tarde', test: (m: number) => m >= 12 * 60 && m < 18 * 60 },
  { label: 'Noche', test: (m: number) => m >= 18 * 60 },
]

/** Horarios disponibles agrupados por franja. */
export function SlotPicker({
  slots,
  status,
  error,
  value,
  onChange,
  onRetry,
}: {
  slots: SlotOption[] | null
  status: 'idle' | 'loading' | 'ready' | 'error' | 'offline'
  error: string | null
  value: string | null
  onChange: (slot: SlotOption) => void
  onRetry: () => void
}) {
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true" aria-label="Cargando horarios">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="h-16 animate-pulse rounded-2xl bg-rose/8" />
        ))}
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-line p-6 text-center">
        <p className="text-sm text-smoke">{error ?? 'No pudimos cargar los horarios.'}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 text-[0.6875rem] tracking-[0.24em] text-rose uppercase hover:text-rose-light"
        >
          <Refresh className="size-4" /> Reintentar
        </button>
      </div>
    )
  }
  if (!slots?.length) {
    return (
      <p className="rounded-2xl border border-line p-6 text-center text-sm text-smoke">
        Este día ya no tiene horarios disponibles para la duración de tu cita. Prueba con otra fecha.
      </p>
    )
  }

  let order = 0
  return (
    <div role="radiogroup" aria-label="Horarios disponibles" className="flex flex-col gap-6">
      {GROUPS.map((group) => {
        const list = slots.filter((s) => group.test(minutesOf(s.time)))
        if (!list.length) return null
        return (
          <div key={group.label}>
            <p className="mb-3 text-[0.6875rem] tracking-[0.3em] text-rose/80 uppercase">{group.label}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {list.map((slot) => {
                const selected = value === slot.time
                const delay = Math.min(order++ * 0.025, 0.4)
                return (
                  <motion.button
                    key={slot.time}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange(slot)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE_LUXE, delay }}
                    className={cn(
                      'relative flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors duration-300',
                      selected
                        ? 'bg-metal border-transparent text-noir shadow-[0_10px_30px_-10px_rgba(217,177,198,0.7)]'
                        : 'border-line bg-noir/40 text-pearl hover:border-rose/60',
                    )}
                  >
                    <span className="font-display text-base tracking-[0.04em]">{formatTime(slot.time)}</span>
                    <span className={cn('text-[0.6875rem]', selected ? 'text-noir/70' : 'text-smoke')}>
                      hasta {formatTime(slot.endTime)}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
