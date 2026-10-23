import type { ReactNode } from 'react'
import { PageHero } from '../components/sections/PageHero'
import { SITE, hasEmail, hasWhatsApp } from '../config/site'
import { useSeo } from '../hooks/useSeo'

/*
 * Política de privacidad y tratamiento de datos personales (Ley 1581 de 2012 y
 * normas reglamentarias). Es una base editable: revísala con asesoría legal antes de publicar.
 */

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-28 border-t border-line py-10">
      <h2 id={`${id}-t`} className="font-display text-xl tracking-[0.06em] text-pearl uppercase md:text-2xl">
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-4 leading-relaxed text-pearl/80 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </section>
  )
}

const SECTIONS = [
  ['responsable', 'Responsable'],
  ['datos', 'Datos que recolectamos'],
  ['finalidades', 'Finalidades'],
  ['menores', 'Menores de edad'],
  ['almacenamiento', 'Almacenamiento y encargados'],
  ['derechos', 'Tus derechos'],
  ['procedimiento', 'Consultas y reclamos'],
  ['seguridad', 'Seguridad y cookies'],
  ['vigencia', 'Vigencia'],
] as const

export default function Privacy() {
  useSeo({ path: '/privacidad' })

  const channels = [
    `Instagram ${SITE.contact.instagram.handle}`,
    ...(hasWhatsApp() ? [`WhatsApp +${SITE.contact.whatsapp}`] : []),
    ...(hasEmail() ? [`correo ${SITE.contact.email}`] : []),
  ].join(', ')

  return (
    <>
      <PageHero eyebrow="Legal" title="Privacidad" script="y tratamiento de datos" />
      <div className="container-luxe grid grid-cols-1 gap-12 pb-28 lg:grid-cols-12">
        <nav aria-label="Contenido" className="hidden lg:col-span-3 lg:block">
          <ol className="sticky top-28 flex flex-col gap-3 text-sm text-smoke">
            {SECTIONS.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="hover:text-pearl">
                  <span className="mr-2 text-rose/70 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="lg:col-span-8 lg:col-start-5">
          <p className="pb-10 leading-relaxed text-smoke">
            En {SITE.legal.responsible} respetamos tu privacidad. Esta política explica cómo tratamos los datos personales
            que nos compartes al agendar una cita, conforme a la Ley 1581 de 2012 y sus normas reglamentarias en Colombia.
            Última actualización: {SITE.legal.privacyUpdated}.
          </p>

          <Section id="responsable" title="Responsable del tratamiento">
            <p>
              {SITE.legal.responsible}, con domicilio en {SITE.location.city}, {SITE.location.region}, {SITE.location.country}.
              Canales de contacto: {channels}.
            </p>
          </Section>

          <Section id="datos" title="Datos que recolectamos">
            <p>Para gestionar tu cita solicitamos únicamente:</p>
            <ul>
              <li>Nombre completo y número de WhatsApp.</li>
              <li>Correo electrónico (opcional), para enviarte la confirmación.</li>
              <li>Número de personas, procedimiento de cada una, fecha, horario y tipo de evento.</li>
              <li>Municipio y barrio del servicio (no pedimos la dirección exacta en el formulario).</li>
              <li>Comentarios que decidas compartir voluntariamente.</li>
            </ul>
            <p>
              No solicitamos documentos de identidad ni datos de pago. Si decides contarnos sobre alergias o sensibilidades
              en la piel (datos relativos a la salud), lo haces de forma voluntaria y los usaremos únicamente para cuidar
              tu bienestar durante el servicio.
            </p>
          </Section>

          <Section id="finalidades" title="Finalidades">
            <ul>
              <li>Agendar, confirmar y gestionar tu cita, y reservar el horario correspondiente en nuestra agenda.</li>
              <li>Contactarte por WhatsApp, correo o teléfono para coordinar detalles, cotización y cambios.</li>
              <li>Enviarte la confirmación de tu cita, el archivo para tu calendario y un recordatorio el día anterior.</li>
              <li>Atender tus consultas, solicitudes y reclamos.</li>
            </ul>
            <p>No vendemos ni cedemos tus datos, y no los usamos para publicidad sin tu autorización expresa.</p>
          </Section>

          <Section id="menores" title="Menores de edad">
            <p>
              Si la cita es para una menor de edad (por ejemplo, una quinceañera), la solicitud debe realizarla su acudiente o
              representante legal, o una persona que cuente con su autorización; al agendar se solicita confirmarlo.
              Trataremos esos datos respetando el interés superior de la menor y solo para las finalidades descritas.
            </p>
          </Section>

          <Section id="almacenamiento" title="Almacenamiento y encargados">
            <p>
              La agenda en línea guarda la información de tu cita en una base de datos con acceso restringido. Para
              operar el sitio nos apoyamos en proveedores tecnológicos que actúan como encargados del tratamiento:
              alojamiento web, base de datos en la nube, envío de correos y el calendario de Google del estudio (para
              organizar la agenda). Si eliges escribirnos por WhatsApp o Instagram,
              aplican también las políticas de Meta.
            </p>
            <p>
              Algunos de estos proveedores pueden almacenar la información en servidores ubicados fuera de Colombia. Al
              aceptar esta política autorizas dicha transferencia o transmisión internacional, que realizamos con
              proveedores que ofrecen medidas de seguridad adecuadas.
            </p>
            <p>
              Conservamos los datos durante el tiempo necesario para cumplir las finalidades descritas y las obligaciones
              legales aplicables; después los eliminamos o anonimizamos.
            </p>
          </Section>

          <Section id="derechos" title="Tus derechos">
            <p>Como titular de los datos, tienes derecho a:</p>
            <ul>
              <li>Conocer, actualizar y rectificar tus datos personales.</li>
              <li>Solicitar prueba de la autorización que nos diste.</li>
              <li>Ser informada sobre el uso que les damos.</li>
              <li>Revocar la autorización y solicitar la supresión de tus datos, cuando proceda.</li>
              <li>Acceder gratuitamente a tus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
            </ul>
          </Section>

          <Section id="procedimiento" title="Consultas y reclamos">
            <p>
              Puedes ejercer tus derechos escribiéndonos por cualquiera de nuestros canales oficiales ({channels}), indicando
              tu nombre, tu solicitud y un medio de respuesta. Atenderemos las consultas en un máximo de diez (10) días
              hábiles y los reclamos en un máximo de quince (15) días hábiles, prorrogables en los términos de la ley.
            </p>
          </Section>

          <Section id="seguridad" title="Seguridad y cookies">
            <p>
              El sitio usa conexión cifrada (HTTPS) y el acceso a la agenda está protegido con contraseña. No usamos cookies
              de publicidad ni de seguimiento. Medimos las visitas de forma anónima y sin cookies (estadísticas agregadas
              que no te identifican). Solo usamos almacenamiento técnico del navegador (por ejemplo, para recordar
              que ya viste la animación de bienvenida) y una cookie de sesión exclusiva del panel administrativo del estudio.
            </p>
          </Section>

          <Section id="vigencia" title="Vigencia">
            <p>
              Esta política rige desde su publicación y puede actualizarse. Cualquier cambio sustancial se publicará en esta
              página. Última actualización: {SITE.legal.privacyUpdated}.
            </p>
          </Section>
        </article>
      </div>
    </>
  )
}
