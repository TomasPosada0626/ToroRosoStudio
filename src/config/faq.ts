import { BOOKING_RULES } from '../../shared/booking-rules'
import { DEPOSIT_TEXT } from '../../shared/deposit'

/**
 * Preguntas frecuentes. Las respuestas evitan prometer políticas que aún no
 * están definidas (cancelaciones y cambios): edítalas cuando existan. El anticipo y la
 * cobertura fuera de Envigado se acuerdan con cada clienta por WhatsApp.
 */
export interface FaqItem {
  q: string
  a: string
}

const manual = BOOKING_RULES.approval === 'manual'
const deposit = BOOKING_RULES.depositRequired

export const FAQ: FaqItem[] = [
  {
    q: '¿Cómo puedo agendar mi cita?',
    a: 'En la sección "Agenda tu cita" indicas cuántas personas se maquillarán y el procedimiento de cada una, eliges la fecha y un horario disponible, y completas tus datos. No necesitas crear una cuenta. También puedes escribirnos por WhatsApp o Instagram.',
  },
  {
    q: '¿Cómo consulto la disponibilidad?',
    a: 'El calendario de la agenda muestra en tiempo real los días y horarios libres según la duración de tu cita. Los días sin horarios disponibles aparecen deshabilitados.',
  },
  {
    q: '¿Qué pasa después de agendar?',
    a: manual
      ? `Tu horario queda apartado a tu nombre de inmediato y recibes tu código de reserva. Manuela revisa tu solicitud y te confirma la fecha por WhatsApp (y por correo, si lo indicas).${
          deposit ? ' Luego coordina contigo el anticipo que la separa.' : ''
        } Un día antes te enviamos un recordatorio.`
      : 'Tu horario queda reservado a tu nombre y recibes tu código de reserva (también por correo, si lo indicas). Un día antes te enviamos un recordatorio y te contactamos por WhatsApp para coordinar los detalles finales.',
  },
  ...(deposit
    ? [
        {
          q: '¿Hay que pagar un anticipo?',
          a: `Sí. ${DEPOSIT_TEXT.pending} El monto y la forma de pago se acuerdan directamente por ese medio.`,
        },
      ]
    : []),
  {
    q: '¿Ofrecen prueba de maquillaje para novias?',
    a: 'Sí. En la agenda elige "Prueba de novia" como procedimiento. Te recomendamos hacerla con tiempo antes de la boda y llevar fotos de tu vestido, tu peinado y los looks que te inspiran.',
  },
  {
    q: '¿En qué horario atienden?',
    a: 'Agendamos todos los días, incluidos domingos y festivos. La primera cita empieza a las 8:00 a. m. y la última a las 6:00 p. m., y el servicio debe terminar a más tardar a las 8:00 p. m.; por eso, para grupos grandes la agenda solo muestra los horarios en los que alcanza a terminar.',
  },
  {
    q: '¿Con cuánta anticipación debo reservar?',
    a: `La agenda en línea recibe citas con al menos ${BOOKING_RULES.minNoticeHours} horas de anticipación. Para fechas muy solicitadas, como bodas y quince, te recomendamos reservar con tiempo para asegurar tu horario.`,
  },
  {
    q: '¿Realizan maquillaje a domicilio?',
    a: 'Sí. Toro Roso Studio presta servicio a domicilio en Envigado, Antioquia. Si tu evento es en otro municipio, indícalo al agendar y te confirmaremos la disponibilidad.',
  },
  {
    q: '¿Cómo solicito una cotización?',
    a: 'Cada servicio se cotiza según el tipo de maquillaje, la fecha, la ubicación y el número de personas. Agenda tu cita o escríbenos con esos datos y te compartiremos la cotización.',
  },
  {
    q: '¿Puedo pedir un maquillaje personalizado?',
    a: 'Claro que sí. Cuéntanos sobre tu evento, tu vestuario y el estilo que te gusta; puedes compartirnos fotos de referencia por WhatsApp para diseñar un look acorde a ti.',
  },
  {
    q: '¿Puedo agendar para varias personas?',
    a: `Sí. Indica cuántas personas se maquillarán (hasta ${BOOKING_RULES.maxPeople} en la agenda en línea) y elige el procedimiento de cada una: la agenda calcula automáticamente la duración total de la cita. Para grupos más grandes, escríbenos por WhatsApp.`,
  },
  {
    q: '¿Cómo agendo a una quinceañera?',
    a: 'Como las quinceañeras son menores de edad, al agendar se confirma que se cuenta con la autorización de su acudiente o representante legal. La cita puede hacerla directamente la mamá, el papá o el acudiente.',
  },
  {
    q: '¿Cómo cambio o cancelo mi cita?',
    a: 'Escríbenos por WhatsApp o Instagram indicando tu código de reserva y te ayudaremos con el cambio.',
  },
]
