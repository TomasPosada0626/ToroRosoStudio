import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { FadeUp, RevealLines } from '../fx/Reveal'
import { Sparkle } from './Sparkle'

/**
 * Encabezado de sección con la tipografía de la marca:
 * título en romanas (como "TORO ROSO") + frase en caligrafía (como "de Maquillaje").
 */
export function SectionHeading({
  eyebrow,
  title,
  script,
  intro,
  align = 'center',
  as = 'h2',
  className,
  size = 'lg',
}: {
  eyebrow?: string
  title: string
  script?: string
  intro?: ReactNode
  align?: 'center' | 'left'
  as?: 'h1' | 'h2'
  className?: string
  size?: 'lg' | 'xl'
}) {
  const Heading = as
  const centered = align === 'center'
  return (
    <div className={cn('flex flex-col', centered ? 'items-center text-center' : 'items-start text-left', className)}>
      {eyebrow && (
        <FadeUp>
          <p className="eyebrow flex items-center gap-3 text-rose">
            <Sparkle className="size-2.5" />
            {eyebrow}
            {centered && <Sparkle className="size-2.5" />}
          </p>
        </FadeUp>
      )}
      <Heading
        className={cn(
          'mt-5 font-display font-normal tracking-[0.05em] text-pearl uppercase',
          // En celulares angostos el tamaño baja con el ancho para que palabras largas ("Graduaciones") no se corten.
          size === 'xl'
            ? 'text-[clamp(1.9rem,10.6vw,2.6rem)] leading-[0.92] sm:text-[clamp(2.6rem,8.4vw,7rem)]'
            : 'text-[clamp(1.8rem,9.2vw,2.2rem)] leading-[0.96] sm:text-[clamp(2.2rem,5.4vw,4.6rem)]',
        )}
      >
        <RevealLines lines={[title]} />
        {script && (
          <RevealLines
            lines={[script]}
            delay={0.15}
            className="-mt-[0.18em]"
            lineClassName="text-metal font-script text-[0.66em] leading-[1.15] normal-case tracking-normal px-[0.1em]"
          />
        )}
      </Heading>
      {intro && (
        <FadeUp delay={0.2} className={cn('mt-6 max-w-xl text-base leading-relaxed text-smoke md:text-lg', centered && 'mx-auto')}>
          {intro}
        </FadeUp>
      )}
    </div>
  )
}
