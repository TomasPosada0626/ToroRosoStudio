import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Identificador de cada campo del formulario (usado para enfocar errores). */
export const fieldId = (name: string) => `agenda-${name}`

export const describedBy = (name: string, hint?: ReactNode, error?: string) =>
  error ? `${fieldId(name)}-error` : hint ? `${fieldId(name)}-hint` : undefined

export function Field({
  name,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  name: string
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <label
        htmlFor={fieldId(name)}
        className="flex items-baseline justify-between gap-3 text-[0.6875rem] font-medium tracking-[0.22em] text-pearl/85 uppercase"
      >
        <span>{label}</span>
        {optional && <span className="text-[0.6875rem] tracking-normal text-smoke normal-case">Opcional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${fieldId(name)}-error`} className="text-xs leading-relaxed text-[#f0a3bb]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId(name)}-hint`} className="text-xs leading-relaxed text-smoke">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Error de un grupo de opciones (radio, calendario…). */
export function GroupError({ name, error }: { name: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${fieldId(name)}-error`} className="mt-3 text-xs leading-relaxed text-[#f0a3bb]">
      {error}
    </p>
  )
}
