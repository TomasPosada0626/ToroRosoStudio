import { useState } from 'react'
import { cn } from '../../lib/cn'

/** Logo horizontal para la navegación: isotipo del toro + "TORO ROSO / STUDIO". */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <img src="/brand/mark-160.webp" alt="" width={160} height={112} className="h-8 w-auto md:h-9" />
      <span className="flex flex-col leading-none">
        <span className="text-metal font-display text-[0.98rem] font-semibold tracking-[0.16em] md:text-[1.06rem]">
          TORO ROSO
        </span>
        <span className="mt-1.5 flex items-center gap-1.5 text-[0.5rem] font-medium tracking-[0.62em] text-rose/90">
          <span className="h-px w-3 bg-rose/50" />
          STUDIO
          <span className="h-px w-3 bg-rose/50" />
        </span>
      </span>
    </span>
  )
}

/** Mismos candidatos que el preload de la intro en index.html (deben coincidir). */
export const LOGO_SRCSET = '/brand/logo-640.webp 640w, /brand/logo-1000.webp 1000w, /brand/logo-1600.webp 1600w'

/** Logo completo con un destello que recorre el cromado de las letras. */
export function LogoShine({
  className,
  eager = false,
  sizes = '(min-width: 565px) 440px, 78vw',
}: {
  className?: string
  eager?: boolean
  /** Ancho con el que se muestra, para que el navegador descargue el tamaño justo. */
  sizes?: string
}) {
  // El destello usa como máscara la misma imagen que eligió el navegador: no hay descargas extra.
  const [mask, setMask] = useState<string | null>(null)
  const capture = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth) setMask(img.currentSrc)
  }
  return (
    <span className={cn('relative block', className)}>
      <img
        ref={capture}
        src="/brand/logo-1000.webp"
        srcSet={LOGO_SRCSET}
        sizes={sizes}
        alt="Toro Roso Studio"
        width={1606}
        height={860}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={(event) => setMask(event.currentTarget.currentSrc)}
        className="block h-auto w-full"
      />
      {mask && (
        <span
          aria-hidden
          className="logo-shine pointer-events-none absolute inset-0"
          style={{
            WebkitMaskImage: `url(${mask})`,
            maskImage: `url(${mask})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
          }}
        />
      )}
    </span>
  )
}
