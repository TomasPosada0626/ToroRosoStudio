/** Evento de calendario (archivo .ics y enlace de Google Calendar). */
export interface CalendarEvent {
  uid: string
  title: string
  description: string
  location: string
  startsAt: number
  endsAt: number
  url?: string
}

const stamp = (ms: number) =>
  new Date(ms)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

/** Las líneas de un .ics no deben superar 75 octetos; se pliegan con CRLF + espacio. */
function fold(line: string): string {
  const out: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = new TextEncoder().encode(char).length
    if (bytes + size > 73) {
      out.push(current)
      current = ' '
      bytes = 1
    }
    current += char
    bytes += size
  }
  out.push(current)
  return out.join('\r\n')
}

export function buildIcs(
  event: CalendarEvent,
  options: { method?: 'PUBLISH' | 'CANCEL'; status?: 'CONFIRMED' | 'TENTATIVE' } = {},
): string {
  const method = options.method ?? 'PUBLISH'
  const status = method === 'CANCEL' ? 'CANCELLED' : (options.status ?? 'CONFIRMED')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Toro Roso Studio//Agenda//ES',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    ...(event.url ? [`URL:${event.url}`] : []),
    `STATUS:${status}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de tu cita',
    'TRIGGER:-PT24H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(event.startsAt)}/${stamp(event.endsAt)}`,
    details: event.description,
    location: event.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
