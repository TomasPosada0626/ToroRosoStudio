import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { BOOKING_RULES } from '../../../shared/booking-rules'
import {
  addDays,
  capitalize,
  daysInMonth,
  formatDateLong,
  formatMonthName,
  toDateKey,
  todayLocal,
  weekdayOf,
} from '../../../shared/time'
import { cn } from '../../lib/cn'
import { EASE_LUXE } from '../fx/Reveal'
import { ChevronLeft, ChevronRight } from '../ui/Icons'

export interface MonthRef {
  year: number
  month: number
}

const WEEKDAYS = [
  { short: 'D', long: 'domingo' },
  { short: 'L', long: 'lunes' },
  { short: 'M', long: 'martes' },
  { short: 'M', long: 'miércoles' },
  { short: 'J', long: 'jueves' },
  { short: 'V', long: 'viernes' },
  { short: 'S', long: 'sábado' },
]

export const monthOf = (date: string): MonthRef => ({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) })
export const monthKeyOf = (m: MonthRef) => `${m.year}-${String(m.month).padStart(2, '0')}`
const shiftMonth = (m: MonthRef, delta: number): MonthRef => {
  const index = m.year * 12 + (m.month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/** Primera y última fecha que pueden tener horarios, según las reglas de la agenda. */
export function bookingDateRange(now = new Date()) {
  return {
    minDate: todayLocal(new Date(now.getTime() + BOOKING_RULES.minNoticeHours * 3_600_000)),
    maxDate: addDays(todayLocal(now), BOOKING_RULES.maxAdvanceDays),
  }
}

/**
 * Calendario estilizado y accesible (patrón de rejilla con teclado).
 * `availability = null` → no hay agenda en línea: se habilitan los días de atención.
 */
export function Calendar({
  value,
  onChange,
  month,
  onMonthChange,
  availability,
  loading,
  minDate,
  maxDate,
}: {
  value: string | null
  onChange: (date: string) => void
  month: MonthRef
  onMonthChange: (month: MonthRef) => void
  availability: Record<string, number> | null
  loading: boolean
  minDate: string
  maxDate: string
}) {
  const id = useId()
  const gridRef = useRef<HTMLDivElement>(null)
  const [direction, setDirection] = useState(0)
  const [focusDate, setFocusDate] = useState<string>(value ?? minDate)
  const today = todayLocal()

  const monthKey = monthKeyOf(month)
  const firstWeekday = weekdayOf(toDateKey(month.year, month.month, 1))
  const total = daysInMonth(month.year, month.month)
  const canPrev = monthKey > minDate.slice(0, 7)
  const canNext = monthKey < maxDate.slice(0, 7)

  const isOpenDay = (date: string) => BOOKING_RULES.weeklyHours[weekdayOf(date)] !== null
  const slotsOf = (date: string) => (availability ? (availability[date] ?? 0) : null)
  const isSelectable = (date: string) =>
    date >= minDate && date <= maxDate && isOpenDay(date) && (availability === null || (slotsOf(date) ?? 0) > 0)

  // Mantiene el foco del teclado dentro del mes visible.
  useEffect(() => {
    if (focusDate.slice(0, 7) !== monthKey) {
      const candidate = value?.startsWith(monthKey) ? value : `${monthKey}-01`
      setFocusDate(candidate < minDate ? minDate : candidate)
    }
  }, [monthKey, focusDate, value, minDate])

  const changeMonth = (delta: number) => {
    setDirection(delta)
    onMonthChange(shiftMonth(month, delta))
  }

  const moveFocus = (date: string) => {
    const target = date.slice(0, 7)
    if (target < minDate.slice(0, 7) || target > maxDate.slice(0, 7)) return
    if (target !== monthKey) {
      setDirection(date > focusDate ? 1 : -1)
      onMonthChange(monthOf(date))
    }
    setFocusDate(date)
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus())
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (event.key in moves) {
      event.preventDefault()
      moveFocus(addDays(focusDate, moves[event.key]))
    } else if (event.key === 'Home') {
      event.preventDefault()
      moveFocus(addDays(focusDate, -weekdayOf(focusDate)))
    } else if (event.key === 'End') {
      event.preventDefault()
      moveFocus(addDays(focusDate, 6 - weekdayOf(focusDate)))
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      const target = shiftMonth(monthOf(focusDate), event.key === 'PageUp' ? -1 : 1)
      const day = Math.min(Number(focusDate.slice(8)), daysInMonth(target.year, target.month))
      moveFocus(toDateKey(target.year, target.month, day))
    }
  }

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: total }, (_, i) => toDateKey(month.year, month.month, i + 1)),
  ]

  return (
    <div className="rounded-[1.75rem] border border-line bg-linear-to-b from-plum-900/80 to-noir/80 p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={!canPrev}
          aria-label="Mes anterior"
          className="grid size-11 place-items-center rounded-full border border-rose/30 text-pearl transition hover:border-rose disabled:opacity-25"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h3
          id={`${id}-label`}
          className="flex flex-wrap items-baseline justify-center gap-x-2.5 text-center font-display text-base tracking-[0.12em] text-pearl uppercase min-[380px]:text-lg sm:text-xl"
          aria-live="polite"
        >
          {capitalize(formatMonthName(month.month))}
          <span className="font-sans text-xs font-medium tracking-[0.24em] text-rose">{month.year}</span>
        </h3>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={!canNext}
          aria-label="Mes siguiente"
          className="grid size-11 place-items-center rounded-full border border-rose/30 text-pearl transition hover:border-rose disabled:opacity-25"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 text-center" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d.long} className="pb-2 text-[0.6875rem] font-medium tracking-[0.2em] text-rose/80">
            {d.short}
          </span>
        ))}
      </div>

      <div ref={gridRef} className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={monthKey}
            role="grid"
            aria-labelledby={`${id}-label`}
            onKeyDown={onKeyDown}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -50 : 50, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: EASE_LUXE }}
            className="grid grid-cols-7 gap-y-1.5"
          >
            {cells.map((date, i) => {
              if (!date) return <span key={`empty-${i}`} role="presentation" />
              const selectable = isSelectable(date)
              const selected = value === date
              const slots = slotsOf(date)
              const label = `${capitalize(formatDateLong(date))}${
                !selectable ? ', sin disponibilidad' : slots !== null ? `, ${slots} horarios disponibles` : ''
              }`
              return (
                <div key={date} role="gridcell" className="flex justify-center">
                  <button
                    type="button"
                    data-date={date}
                    tabIndex={date === focusDate ? 0 : -1}
                    aria-label={label}
                    aria-pressed={selected}
                    aria-disabled={!selectable}
                    onClick={() => selectable && onChange(date)}
                    onFocus={() => setFocusDate(date)}
                    className={cn(
                      'relative grid size-10 place-items-center rounded-full text-sm tabular-nums transition-colors duration-300 sm:size-12 sm:text-[0.95rem]',
                      selectable ? 'text-pearl hover:bg-rose/12' : 'cursor-not-allowed text-smoke/30',
                      selected && 'text-noir',
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId={`${id}-selected`}
                        className="bg-metal absolute inset-0 rounded-full shadow-[0_8px_30px_-6px_rgba(217,177,198,0.7)]"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className={cn('relative', selected && 'font-semibold')}>{Number(date.slice(8))}</span>
                    {selectable && !selected && slots !== null && (
                      <span className="absolute bottom-1 size-1 rounded-full bg-rose sm:bottom-1.5" />
                    )}
                    {date === today && !selected && (
                      <span className="absolute inset-1 rounded-full border border-rose/40" aria-hidden />
                    )}
                  </button>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-noir/45 backdrop-blur-[2px]" aria-live="polite">
            <span className="flex items-center gap-3 text-[0.6875rem] tracking-[0.28em] text-pearl uppercase">
              <span className="size-4 animate-spin rounded-full border border-rose/30 border-t-rose" />
              Consultando agenda
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.6875rem] tracking-[0.18em] text-smoke uppercase">
        {availability !== null && (
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-rose" /> Con horarios libres
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full border border-rose/40" /> Hoy
        </span>
      </div>
    </div>
  )
}
