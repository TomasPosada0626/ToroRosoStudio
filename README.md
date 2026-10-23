# Toro Roso Studio · Sitio web y agenda en línea

Sitio oficial de **Toro Roso Studio**, maquillaje profesional a domicilio en Envigado, Antioquia.
Incluye una **agenda en línea real**: las clientas eligen el procedimiento de cada persona, ven los
días y horarios disponibles y envían su solicitud sin crear cuenta. El horario queda **apartado** en
la base de datos (servicio + tiempo de movilización) y Manuela lo **confirma o rechaza** con un toque
desde el correo o desde su panel privado.

> ⚠️ Antes de publicar, revisa la sección [Datos pendientes](#1-datos-pendientes-antes-de-publicar).

---

## Índice

1. [Datos pendientes antes de publicar](#1-datos-pendientes-antes-de-publicar)
2. [Qué incluye](#2-qué-incluye)
3. [Cómo funciona la agenda](#3-cómo-funciona-la-agenda)
4. [Ejecutar en tu computador](#4-ejecutar-en-tu-computador)
5. [Publicar en Vercel paso a paso](#5-publicar-en-vercel-paso-a-paso)
6. [Correos automáticos](#6-correos-automáticos)
7. [Recordatorios y resumen diario](#7-recordatorios-y-resumen-diario)
8. [Google Calendar de Manuela (opcional)](#8-google-calendar-de-manuela-opcional)
9. [Estadísticas de visitas](#9-estadísticas-de-visitas)
10. [Conectar un dominio propio](#10-conectar-un-dominio-propio)
11. [Panel privado de Manuela (/admin)](#11-panel-privado-de-manuela-admin)
12. [Actualizar fotos, precios, textos y servicios](#12-actualizar-fotos-precios-textos-y-servicios)
13. [WhatsApp automático (opcional)](#13-whatsapp-automático-opcional)
14. [Estructura del proyecto](#14-estructura-del-proyecto)
15. [Seguridad, privacidad y rendimiento](#15-seguridad-privacidad-y-rendimiento)

---

## 1. Datos pendientes antes de publicar

Nada de esto se inventó; hay que completarlo con la información real:

| Pendiente | Dónde se configura |
| --- | --- |
| **Precios** (por ahora se muestra "Consulta disponibilidad y cotización") | `src/config/services.ts` → `price` |
| **Duración real de cada procedimiento**, incluida la prueba de novia | `shared/booking-rules.ts` → `serviceMinutes` |
| Tiempo de movilización, anticipación mínima, máximo de personas | `shared/booking-rules.ts` |
| Correo donde Manuela recibe las solicitudes | Variable `STUDIO_NOTIFY_EMAIL` |
| Correo para enviar confirmaciones (Gmail o Resend) | Ver [Correos automáticos](#6-correos-automáticos) |
| Contraseña del panel privado | Variable `ADMIN_PASSWORD` |
| Clave de los recordatorios diarios | Variable `CRON_SECRET` |
| Fotografías reales (las actuales son de referencia) | `src/config/media.ts` y `src/config/portfolio.ts` |
| Nombre e historia de la maquilladora (opcional) | `src/config/site.ts` → `artist` |
| Correo público | `VITE_CONTACT_EMAIL` |
| Reseñas reales y autorizadas | `src/config/testimonials.ts` |
| Revisión legal de la política de privacidad | `src/pages/Privacy.tsx` |

**Ya configurado:** WhatsApp oficial **+57 322 493 5632** (`shared/business.ts`), Instagram
[@tororosostudio](https://www.instagram.com/tororosostudio/) y el **horario: todos los días (incluidos
domingos y festivos), primera cita a las 8:00 a. m., última a las 6:00 p. m. y ningún servicio termina
después de las 8:00 p. m.** (`weeklyHours` en `shared/booking-rules.ts`; el texto visible está en
`src/config/site.ts` → `contact.hours`). Todo botón de WhatsApp abre WhatsApp y todo botón de Instagram
abre Instagram.

**Anticipo:** después de que Manuela confirma la fecha, se coordina el anticipo por WhatsApp (monto y
forma de pago se acuerdan por chat; la web no cobra). La web lo anuncia en la agenda, en la pantalla
final, en los correos y en las preguntas frecuentes, y al confirmar Manuela tiene un botón
**"Coordinar anticipo"** con el mensaje listo. Se desactiva con `depositRequired: false`.

**Pendiente de Manuela:** política de cancelación y cambios (`src/config/faq.ts`).

**Valores iniciales de la agenda** (ajústalos): Novias 2 h 30 · Prueba de novia 2 h · Quinceañeras 2 h ·
Social 1 h 30 · Artístico 2 h · Graduaciones 1 h 30 · movilización 2 h · anticipación mínima 24 h ·
hasta 6 personas por reserva · **confirmación manual de Manuela** · máximo 3 citas activas por número
de WhatsApp.

---

## 2. Qué incluye

**Páginas:** Inicio · Servicios · detalle de cada servicio · Novias (con la prueba de maquillaje) ·
Portafolio · El Estudio · Agenda tu cita · Preguntas frecuentes · Contacto · Privacidad · 404 · Panel privado.

**Experiencia visual:**
- Identidad fiel a la marca: negro profundo, rosa metálico cromado y satén ciruela; tipografías
  romanas (como "TORO ROSO") + caligrafía (como "de Maquillaje") + sans espaciada.
- Satén ciruela en movimiento (WebGL) y polvo de brillo rose gold.
- Intro animada con el logo **solo en la página de inicio y una vez por visita** (corta, se puede saltar).
- Transiciones de página tipo telón, scroll suave con inercia, titulares que emergen de una máscara,
  imágenes que se revelan, parallax, marquesinas y palabras que se iluminan al leer.
- Portafolio con filtros animados y visor a pantalla completa (teclado, gestos y foco accesible).
- **Modo de bajo consumo automático:** en celulares modestos, con ahorro de datos o si el equipo
  se pone lento, el satén y el brillo se simplifican solos. Respeta "reducir movimiento".
- Textos de mínimo 11 px para que todo se lea bien en celular.

**Conversión:** botones flotantes de **WhatsApp e Instagram**, llamados a la acción en cada sección,
enlaces directos como `/agenda?servicio=novias` para la biografía de Instagram y **vista previa
propia de cada página** al compartirla por WhatsApp o redes (título, descripción e imagen de marca).

---

## 3. Cómo funciona la agenda

1. La clienta indica **cuántas personas** se maquillarán y el **procedimiento de cada una**
   (Novias, Prueba de novia, Quinceañeras, Social, Artístico o Graduaciones).
2. La web suma la **duración total** de los procedimientos.
3. El calendario muestra en tiempo real los días con horarios libres; al elegir un día aparecen
   las horas de inicio disponibles.
4. La clienta completa sus datos (sin crear cuenta). Si alguna persona es **quinceañera**, debe marcar
   la casilla *"Cuento con la autorización del acudiente o representante legal de la quinceañera"*;
   sin ella no se puede enviar (también lo verifica el servidor).
5. El servidor vuelve a validar todo y guarda la solicitud **por confirmar**. El horario queda apartado
   desde el inicio hasta el **fin del servicio + tiempo de movilización**, así nadie más lo toma:
   - Ejemplo: cita de 10:00 a 12:00 → nadie puede agendar hasta las 14:00.
   - Ejemplo: Novias + 3 × Social = 7 h; si empieza a las 7:00, la agenda queda libre desde las 16:00.
6. **Manuela recibe un correo** con todos los datos y dos botones: **Confirmar** o **Rechazar**
   (enlaces firmados que vencen a los 7 días). También puede hacerlo desde `/admin`. Al confirmar le
   aparece el botón **"Coordinar anticipo"**, que abre WhatsApp con un mensaje listo para la clienta.
7. La clienta recibe:
   - al enviar: su código y, si dejó correo, el aviso "Recibimos tu solicitud" (que ya le anuncia el anticipo);
   - al confirmar Manuela: la confirmación por correo con archivo de calendario (`.ics`)
     y, si está activo, por WhatsApp automático; luego Manuela le escribe para el anticipo;
   - si se rechaza: el horario se libera y, si Manuela lo elige, se le avisa por correo;
   - **el día anterior:** un recordatorio (ver [Recordatorios](#7-recordatorios-y-resumen-diario)).

**Protecciones:** la base de datos impide dos citas cruzadas incluso si dos personas envían en el mismo
segundo (restricción `EXCLUDE` de PostgreSQL); un mismo número de WhatsApp puede tener como máximo
3 citas activas; hay límite de solicitudes seguidas, campo trampa para robots y tiempo mínimo de llenado.
Si algo falla al enviar, la clienta ve el aviso con un botón para mandar la misma solicitud por WhatsApp.

**Confirmación automática:** si algún día Manuela prefiere que las citas queden confirmadas al instante,
cambia `approval: 'manual'` por `approval: 'auto'` en `shared/booking-rules.ts`.

Si la base de datos no está conectada, la agenda pasa sola a **modo WhatsApp**: la clienta envía la
solicitud por WhatsApp y el estudio confirma.

---

## 4. Ejecutar en tu computador

Requisitos: [Node.js](https://nodejs.org) 22 o superior.

```bash
npm install        # instala dependencias
npm run dev        # sitio en http://localhost:5173 (incluye la API de la agenda)
npm run build      # verifica tipos y genera la versión de producción en /dist
npm run preview    # sirve /dist (sin API)
```

En desarrollo, si no hay `DATABASE_URL`, las citas se guardan **en memoria** (se borran al reiniciar).
Para probar el panel, crea `.env.local` con `ADMIN_EMAIL=` (cualquier correo) y `ADMIN_PASSWORD=` (10+ caracteres),
y entra a `http://localhost:5173/admin`. Los recordatorios se pueden probar abriendo
`http://localhost:5173/api/cron/reminders` (sin `CRON_SECRET` solo funciona en desarrollo).

---

## 5. Publicar en Vercel paso a paso

El plan gratuito (Hobby) de Vercel y el plan gratuito de Neon son suficientes para empezar.

1. **Sube el proyecto a GitHub** (repositorio privado recomendado).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
   Vercel detecta Vite automáticamente (la configuración está en `vercel.json`). Pulsa **Deploy**.
3. **Base de datos:** en el proyecto de Vercel → **Storage → Create Database → Neon (Postgres)**.
   Elige una región cercana a la de las funciones (por defecto `Washington, D.C. / us-east-1`) y
   conéctala al proyecto. Vercel crea la variable `DATABASE_URL` sola. La tabla de la agenda se
   crea automáticamente con la primera consulta.
4. **Variables de entorno** (Settings → Environment Variables), como mínimo:

   | Variable | Valor |
   | --- | --- |
   | `ADMIN_EMAIL` | Correo de Manuela: es el usuario del panel |
   | `ADMIN_PASSWORD` | Contraseña segura del panel (10+ caracteres) |
   | `STUDIO_NOTIFY_EMAIL` | Correo de Manuela para recibir solicitudes y el resumen diario |
   | `CRON_SECRET` | Texto aleatorio de 16+ caracteres (activa los recordatorios) |
   | Correo (Gmail o Resend) | Ver [Correos automáticos](#6-correos-automáticos) |

   El listado completo (Google Calendar, WhatsApp automático, etc.) está en `.env.example`.
5. **Estadísticas:** pestaña **Analytics → Enable** (ver [Estadísticas](#9-estadísticas-de-visitas)).
6. **Redespliega** (Deployments → ⋯ → Redeploy) para que tome las variables.
7. **Prueba en producción:** envía una solicitud de prueba, revisa que llegue el correo, pulsa
   **Confirmar** en el correo, entra a `tu-dominio/admin` y cancélala para liberar el horario.

---

## 6. Correos automáticos

**Opción A · Gmail (sin dominio propio, la más rápida)**
1. En la cuenta de Google que enviará los correos, activa la verificación en dos pasos.
2. Crea una contraseña de aplicación: Cuenta de Google → Seguridad → Contraseñas de aplicaciones.
3. En Vercel: `SMTP_USER` = `tororosostudio@gmail.com` (la cuenta de envíos) y `SMTP_PASS` = la contraseña de aplicación
   (16 caracteres, sin espacios).

**Opción B · Resend (recomendada con dominio propio)**
1. Crea una cuenta en [resend.com](https://resend.com) y verifica tu dominio (registros DNS).
2. En Vercel: `RESEND_API_KEY` y `EMAIL_FROM` (ej. `Toro Roso Studio <citas@tudominio.com>`).

Correos que envía la web: solicitud recibida (clienta), nueva solicitud con botones Confirmar/Rechazar
(Manuela), cita confirmada con `.ics` (clienta), cancelación o rechazo (clienta, opcional),
recordatorio del día anterior (clienta) y resumen diario (Manuela).

Sin correo configurado la agenda sigue funcionando: la clienta ve su código, puede agregar la cita a
su calendario y enviar el resumen por WhatsApp; Manuela gestiona todo desde `/admin`.

---

## 7. Recordatorios y resumen diario

`vercel.json` programa una tarea diaria (Vercel Cron) a las **12:00 UTC = 7:00 a. m. de Colombia**
(en el plan gratuito puede ejecutarse en cualquier momento de esa hora). Cada mañana:

- envía un **recordatorio** a cada clienta con cita **confirmada para mañana** (por correo si lo dejó,
  y por WhatsApp si está activa la plantilla de recordatorio);
- envía a Manuela un **resumen**: citas de hoy, de mañana y solicitudes por confirmar.

Solo hay que crear la variable `CRON_SECRET`: Vercel la envía en cada ejecución y la tarea rechaza
cualquier otra llamada. Las solicitudes que siguen por confirmar no reciben recordatorio.

---

## 8. Google Calendar de Manuela (opcional)

Con esto, **sus compromisos personales bloquean la agenda de la web** y **cada cita confirmada aparece
en su Google Calendar** (y se borra si se cancela). Si Google falla, la agenda sigue funcionando.

1. En [console.cloud.google.com](https://console.cloud.google.com) crea un proyecto
   (ej. "Toro Roso Agenda") y en **APIs y servicios → Biblioteca** habilita **Google Calendar API**.
2. **IAM y administración → Cuentas de servicio → Crear cuenta de servicio** (sin roles).
   Luego en la cuenta: **Claves → Agregar clave → JSON** y descarga el archivo (guárdalo en privado).
3. En Google Calendar de Manuela → **Configuración** → su calendario → **Compartir con personas
   específicas** → agrega el correo de la cuenta de servicio con el permiso
   **"Hacer cambios en los eventos"**.
4. En Vercel crea:
   - `GOOGLE_CALENDAR_ID`: en **Integrar el calendario → ID del calendario** (para el calendario
     principal es su correo de Gmail);
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: el valor `client_email` del JSON;
   - `GOOGLE_PRIVATE_KEY`: el valor `private_key` del JSON, completo y tal cual (con los `\n`).
5. Redespliega. En `/admin` se verá "Google Calendar conectado".

---

## 9. Estadísticas de visitas

La web usa **Vercel Web Analytics**: sin cookies, sin anuncios y sin datos personales, así que no
necesita banner de cookies. El panel `/admin` no se mide. Para activarlo: proyecto de Vercel →
**Analytics → Enable** y redesplegar. Verás visitas, páginas más vistas, países, dispositivos y de
dónde llegan (por ejemplo, desde Instagram).

La agenda también registra el embudo (`agenda_inicio`, `agenda_paso`, `agenda_enviada`) para saber en
qué paso se quedan las clientas; los eventos personalizados se ven en los planes de pago de Vercel.

---

## 10. Conectar un dominio propio

1. Compra el dominio (ej. en un registrador como Namecheap, GoDaddy o Google Domains).
2. Vercel → proyecto → **Settings → Domains → Add** → escribe el dominio.
3. Copia en tu registrador los registros DNS que indica Vercel (normalmente un registro `A` para el
   dominio raíz y un `CNAME` para `www`). La activación tarda de minutos a pocas horas.
4. Agrega `VITE_SITE_URL=https://tudominio.com` y redespliega (actualiza canonical, vistas previas
   para compartir, sitemap y los enlaces de los correos).
5. Usa `https://tudominio.com/agenda` en la biografía de Instagram.

---

## 11. Panel privado de Manuela (/admin)

El panel **no aparece en el menú del sitio ni en Google**: solo se llega escribiendo `tudominio.com/admin`.
Hay una sola cuenta: el correo `ADMIN_EMAIL` (el de Manuela) y la contraseña `ADMIN_PASSWORD`.
Las clientas nunca crean cuenta. Funciona igual en el celular y en el computador, y tiene dos páginas:

**1. Agenda**
- Resumen: solicitudes por confirmar, citas de hoy, próximos 7 días y anticipos pendientes.
- **Solicitudes por confirmar:** **Confirmar** (le llega el correo a la clienta y aparece el botón
  "Coordinar anticipo" por WhatsApp) o **Rechazar** con un motivo (escrito o elegido de sugerencias)
  que se incluye en el correo a la clienta; si no dejó correo, botón para avisarle por WhatsApp.
- **Calendario mensual** con las citas de cada día (por confirmar, confirmadas y bloqueos); al tocar un
  día se ven sus citas y se puede bloquear ese día u horas.
- **Nueva cita** a mano, para clientas que escriben por WhatsApp o Instagram: queda confirmada, bloquea
  la agenda y entra al historial y a las cuentas. Se puede elegir cualquier hora (incluso registrar una
  cita pasada); las horas que chocan con otra cita aparecen tachadas.
- **Reprogramar** cualquier cita (desde su ficha): nuevo día y hora con la misma duración, y aviso por
  correo a la clienta si dejó correo.
- **Bloquear horario** para vacaciones o compromisos personales.

**2. Clientas e ingresos**
- Ingresos del mes (comparados con el anterior), del año, saldo por cobrar y número de clientas.
- Gráfica de ingresos de los últimos 12 meses (al tocar un mes se filtran las tablas).
- **Servicios:** historial completo con búsqueda y filtros (por confirmar, próximas, realizadas, sin
  anticipo, con saldo, canceladas) y totales de valor, pagado y saldo.
- **Clientas:** cada clienta con sus citas, total pagado, saldo y próxima cita.
- **Pagos:** todos los anticipos y saldos recibidos, por mes y por medio de pago.
- Todo se puede **exportar a Excel**.

**Ficha de cada cita** (se abre al tocarla en cualquier parte): datos de la clienta, WhatsApp y
llamada, confirmar, rechazar o cancelar con motivo y el **cobro**: valor del servicio, **anticipo**
(cuánto y si fue en efectivo o transferencia), **cuánto le resta** y el botón **"Marcar como pagado"**.
El pago en sí se coordina por WhatsApp; el panel solo lleva la cuenta.

Desde el correo de aviso de cada nueva solicitud, Manuela también puede **confirmar o rechazar
(con motivo)** con un toque, sin entrar al panel.

**Aviso inmediato en el celular de Manuela (Gmail).** Cada solicitud nueva llega con el asunto
"Por confirmar · …". Para que suene apenas llegue:
1. En Gmail desde el computador: buscar `subject:("Por confirmar")` → **Crear filtro** → marcar
   **Aplicar la etiqueta** "Agenda Toro Roso" y **Marcar siempre como importante**.
2. **Android:** app de Gmail → Configuración → su cuenta → **Administrar etiquetas** → "Agenda Toro Roso"
   → **Sincronizar mensajes** y **Notificar cada mensaje** (con sonido).
3. **iPhone:** app de Gmail → Configuración → **Notificaciones** → "Solo prioridad alta" (el filtro del
   paso 1 marca estos correos como importantes) y permitir sonido en los ajustes del iPhone.
4. Hacer una reserva de prueba y comprobar que suene.

---

## 12. Actualizar fotos, precios, textos y servicios

- **Precios:** en `src/config/services.ts`, cambia `price: null` por el texto exacto, por ejemplo
  `price: 'Desde $000.000'`. Aparece en las tarjetas, en la página del servicio y en la agenda.
- **Fotos:** guarda tus fotos en `public/fotos/` (JPG o WebP, ~1600 px de ancho; puedes
  comprimirlas en [squoosh.app](https://squoosh.app)). En `src/config/media.ts` cambia la entrada,
  por ejemplo `bridePrep: real('/fotos/novia-01.webp', 'Descripción de la foto')`. Las fotos reales
  dejan de mostrar la etiqueta "Imagen de referencia".
- **Portafolio:** `src/config/portfolio.ts` (categoría y forma de cada foto).
- **Servicios y textos:** `src/config/services.ts`. La **Prueba de novia** se agenda como un
  procedimiento más, pero se presenta dentro de Novias (`listed: false`).
- **Preguntas frecuentes:** `src/config/faq.ts`. **Reseñas:** `src/config/testimonials.ts`
  (la sección de reseñas del inicio aparece sola cuando haya reseñas reales).
- **Contacto, redes y artista:** `src/config/site.ts` y `shared/business.ts` (WhatsApp e Instagram).
- **Vista previa al compartir:** títulos y descripciones por página en `shared/seo.ts`; imágenes
  1200 × 630 en `public/brand/og/`.
- **Logo:** el original está en `brand-source/`. Las versiones optimizadas viven en `public/brand/`.

---

## 13. WhatsApp automático (opcional)

Los mensajes automáticos por WhatsApp usan la **WhatsApp Cloud API de Meta**: requiere una cuenta de
Meta Business, un número habilitado para la API y plantillas aprobadas (categoría *Utilidad*). Meta
puede cobrar por mensajes iniciados por la empresa. Ambas plantillas usan 5 variables
(nombre, servicio, fecha, horario y código):

- `WHATSAPP_CLOUD_TEMPLATE` (cita confirmada):
  > Hola {{1}}, tu cita de {{2}} con Toro Roso Studio quedó confirmada para el {{3}}, {{4}}. Te escribiremos por este medio para coordinar el anticipo que separa tu fecha. Código: {{5}}.
- `WHATSAPP_CLOUD_REMINDER_TEMPLATE` (recordatorio del día anterior):
  > Hola {{1}}, te recordamos tu cita de {{2}} con Toro Roso Studio: {{3}}, {{4}}. Código: {{5}}. Si necesitas cambiarla, escríbenos.

Configura además `WHATSAPP_CLOUD_TOKEN` y `WHATSAPP_CLOUD_PHONE_NUMBER_ID`. Mientras no esté
configurado, la clienta puede enviar el resumen por WhatsApp con un botón y Manuela le escribe con el
mensaje listo desde el panel.

---

## 14. Estructura del proyecto

```
api/                 Funciones del servidor (Vercel)
  admin/             Panel: sesión, agenda y enlaces rápidos Confirmar/Rechazar
  cron/              Recordatorios y resumen diario
server/              Base de datos, sesión, correos, WhatsApp y Google Calendar
shared/              Reglas de la agenda, validación, horas, SEO y datos del negocio (web + servidor)
src/
  config/            ✏️ Datos editables: negocio, servicios, fotos, portafolio, FAQ, reseñas
  components/
    booking/         Agenda: personas, calendario, horarios, resumen y confirmación
    fx/              Efectos: satén WebGL, brillo, reveals, marquesina, cursor
    layout/          Navegación, footer, intro, transiciones, botones de WhatsApp e Instagram
    sections/        Secciones de las páginas
    ui/              Botones, íconos, encabezados, imágenes
  pages/             Una por ruta
public/brand/        Logo, isotipo, favicon e imágenes para compartir (og/)
vercel.json          Rutas, caché, tarea diaria y cabeceras de seguridad
```

Tecnología: React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · Motion · Lenis · Neon Postgres ·
Vercel Functions, Cron y Web Analytics.

---

## 15. Seguridad, privacidad y rendimiento

- Las claves (base de datos, correo, Google, WhatsApp, contraseña del panel) solo existen en el servidor.
- El servidor vuelve a validar cada solicitud; incluye límite de solicitudes, máximo de citas activas
  por número, campo trampa para robots y comprobación de origen. El panel usa una cookie firmada
  `HttpOnly` y `SameSite=Strict`; los enlaces rápidos de los correos están firmados, vencen y solo
  actúan al pulsar el botón (los antivirus que abren enlaces no confirman nada por error).
- `vercel.json` añade cabeceras de seguridad, incluida una política de contenido (CSP). Si agregas
  servicios externos (mapas, fotos de otro dominio), actualiza la CSP.
- La política de privacidad (Ley 1581 de 2012) es una base editable: revísala con asesoría legal.
  Para quinceañeras se guarda la constancia de la autorización del acudiente o representante.
- Sin cookies de publicidad; estadísticas anónimas y sin cookies. Fuentes servidas desde el propio sitio.
- Imágenes responsivas en WebP/AVIF con carga diferida; páginas cargadas bajo demanda y precargadas
  en segundo plano; efectos que se simplifican solos en equipos modestos.

**Créditos de imágenes de referencia:** fotografías libres de [Pexels](https://www.pexels.com) y
[Unsplash](https://unsplash.com), usadas solo como demostración hasta tener las fotos reales.
