import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORY_LABELS, type PortfolioItem } from '../../config/portfolio'
import { imageUrl } from '../../lib/image'
import { EASE_LUXE } from '../fx/Reveal'
import { useScrollLock } from '../providers/SmoothScroll'
import { ChevronLeft, ChevronRight, Close } from '../ui/Icons'

/** Visor a pantalla completa: flechas del teclado, Escape, gestos táctiles y foco atrapado. */
export function Lightbox({
  items,
  index,
  onChange,
}: {
  items: PortfolioItem[]
  index: number | null
  onChange: (index: number | null) => void
}) {
  const open = index !== null && items.length > 0
  const [direction, setDirection] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  useScrollLock(open)

  const go = useCallback(
    (step: number) => {
      if (index === null) return
      setDirection(step)
      onChange((index + step + items.length) % items.length)
    },
    [index, items.length, onChange],
  )
  const close = useCallback(() => onChange(null), [onChange])

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      else if (event.key === 'ArrowRight') go(1)
      else if (event.key === 'ArrowLeft') go(-1)
      else if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]')
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      returnFocus.current?.focus?.()
    }
  }, [open, close, go])

  // Precarga las imágenes vecinas para que la navegación sea instantánea.
  useEffect(() => {
    if (index === null) return
    for (const step of [1, -1]) {
      const neighbor = items[(index + step + items.length) % items.length]
      if (neighbor) new Image().src = imageUrl(neighbor.photo.src, 1600)
    }
  }, [index, items])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -70 || info.velocity.x < -500) go(1)
    else if (info.offset.x > 70 || info.velocity.x > 500) go(-1)
  }

  const item = index !== null ? items[index] : null

  return createPortal(
    <AnimatePresence>
      {open && item && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Galería ampliada"
          className="fixed inset-0 z-85 flex flex-col bg-noir/96 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="container-luxe flex items-center justify-between py-5">
            <p className="font-display text-sm tracking-[0.2em] text-pearl tabular-nums" aria-live="polite">
              {String((index ?? 0) + 1).padStart(2, '0')} <span className="text-rose/60">/</span>{' '}
              {String(items.length).padStart(2, '0')}
              <span className="ml-4 text-[0.6875rem] tracking-[0.28em] text-rose uppercase">{CATEGORY_LABELS[item.category]}</span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Cerrar galería"
              className="grid size-12 place-items-center rounded-full border border-rose/35 text-pearl transition hover:border-rose hover:text-rose-light"
            >
              <Close className="size-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 md:px-24">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={item.id}
                src={imageUrl(item.photo.src, 1600)}
                alt={item.photo.alt}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d >= 0 ? 120 : -120, opacity: 0, scale: 0.96 }),
                  center: { x: 0, opacity: 1, scale: 1 },
                  exit: (d: number) => ({ x: d >= 0 ? -120 : 120, opacity: 0, scale: 0.96 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, ease: EASE_LUXE }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={onDragEnd}
                className="max-h-[calc(100svh-12rem)] max-w-full cursor-grab touch-pan-y rounded-2xl object-contain shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] select-none active:cursor-grabbing"
                draggable={false}
              />
            </AnimatePresence>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Imagen anterior"
              className="absolute top-1/2 left-3 hidden size-14 -translate-y-1/2 place-items-center rounded-full border border-rose/35 bg-noir/60 text-pearl transition hover:border-rose md:grid md:left-8"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Imagen siguiente"
              className="absolute top-1/2 right-3 hidden size-14 -translate-y-1/2 place-items-center rounded-full border border-rose/35 bg-noir/60 text-pearl transition hover:border-rose md:grid md:right-8"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="container-luxe flex flex-col items-center gap-3 py-6 text-center">
            <p className="max-w-2xl text-sm text-pearl/85">{item.photo.alt}</p>
            {item.photo.demo && item.photo.credit && (
              <p className="text-[0.6875rem] tracking-[0.2em] text-smoke uppercase">
                Imagen de referencia ·{' '}
                <a href={item.photo.credit.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                  Foto: {item.photo.credit.source}
                </a>
              </p>
            )}
            <div className="flex gap-3 md:hidden">
              <button type="button" onClick={() => go(-1)} aria-label="Imagen anterior" className="grid size-12 place-items-center rounded-full border border-rose/35">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Imagen siguiente" className="grid size-12 place-items-center rounded-full border border-rose/35">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
