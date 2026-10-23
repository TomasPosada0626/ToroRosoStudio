import { useId } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

/**
 * Sello circular giratorio con texto, que lleva a la agenda.
 * El tamaño y la posición los define quien lo usa (ej.: "absolute -bottom-12 -left-6 size-32");
 * el interior se escala en proporción.
 */
export function RotatingBadge({
  to = '/agenda',
  text = 'AGENDA TU CITA ✦ TORO ROSO STUDIO ✦ ',
  className = 'relative size-32 md:size-36',
}: {
  to?: string
  text?: string
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  return (
    <Link
      to={to}
      aria-label="Agenda tu cita"
      data-cursor="Agendar"
      className={cn('group grid place-items-center rounded-full', className)}
    >
      <span className="absolute inset-0 rounded-full bg-noir/50 backdrop-blur-md" />
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-spin-slow" aria-hidden>
        <defs>
          <path id={`badge-${id}`} d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
        </defs>
        <text className="fill-pearl font-display text-[14.5px] tracking-[0.3em]">
          <textPath href={`#badge-${id}`}>{text}</textPath>
        </text>
      </svg>
      <span className="relative grid size-[44%] place-items-center rounded-full border border-rose/40 bg-noir transition duration-700 ease-luxe group-hover:scale-110 group-hover:border-rose">
        <img src="/brand/mark-160.webp" alt="" width={160} height={112} className="w-[64%]" />
      </span>
    </Link>
  )
}
