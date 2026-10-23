import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BOOKING_RULES } from '../../shared/booking-rules'
import { capitalize, formatDateLong, todayLocal } from '../../shared/time'
import type { AdminSessionResponse } from '../../shared/types'
import { AdminDataProvider, useAdminData } from '../components/admin/AdminData'
import { AgendaPage } from '../components/admin/AgendaPage'
import { BookingDrawer } from '../components/admin/BookingDrawer'
import { ClientsPage } from '../components/admin/ClientsPage'
import { Card, ToastProvider, labelClass } from '../components/admin/ui'
import { Button } from '../components/ui/Button'
import { Calendar, Lock, Logout, Refresh, Users } from '../components/ui/Icons'
import { LogoLockup } from '../components/ui/Logo'
import { useSeo } from '../hooks/useSeo'
import { ApiRequestError, api } from '../lib/api'
import { cn } from '../lib/cn'

/*
 * Panel privado de Manuela (/admin). No aparece en el menú del sitio ni en Google;
 * solo entra la cuenta administradora (ADMIN_EMAIL + ADMIN_PASSWORD).
 * Dos páginas: Agenda (solicitudes, calendario, bloqueos) y Clientas e ingresos.
 */

const OFFLINE_SESSION: AdminSessionResponse = {
  ok: true,
  configured: false,
  authenticated: false,
  storage: 'none',
  email: false,
  google: false,
  approval: BOOKING_RULES.approval,
  account: null,
}

