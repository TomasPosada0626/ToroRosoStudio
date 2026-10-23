import type { ReactNode } from 'react'
import type { ServiceId } from '../../../shared/booking-rules'
import { cn } from '../../lib/cn'

/* Íconos de línea de los servicios, inspirados en la pieza "Servicios de Maquillaje". */
const PATHS: Record<ServiceId, ReactNode> = {
  novias: (
    <>
      <circle cx="24" cy="17.5" r="6" />
      <path d="M18.6 14.6c1.6-3.3 9.2-3.3 10.8 0" />
      <circle cx="24" cy="9.6" r="1.1" />
      <path d="M20 11.8c-5 2.6-7.4 9-8.1 16.4-.6 6-2.3 10.4-4.3 12.8" />
      <path d="M28 11.8c5 2.6 7.4 9 8.1 16.4.6 6 2.3 10.4 4.3 12.8" />
      <path d="M15.6 41.2c.8-7.1 4-11.4 8.4-11.4s7.6 4.3 8.4 11.4" />
    </>
  ),
  prueba: (
    <>
      <path d="M9.5 38.5 22.6 25.4" />
      <path d="m20.9 23.7 3.4 3.4" />
      <path d="M23.4 24.6c2.4-6.4 7.7-11.7 15.1-14.1-2.4 7.4-7.7 12.7-14.1 15.1Z" />
      <path d="m12.5 8.5 1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2Z" />
      <path d="m36.5 31.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
    </>
  ),
  quinceaneras: (
    <>
      <path d="M8.5 33.8c6-3.1 25-3.1 31 0" />
      <path d="M9.4 33.2 12 22.6l6.2 5.7L24 15.2l5.8 13.1 6.2-5.7 2.6 10.6" />
      <circle cx="24" cy="11.6" r="1.8" />
      <circle cx="11.6" cy="20.6" r="1.2" />
      <circle cx="36.4" cy="20.6" r="1.2" />
      <circle cx="18" cy="31.4" r=".7" />
      <circle cx="24" cy="30.9" r=".9" />
      <circle cx="30" cy="31.4" r=".7" />
    </>
  ),
  social: (
    <>
      <circle cx="24" cy="17.6" r="6" />
      <path d="M17.7 16.4c1.2-4.5 3.9-6.9 6.3-6.9s5.1 2.4 6.3 6.9" />
      <path d="M17.8 17.2c-.6 5.8-2.3 9.4-4.5 11.8 2.8.5 5.2-.2 6.8-1.6" />
      <path d="M30.2 17.2c.6 5.8 2.3 9.4 4.5 11.8-2.8.5-5.2-.2-6.8-1.6" />
      <path d="M14.2 41.2c1-6.4 4.8-10 9.8-10s8.8 3.6 9.8 10" />
    </>
  ),
  artistico: (
    <>
      <path d="M6.2 21.6c0-4.1 3.5-6.4 8.3-5.9 3.9.4 6.8 2.2 9.5 4.6 2.7-2.4 5.6-4.2 9.5-4.6 4.8-.5 8.3 1.8 8.3 5.9 0 6.1-4.5 9.9-9.9 9.9-3.5 0-5.9-1.8-7.9-4.4-2 2.6-4.4 4.4-7.9 4.4-5.4 0-9.9-3.8-9.9-9.9Z" />
      <path d="M11.6 22.6c1.6-2.4 5.6-2.6 7.6 0-2 2.4-5.8 2.4-7.6 0Z" />
      <path d="M28.8 22.6c2-2.6 6-2.4 7.6 0-1.8 2.4-5.6 2.4-7.6 0Z" />
      <path d="M24 16.2c-.7-3.7.5-6.8 3.7-8.8" />
      <path d="M37.6 30.6 40.8 40" />
    </>
  ),
  graduaciones: (
    <>
      <path d="M4.5 19.6 24 11.2l19.5 8.4L24 28Z" />
      <path d="M12.6 23.2v7.3c3 2.6 7 3.9 11.4 3.9s8.4-1.3 11.4-3.9v-7.3" />
      <path d="M39.6 21.3v9.4" />
      <path d="m39.6 30.7-1.6 4.3h3.2Z" />
    </>
  ),
}

export function ServiceGlyph({ id, className }: { id: ServiceId; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('size-8', className)}
    >
      {PATHS[id]}
    </svg>
  )
}

/** Ícono dentro de un círculo fino metálico, como en la pieza oficial de servicios. */
export function ServiceIcon({ id, className, size = 'md' }: { id: ServiceId; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'size-11' : size === 'lg' ? 'size-24' : 'size-16'
  const glyph = size === 'sm' ? 'size-6' : size === 'lg' ? 'size-12' : 'size-8'
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full border border-rose/45 bg-noir/40 text-rose shadow-[inset_0_0_24px_rgba(183,131,157,0.14)]',
        dims,
        className,
      )}
    >
      <span aria-hidden className="absolute inset-0.75 rounded-full border border-rose/15" />
      <ServiceGlyph id={id} className={glyph} />
    </span>
  )
}
