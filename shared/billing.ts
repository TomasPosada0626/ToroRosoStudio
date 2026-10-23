import type { AgendaItem, PaymentKind } from './types.js'

/*
 * Cobros del panel: valor acordado, anticipo y pago final. El cobro en sí se coordina por
 * WhatsApp; aquí Manuela solo lleva la cuenta. Todo en pesos colombianos sin decimales.
 */

export const PAYMENT_KINDS: Record<PaymentKind, string> = {
  anticipo: 'Anticipo',
  saldo: 'Pago final',
  otro: 'Otro pago',
}

export const PAYMENT_METHODS = ['Transferencia', 'Efectivo'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const MAX_AMOUNT = 100_000_000

const copFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

/** "$ 150.000" */
export const formatCOP = (value: number) => copFormat.format(value).replace(/ /g, ' ')

/** "150.000" → 150000 (acepta puntos, comas y el signo $). null si no es un monto válido. */
export function parseCOP(input: string): number | null {
  const digits = input.replace(/[^\d]/g, '')
  if (!digits) return null
  const value = Number(digits)
  return Number.isSafeInteger(value) && value <= MAX_AMOUNT ? value : null
}

export interface BillingSummary {
  price: number | null
  paid: number
  /** Saldo pendiente (null si aún no hay precio). Nunca negativo. */
  balance: number | null
  depositPaid: boolean
  /** Pagado por completo (con precio definido). */
  settled: boolean
}

export function billingOf(item: Pick<AgendaItem, 'price' | 'payments'>): BillingSummary {
  const paid = item.payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = item.price === null ? null : Math.max(0, item.price - paid)
  return {
    price: item.price,
    paid,
    balance,
    depositPaid: item.payments.some((p) => p.kind === 'anticipo'),
    settled: item.price !== null && item.price > 0 && paid >= item.price,
  }
}
