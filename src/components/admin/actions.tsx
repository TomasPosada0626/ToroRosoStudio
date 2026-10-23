import { useState } from 'react'
import { BOOKING_RULES } from '../../../shared/booking-rules'
import { depositWhatsAppMessage } from '../../../shared/deposit'
import type { AgendaItem } from '../../../shared/types'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { WhatsAppIcon } from '../ui/Icons'
import { useAdminData } from './AdminData'
import { firstName, waUrl, whenLong } from './model'
import { labelClass, useToast } from './ui'

/** Confirmar, rechazar y cancelar, con avisos y el paso siguiente (anticipo) a un toque. */
export function useBookingActions() {
  const { upsert } = useAdminData()
  const toast = useToast()

  const confirm = async (item: AgendaItem) => {
    try {
      const response = await api.admin.confirm(item.id)
      upsert(response.item)
      const deposit = BOOKING_RULES.depositRequired && response.item.clientWhatsapp
      toast(
        `Cita de ${firstName(item)} confirmada${response.notified ? ' y avisada por correo' : ''}.`,
        deposit
          ? { label: 'Coordinar anticipo', href: waUrl(response.item.clientWhatsapp!, depositWhatsAppMessage(response.item)) }
          : undefined,
      )
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo confirmar.')
      return false
    }
  }

  const cancel = async (item: AgendaItem, reason: string, notifyClient: boolean) => {
    try {
      const response = await api.admin.cancel(item.id, notifyClient, reason.trim() || undefined)
      upsert(response.item)
      const what = item.status === 'pending' ? 'Solicitud rechazada' : 'Cita cancelada'
      toast(`${what}. El horario quedó libre${response.notified ? ' y la clienta recibió el correo' : ''}.`)
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo completar la acción.')
      return false
    }
  }

  return { confirm, cancel }
}

const REJECT_SUGGESTIONS = [
  'Ya tengo otra cita en ese horario.',
  'No alcanzo a llegar por el desplazamiento.',
  'Esa fecha no tengo disponibilidad.',
]

/** Formulario de rechazo o cancelación con motivo (se incluye en el correo a la clienta). */
export function CancelForm({ item, onDone, onBack }: { item: AgendaItem; onDone: () => void; onBack: () => void }) {
  const { cancel } = useBookingActions()
  const pending = item.status === 'pending'
  const [reason, setReason] = useState('')
  const [notify, setNotify] = useState(Boolean(item.clientEmail))
  const [busy, setBusy] = useState(false)
  const verb = pending ? 'rechazo' : 'cancelación'
  const whatsappText = `Hola, ${firstName(item)}. Te escribo de Toro Roso Studio sobre tu ${
    pending ? 'solicitud' : 'cita'
  } del ${whenLong(item)}. Lamentablemente no podemos atenderte en ese horario.${reason.trim() ? ` ${reason.trim()}` : ''} ¿Te gustaría que busquemos otra fecha?`

  return (
    <div className="rounded-2xl border border-[#f0a3bb]/35 bg-[#f0a3bb]/5 p-4">
      <label className="flex flex-col gap-2.5">
        <span className={labelClass}>
          Motivo del {verb} {item.clientEmail ? '(se incluye en el correo)' : '(opcional)'}
        </span>
        <textarea
          className="field min-h-24 resize-y"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Escribe el motivo o elige uno de abajo"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {REJECT_SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => setReason(text)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition',
              reason === text ? 'border-rose bg-rose/15 text-pearl' : 'border-line text-smoke hover:border-rose/50 hover:text-pearl',
            )}
          >
            {text}
          </button>
        ))}
      </div>
      {item.clientEmail ? (
        <label className="mt-4 flex items-center gap-3 text-sm text-pearl">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-rose" />
          Enviarle el correo a {item.clientEmail}
        </label>
      ) : (
        <p className="mt-4 text-xs text-smoke">No dejó correo: después de {pending ? 'rechazar' : 'cancelar'}, avísale por WhatsApp.</p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const ok = await cancel(item, reason, notify)
            setBusy(false)
            if (ok) onDone()
          }}
        >
          {busy ? 'Guardando…' : pending ? 'Rechazar solicitud' : 'Cancelar cita'}
        </Button>
        {item.clientWhatsapp && (
          <a
            href={waUrl(item.clientWhatsapp, whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-rose/35 px-4 py-2 text-xs text-pearl hover:border-rose"
          >
            <WhatsAppIcon className="size-4 text-rose" /> Avisar por WhatsApp
          </a>
        )}
        <button type="button" onClick={onBack} className="text-[0.6875rem] tracking-[0.2em] text-smoke uppercase hover:text-pearl">
          Volver
        </button>
      </div>
    </div>
  )
}
