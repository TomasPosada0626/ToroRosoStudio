/**
 * ─────────────────────────────────────────────────────────────────────
 *  REGLAS DE LA AGENDA · Toro Roso Studio
 *
 *  Este archivo lo usan la web (calendario y horarios) y el servidor
 *  (validación y bloqueo de horarios). Cualquier ajuste aquí se refleja
 *  en ambos lados automáticamente.
 *
 *  Cómo se calcula el bloqueo de una cita:
 *    duración = suma del procedimiento de cada persona
 *    bloqueo  = duración + tiempo de movilización (bufferAfterMinutes)
 *  Ej.: Novias (2 h 30) + 2 × Social (1 h 30) = 5 h 30 de servicio;
 *       con 2 h de movilización la agenda queda bloqueada 7 h 30.
 *
 *  Horario confirmado: todos los días (incluidos domingos y festivos). La primera
 *  cita empieza a las 8:00 a. m., la última a las 6:00 p. m. y ninguna puede
 *  terminar después de las 8:00 p. m.
 *  Anticipo: después de que Manuela confirma la fecha, se coordina por WhatsApp.
 *  ⚠️ Las duraciones son INICIALES: ajústalas a la operación real.
 * ─────────────────────────────────────────────────────────────────────
 */

/** Procedimientos que se pueden agendar, en el orden en que aparecen en la agenda. */
export const SERVICE_IDS = ['novias', 'prueba', 'quinceaneras', 'social', 'artistico', 'graduaciones'] as const
export type ServiceId = (typeof SERVICE_IDS)[number]

/** Nombres cortos usados en mensajes, correos y la agenda. */
export const SERVICE_NAMES: Record<ServiceId, string> = {
  novias: 'Novias',
  prueba: 'Prueba de novia',
  quinceaneras: 'Quinceañeras',
  social: 'Social',
  artistico: 'Artístico',
  graduaciones: 'Graduaciones',
}

/** Nombres completos usados en confirmaciones y calendarios. */
export const SERVICE_LONG_NAMES: Record<ServiceId, string> = {
  novias: 'Maquillaje para novias',
  prueba: 'Prueba de maquillaje para novia',
  quinceaneras: 'Maquillaje para quinceañeras',
  social: 'Maquillaje social',
  artistico: 'Maquillaje artístico',
  graduaciones: 'Maquillaje para graduaciones',
}

/**
 * Horario de un día: primera y última hora a la que puede EMPEZAR una cita, y hora máxima a la
 * que debe TERMINAR el servicio. `null` = ese día no se agenda en línea.
 */
export type OpeningHours = { firstStart: string; lastStart: string; latestEnd: string } | null

export interface BookingRules {
  /** Diferencia con UTC en minutos. Colombia: UTC−5 todo el año (sin horario de verano). */
  utcOffsetMinutes: number
  /** Cada cuántos minutos se ofrece un horario de inicio. */
  slotStepMinutes: number
  /**
   * Tiempo que se bloquea DESPUÉS de cada cita (movilización e imprevistos).
   * Ej.: una cita de 10:00 a 12:00 deja la agenda ocupada hasta las 14:00.
   */
  bufferAfterMinutes: number
  /** Anticipación mínima para agendar en línea, en horas. */
  minNoticeHours: number
  /** Hasta cuántos días hacia adelante se puede agendar. */
  maxAdvanceDays: number
  /** Máximo de personas por reserva en línea (grupos más grandes → WhatsApp). */
  maxPeople: number
  /**
   * 'manual': cada solicitud aparta el horario y queda "por confirmar" hasta que el estudio
   *           la aprueba (desde el panel o con un toque en el correo de aviso).
   * 'auto':   la cita se confirma al instante.
   */
  approval: 'manual' | 'auto'
  /** Máximo de citas activas (por confirmar o confirmadas) por número de WhatsApp. */
  maxActivePerClient: number
  /**
   * Se pide un anticipo para separar la fecha. Se coordina por WhatsApp DESPUÉS de que Manuela
   * confirma la cita (la web solo lo avisa; montos y medios de pago se acuerdan por chat).
   */
  depositRequired: boolean
  /** Horario por día de la semana: índice 0 = domingo … 6 = sábado. */
  weeklyHours: OpeningHours[]
  /** Duración del procedimiento POR PERSONA, en minutos. */
  serviceMinutes: Record<ServiceId, number>
}

export const BOOKING_RULES: BookingRules = {
  utcOffsetMinutes: -300,
  slotStepMinutes: 30,
  bufferAfterMinutes: 120,
  minNoticeHours: 24,
  maxAdvanceDays: 365,
  maxPeople: 6,
  approval: 'manual',
  maxActivePerClient: 3,
  depositRequired: true,
  weeklyHours: [
    { firstStart: '08:00', lastStart: '18:00', latestEnd: '20:00' }, // domingo
    { firstStart: '08:00', lastStart: '18:00', latestEnd: '20:00' }, // lunes
    { firstStart: '08:00', lastStart: '18:00', latestEnd: '20:00' }, // martes
    { firstStart: '08:00', lastStart: '18:00', latestEnd: '20:00' }, // miércoles
    { firstStart: '08:00', lastStart: '18:00', latestEnd: '20:00' }, // jueves
    { firstStart: '08:00', lastStart: '18:00', latestEnd: '20:00' }, // viernes
    { firstStart: '08:00', lastStart: '18:00', latestEnd: '20:00' }, // sábado
  ],
  serviceMinutes: {
    novias: 150,
    prueba: 120,
    quinceaneras: 120,
    social: 90,
    artistico: 120,
    graduaciones: 90,
  },
}

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && (SERVICE_IDS as readonly string[]).includes(value)
}

/** Duración total de la sesión: suma del procedimiento de cada persona. */
export function totalDurationMinutes(services: readonly ServiceId[]): number {
  return services.reduce((sum, service) => sum + BOOKING_RULES.serviceMinutes[service], 0)
}

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** Sesión más larga que cabe en un día de atención (de la primera hora de inicio a la hora máxima de fin). */
export const longestSessionMinutes = Math.max(
  0,
  ...BOOKING_RULES.weeklyHours.map((h) => (h ? minutes(h.latestEnd) - minutes(h.firstStart) : 0)),
)

/** Las citas de quinceañeras (menores de edad) requieren autorización del acudiente o representante. */
export const requiresGuardianConsent = (services: readonly (ServiceId | null)[]) => services.includes('quinceaneras')

/** Agrupa los procedimientos conservando el orden: [{ id: 'novias', count: 1 }, { id: 'social', count: 2 }]. */
export function groupServices(services: readonly ServiceId[]): { id: ServiceId; count: number }[] {
  const groups: { id: ServiceId; count: number }[] = []
  for (const id of services) {
    const group = groups.find((g) => g.id === id)
    if (group) group.count++
    else groups.push({ id, count: 1 })
  }
  return groups
}

/** "Novias" · "Novias + Social ×2" */
export function describeServices(services: readonly ServiceId[]): string {
  return groupServices(services)
    .map(({ id, count }) => (count > 1 ? `${SERVICE_NAMES[id]} ×${count}` : SERVICE_NAMES[id]))
    .join(' + ')
}
