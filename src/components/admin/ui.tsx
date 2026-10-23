import { AnimatePresence, motion } from 'motion/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react'
import { formatCOP, parseCOP } from '../../../shared/billing'
import { cn } from '../../lib/cn'
import { EASE_LUXE } from '../fx/Reveal'
import { Close } from '../ui/Icons'
import { STATUS_LABEL, STATUS_STYLE, type ViewStatus } from './model'

export const labelClass = 'text-[0.6875rem] font-medium tracking-[0.22em] text-pearl/80 uppercase'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-3xl border border-line bg-linear-to-b from-plum-900/70 to-noir p-5 md:p-7', className)}>
      {children}
    </div>
  )
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl tracking-[0.06em] text-pearl uppercase md:text-2xl">{title}</h2>
        {hint && <p className="mt-1 text-sm text-smoke">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatusPill({ status, className }: { status: ViewStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[0.6875rem] tracking-[0.16em] whitespace-nowrap uppercase',
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  highlight = false,
  onClick,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
  hint?: ReactNode
  highlight?: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-3xl border p-4 text-left transition md:p-5',
        highlight ? 'border-rose bg-rose/10 shadow-[0_0_40px_-22px_rgba(217,177,198,0.8)]' : 'border-line bg-plum-900/40',
        onClick && 'hover:border-rose/60',
      )}
    >
      <span className="flex items-start gap-2 text-[0.6875rem] leading-snug tracking-[0.14em] text-smoke uppercase md:tracking-[0.18em]">
        <Icon className="size-4 shrink-0 text-rose" /> <span>{label}</span>
      </span>
      <span className="font-display text-2xl leading-none text-pearl tabular-nums md:text-3xl">{value}</span>
      {hint && <span className="text-xs leading-snug text-smoke">{hint}</span>}
    </Tag>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: ReactNode }[]
  label: string
  className?: string
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex rounded-full border border-line bg-noir/60 p-1', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-full px-4 py-2 text-[0.6875rem] tracking-[0.16em] whitespace-nowrap uppercase transition',
            value === option.value ? 'bg-metal text-noir' : 'text-pearl/75 hover:text-pearl',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Campo de pesos: muestra "$ 150.000" y entrega el número (o null si está vacío). */
export function MoneyInput({
  value,
  onChange,
  id,
  placeholder = '$ 0',
  autoFocus,
}: {
  value: number | null
  onChange: (value: number | null) => void
  id?: string
  placeholder?: string
  autoFocus?: boolean
}) {
  const [text, setText] = useState(value === null ? '' : formatCOP(value))
  useEffect(() => setText(value === null ? '' : formatCOP(value)), [value])
  return (
    <input
      id={id}
      inputMode="numeric"
      className="field tabular-nums"
      placeholder={placeholder}
      autoFocus={autoFocus}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onChange(parseCOP(e.target.value))
      }}
      onBlur={() => setText(value === null ? '' : formatCOP(value))}
    />
  )
}

/** Panel lateral (pantalla completa en celular). */
export function Sheet({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  // El efecto depende solo de `open`: así el foco no salta cuando el contenido se actualiza.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      previous?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] print:hidden">
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-noir/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            data-lenis-prevent
            className={cn(
              'absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto border-l border-line bg-[linear-gradient(180deg,#120912,#070407)] outline-none',
              wide ? 'max-w-3xl' : 'max-w-xl',
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: EASE_LUXE }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-[#0f080f]/95 px-5 py-4 backdrop-blur md:px-7">
              <p className="truncate font-display text-lg tracking-[0.06em] text-pearl uppercase">{title}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-rose/30 text-pearl hover:border-rose"
              >
                <Close className="size-4" />
              </button>
            </div>
            <div className="flex-1 px-5 py-6 md:px-7">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ── Avisos breves ──────────────────────────────────────────────── */

interface Toast {
  id: number
  message: string
  action?: { label: string; href: string }
}

const ToastContext = createContext<(message: string, action?: Toast['action']) => void>(() => undefined)
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((message: string, action?: Toast['action']) => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list.slice(-2), { id, message, action }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), action ? 9000 : 4500)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4 print:hidden">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pointer-events-auto flex max-w-lg flex-wrap items-center gap-3 rounded-2xl border border-rose/40 bg-[#160b15] px-5 py-3.5 text-sm text-pearl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
            >
              <span>{toast.message}</span>
              {toast.action && (
                <a
                  href={toast.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-metal rounded-full px-4 py-1.5 text-xs font-medium text-noir"
                >
                  {toast.action.label}
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-rose/25 px-6 py-10 text-center">
      <p className="text-metal font-script text-3xl">{title}</p>
      <p className="mt-2 text-sm text-smoke">{text}</p>
    </div>
  )
}