export default function Admin() {
  useSeo({ path: '/admin' })
  const [session, setSession] = useState<AdminSessionResponse | null>(null)

  const loadSession = useCallback(async () => {
    try {
      setSession(await api.admin.session())
    } catch {
      setSession(OFFLINE_SESSION)
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  if (!session) return <Frame><p className="py-24 text-center text-smoke">Cargando…</p></Frame>
  if (!session.configured) return <Frame><NotConfigured /></Frame>
  if (!session.authenticated) return <Frame><Login onSuccess={loadSession} /></Frame>
  return (
    <ToastProvider>
      <AdminDataProvider>
        <Dashboard
          session={session}
          onLogout={async () => {
            await api.admin.logout().catch(() => undefined)
            loadSession()
          }}
        />
      </AdminDataProvider>
    </ToastProvider>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-noir">
      <header className="border-b border-line">
        <div className="container-luxe flex h-20 items-center">
          <Link to="/" aria-label="Ir al sitio">
            <LogoLockup />
          </Link>
        </div>
      </header>
      <main className="container-luxe py-12">{children}</main>
    </div>
  )
}

function NotConfigured() {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <Lock className="mx-auto size-8 text-rose" />
      <h1 className="mt-6 font-display text-2xl tracking-[0.06em] text-pearl uppercase">Panel no configurado</h1>
      <p className="mt-4 leading-relaxed text-smoke">
        Para activarlo, configura en Vercel <code className="text-rose-light">ADMIN_EMAIL</code> (el correo de Manuela) y{' '}
        <code className="text-rose-light">ADMIN_PASSWORD</code> (mínimo 10 caracteres), y conecta la base de datos. Los pasos
        están en el README del proyecto.
      </p>
    </Card>
  )
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.admin.login(email, password)
      onSuccess()
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'No fue posible iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card className="mx-auto max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="text-center">
          <Lock className="mx-auto size-7 text-rose" />
          <h1 className="mt-5 font-display text-2xl tracking-[0.08em] text-pearl uppercase">Panel privado</h1>
          <p className="text-metal font-script text-3xl">Toro Roso Studio</p>
        </div>
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>Correo</span>
          <input
            type="email"
            className="field"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={Boolean(error)}
          />
        </label>
        <label className="flex flex-col gap-2.5">
          <span className={labelClass}>Contraseña</span>
          <input
            type="password"
            className="field"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-invalid={Boolean(error)}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-[#f0a3bb]">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !email || !password}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </Card>
  )
}

type Page = 'agenda' | 'clientas'

function Dashboard({ session, onLogout }: { session: AdminSessionResponse; onLogout: () => void }) {
  const [params, setParams] = useSearchParams()
  const page: Page = params.get('vista') === 'clientas' ? 'clientas' : 'agenda'
  const { items, status, error, reload } = useAdminData()
  const pendingCount = items.filter((i) => i.status === 'pending').length
  const go = (next: Page) => {
    setParams(next === 'agenda' ? {} : { vista: next }, { replace: false })
    window.scrollTo({ top: 0 })
  }

  const nav = [
    { id: 'agenda' as const, label: 'Agenda', icon: Calendar, badge: pendingCount },
    { id: 'clientas' as const, label: 'Clientas e ingresos', icon: Users, badge: 0 },
  ]

  return (
    <div className="min-h-dvh bg-noir pb-24">
      <header className="sticky top-0 z-40 border-b border-line bg-[#070407]/90 backdrop-blur-xl">
        <div className="container-luxe flex h-16 items-center justify-between gap-4 md:h-20">
          <Link to="/" aria-label="Ir al sitio" className="shrink-0">
            <LogoLockup />
          </Link>
          <nav aria-label="Panel" className="hidden items-center gap-2 md:flex">
            {nav.map((n) => (
              <NavButton key={n.id} active={page === n.id} onClick={() => go(n.id)} {...n} />
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => reload()}
              aria-label="Actualizar"
              className="grid size-10 place-items-center rounded-full border border-rose/30 text-rose hover:border-rose"
            >
              <Refresh className="size-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 text-[0.6875rem] tracking-[0.2em] text-smoke uppercase hover:text-pearl"
            >
              <Logout className="size-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        {/* Celular: las dos páginas siempre a mano */}
        <nav aria-label="Panel" className="container-luxe grid grid-cols-2 gap-2 pb-3 md:hidden">
          {nav.map((n) => (
            <NavButton key={n.id} active={page === n.id} onClick={() => go(n.id)} {...n} label={n.id === 'agenda' ? 'Agenda' : 'Clientas e ingresos'} />
          ))}
        </nav>
      </header>

      <main className="container-luxe pt-8 md:pt-12">
        <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-rose">{capitalize(formatDateLong(todayLocal()))}</p>
            <h1 className="mt-3 font-display text-3xl tracking-[0.05em] text-pearl uppercase md:text-4xl">
              {page === 'agenda' ? 'Agenda' : 'Clientas e ingresos'}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[0.6875rem] tracking-[0.14em] uppercase">
            <Status ok={session.storage === 'postgres'} text={session.storage === 'postgres' ? 'Base de datos' : 'Modo prueba (memoria)'} />
            <Status ok={session.email} text={session.email ? 'Correos activos' : 'Correos sin configurar'} />
            <Status ok={session.google} text={session.google ? 'Google Calendar' : 'Google Calendar sin conectar'} />
          </div>
        </div>

        {status === 'loading' ? (
          <p className="py-24 text-center text-smoke">Cargando agenda…</p>
        ) : status === 'error' ? (
          <Card className="text-center">
            <p className="text-[#f0a3bb]">{error}</p>
            <Button size="sm" variant="outline" className="mt-5" onClick={() => reload()}>
              <Refresh className="size-4" /> Reintentar
            </Button>
          </Card>
        ) : page === 'agenda' ? (
          <AgendaPage />
        ) : (
          <ClientsPage />
        )}
      </main>
      <BookingDrawer />
    </div>
  )
}

function NavButton({
  active,
  onClick,
  label,
  icon: Icon,
  badge,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: typeof Calendar
  badge: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] whitespace-nowrap uppercase transition',
        active ? 'bg-metal border-transparent text-noir' : 'border-rose/25 text-pearl/80 hover:border-rose/60',
      )}
    >
      <Icon className="size-4" /> {label}
      {badge > 0 && (
        <span className={cn('grid min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-medium', active ? 'bg-noir text-rose-light' : 'bg-rose text-noir')}>
          {badge}
        </span>
      )}
    </button>
  )
}

function Status({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5', ok ? 'border-rose/30 text-pearl/75' : 'border-[#f0a3bb]/40 text-[#f0a3bb]')}>
      <span className={cn('size-1.5 rounded-full', ok ? 'bg-rose' : 'bg-[#f0a3bb]')} /> {text}
    </span>
  )
}
