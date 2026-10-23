import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import type { FaqItem } from '../../config/faq'
import { cn } from '../../lib/cn'
import { EASE_LUXE } from '../fx/Reveal'

/** Acordeón accesible (botones con aria-expanded y regiones asociadas). */
export function Accordion({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen)
  const baseId = useId()
  return (
    <div className="border-y border-line">
      {items.map((item, index) => {
        const isOpen = open === index
        const buttonId = `${baseId}-q${index}`
        const panelId = `${baseId}-a${index}`
        return (
          <div key={item.q} className={cn('border-line', index > 0 && 'border-t')}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
                className="group flex w-full items-center gap-5 py-6 text-left md:gap-8 md:py-7"
              >
                <span className="w-7 shrink-0 font-display text-xs text-rose/70 tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'flex-1 font-display text-[1.05rem] tracking-[0.03em] transition-colors duration-300 md:text-xl',
                    isOpen ? 'text-rose-light' : 'text-pearl group-hover:text-rose-light',
                  )}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'relative grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-luxe',
                    isOpen ? 'rotate-45 border-rose bg-rose/15' : 'border-rose/35 group-hover:border-rose',
                  )}
                >
                  <span className="absolute h-px w-3.5 bg-rose" />
                  <span className="absolute h-3.5 w-px bg-rose" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE_LUXE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pr-14 pb-7 pl-12 leading-relaxed text-smoke md:pl-15 md:text-[1.05rem]">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
