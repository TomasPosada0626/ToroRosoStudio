import { cn } from '../../lib/cn'

/** Destello de cuatro puntas ✦, motivo gráfico de la marca. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-3 fill-current', className)}>
      <path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0Z" />
    </svg>
  )
}

/** Separador "———— ✦ ————" como en las piezas gráficas de Toro Roso Studio. */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex w-full max-w-md items-center gap-4 text-rose', className)}>
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-rose/50 to-rose/70" />
      <Sparkle className="size-3.5 shrink-0" />
      <span className="h-px flex-1 bg-linear-to-l from-transparent via-rose/50 to-rose/70" />
    </div>
  )
}
