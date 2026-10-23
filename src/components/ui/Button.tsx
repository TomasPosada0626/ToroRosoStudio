import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'outline' | 'ghost' | 'dark'
type Size = 'md' | 'lg' | 'sm'

const BASE =
  'relative inline-flex select-none items-center justify-center gap-3 rounded-full font-sans text-[0.72rem] font-medium whitespace-nowrap uppercase tracking-[0.28em] transition-[transform,box-shadow,background-color,border-color,color] duration-500 ease-luxe disabled:pointer-events-none disabled:opacity-45'

const VARIANTS: Record<Variant, string> = {
  primary:
    'shine bg-metal text-noir shadow-[0_12px_40px_-14px_rgba(183,131,157,0.75)] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-14px_rgba(217,177,198,0.85)] active:translate-y-0',
  outline: 'border border-rose/45 text-pearl hover:border-rose hover:bg-rose/10',
  dark: 'bg-noir text-pearl border border-rose/30 hover:border-rose hover:text-rose-light',
  ghost: 'px-0! text-rose hover:text-rose-light',
}

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-5 text-[0.6875rem]',
  md: 'h-12 px-7',
  lg: 'h-14 px-9 md:h-15 md:px-10',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(BASE, VARIANTS[variant], variant === 'ghost' ? '' : SIZES[size], className)
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

/** Enlace con forma de botón. Usa <Link> para rutas internas y <a> para externas. */
export function ButtonLink({
  to,
  variant,
  size,
  className,
  children,
  ...rest
}: CommonProps & { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const classes = buttonClass(variant, size, className)
  if (/^(https?:|mailto:|tel:)/.test(to)) {
    const external = to.startsWith('http')
    return (
      <a href={to} className={classes} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={classes} {...rest}>
      {children}
    </Link>
  )
}

export function Button({
  variant,
  size,
  className,
  children,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}
