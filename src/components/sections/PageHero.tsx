import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { GlitterDust } from '../fx/GlitterDust'
import { SatinCanvas } from '../fx/SatinCanvas'
import { SectionHeading } from '../ui/SectionHeading'

/** Encabezado de las páginas internas, sobre satén en movimiento. */
export function PageHero({
  eyebrow,
  title,
  script,
  intro,
  children,
  className,
}: {
  eyebrow: string
  title: string
  script?: string
  intro?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={cn('relative isolate overflow-hidden pt-36 pb-20 md:pt-48 md:pb-28', className)}>
      <SatinCanvas className="absolute inset-0 -z-20" intensity={0.9} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-noir/20 via-noir/30 to-noir" />
      <GlitterDust className="absolute inset-0 -z-10 h-full w-full" density={0.45} />
      <div className="container-luxe">
        <SectionHeading as="h1" size="xl" eyebrow={eyebrow} title={title} script={script} intro={intro} />
        {children}
      </div>
    </section>
  )
}
