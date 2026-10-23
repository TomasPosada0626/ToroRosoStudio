import { useState, type ImgHTMLAttributes } from 'react'
import type { Photo } from '../../config/media'
import { cn } from '../../lib/cn'
import { DEFAULT_WIDTHS, imageSrcSet, imageUrl } from '../../lib/image'
import { Sparkle } from './Sparkle'

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  photo: Photo
  /** Ancho aproximado en pantalla, para elegir el tamaño correcto. */
  sizes?: string
  priority?: boolean
  /** Ancho por defecto de `src` (navegadores sin srcset). */
  baseWidth?: number
  /** Muestra la etiqueta "Imagen de referencia" si es demostrativa. */
  showDemoBadge?: boolean
  wrapperClassName?: string
}

/** Imagen responsiva con carga diferida, aparición suave y respaldo si falla. */
export function SmartImage({
  photo,
  sizes = '100vw',
  priority = false,
  baseWidth = 1280,
  showDemoBadge = false,
  className,
  wrapperClassName,
  style,
  ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <span className={cn('relative block h-full w-full overflow-hidden bg-plum-900', wrapperClassName)}>
      {failed ? (
        <span className="satin-fallback absolute inset-0 grid place-items-center text-rose/60" role="img" aria-label={photo.alt}>
          <Sparkle className="size-6" />
        </span>
      ) : (
        <img
          src={imageUrl(photo.src, baseWidth)}
          srcSet={imageSrcSet(photo.src, DEFAULT_WIDTHS)}
          sizes={sizes}
          alt={photo.alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover transition-[opacity,filter] duration-1200 ease-luxe',
            loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md',
            className,
          )}
          style={{ objectPosition: photo.position, ...style }}
          {...rest}
        />
      )}
      {showDemoBadge && photo.demo && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-noir/65 px-2.5 py-1 text-[0.6875rem] tracking-[0.18em] text-pearl/80 uppercase backdrop-blur-sm">
          Imagen de referencia
        </span>
      )}
    </span>
  )
}
