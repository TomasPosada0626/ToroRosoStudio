import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import {
  CATEGORY_LABELS,
  PORTFOLIO,
  PORTFOLIO_FILTERS,
  type PortfolioFilter,
  type PortfolioItem,
} from '../../config/portfolio'
import { cn } from '../../lib/cn'
import { EASE_LUXE } from '../fx/Reveal'
import { ArrowUpRight } from '../ui/Icons'
import { SmartImage } from '../ui/SmartImage'
import { Lightbox } from './Lightbox'

/* Proporción de cada foto en la galería tipo revista (masonry por columnas, sin huecos). */
const SHAPES: Record<PortfolioItem['shape'], string> = {
  portrait: 'aspect-4/5',
  tall: 'aspect-2/3',
  wide: 'aspect-4/3',
}

export function PortfolioGallery({
  limit,
  filter: controlledFilter,
  onFilterChange,
  lockedCategory,
  showFilters = true,
}: {
  limit?: number
  filter?: PortfolioFilter
  onFilterChange?: (filter: PortfolioFilter) => void
  /** Muestra solo una categoría y oculta los filtros. */
  lockedCategory?: Exclude<PortfolioFilter, 'todo'>
  showFilters?: boolean
}) {
  const groupId = useId()
  const [internalFilter, setInternalFilter] = useState<PortfolioFilter>('todo')
  const filter = lockedCategory ?? controlledFilter ?? internalFilter
  const setFilter = (next: PortfolioFilter) => {
    setInternalFilter(next)
    onFilterChange?.(next)
  }
  const [open, setOpen] = useState<number | null>(null)

  const items = useMemo(() => {
    const list = filter === 'todo' ? PORTFOLIO : PORTFOLIO.filter((i) => i.category === filter)
    return limit ? list.slice(0, limit) : list
  }, [filter, limit])
  const hasDemo = items.some((i) => i.photo.demo)

  return (
    <LayoutGroup id={groupId}>
      {showFilters && !lockedCategory && (
        <div
          role="group"
          aria-label="Filtrar portafolio por categoría"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:justify-center md:px-0"
        >
          {PORTFOLIO_FILTERS.map((f) => {
            const active = f.id === filter
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'relative shrink-0 rounded-full border px-5 py-2.5 text-[0.6875rem] font-medium tracking-[0.24em] uppercase transition-colors duration-300',
                  active ? 'border-transparent text-noir' : 'border-rose/25 text-pearl/75 hover:border-rose/60 hover:text-pearl',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="portfolio-filter"
                    className="bg-metal absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {hasDemo && (
        <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-smoke/80">
          Galería de referencia: imágenes ilustrativas de bancos de fotografía libres. Muy pronto verás aquí los
          trabajos reales de Toro Roso Studio.
        </p>
      )}

      <motion.ul layout className="mt-10 columns-2 gap-3 md:columns-3 md:gap-4 xl:columns-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item, index) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.6, ease: EASE_LUXE }}
              className={cn('mb-3 break-inside-avoid md:mb-4', SHAPES[item.shape])}
            >
              <button
                type="button"
                onClick={() => setOpen(index)}
                data-cursor="Ver"
                aria-label={`Ampliar imagen: ${item.photo.alt}`}
                className="group relative block h-full w-full overflow-hidden rounded-[1.1rem] md:rounded-[1.4rem]"
              >
                <SmartImage
                  photo={item.photo}
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                  baseWidth={720}
                  className="transition-transform duration-1400 ease-luxe group-hover:scale-[1.07]"
                />
                <span className="absolute inset-0 bg-linear-to-t from-noir/85 via-noir/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                <span className="absolute inset-x-3 bottom-3 flex translate-y-2 items-end justify-between text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 md:inset-x-4 md:bottom-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[0.6875rem] tracking-[0.16em] text-rose-light uppercase md:tracking-[0.28em]">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs text-pearl/90">{item.photo.alt}</span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-pearl" />
                </span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <Lightbox items={items} index={open} onChange={setOpen} />
    </LayoutGroup>
  )
}
