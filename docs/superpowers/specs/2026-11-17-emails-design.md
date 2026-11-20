# Emails con Resend: bienvenida, voucher, tesorería y ladrillo confirmado

Fecha: 2026-11-17 · Rama: `feat/emails` (sale de `main`)

## Para qué

La iglesia no tiene WhatsApp por ahora, así que el email pasa a ser el canal con la gente. Hoy la
integración con Resend ya existe en la API, pero los emails son una tarjeta blanca de texto plano, los
formularios dejan elegir WhatsApp como único contacto (y esa persona no recibe nada) y las
instrucciones de pago dicen "mandanos el comprobante por WhatsApp".

## Objetivos

1. **Primera visita → tarjeta de bienvenida** a la persona: "¡Te esperamos, <nombre>!", día y
   dirección de la reunión, un versículo, un mensaje cálido y un botón **📍 Cómo llegar** (Google Maps).
2. **Pro Templo → email del voucher** a la persona: número, monto, instrucciones según la forma de
   pago (con los datos de transferencia cargados en el panel), **"respondé este email con la foto del
   comprobante"** y la aclaración de que **el ladrillo aparece en la pared recién cuando tesorería
   confirma el pago**.
3. **Aviso a tesorería** de cada voucher nuevo, con botón "Revisar en el panel". **Aviso a recepción**
   de cada visita nueva, con el mismo estilo.
4. **Ladrillo confirmado:** cuando tesorería confirma un voucher en el panel, a la persona le llega
   "¡Tu ladrillo ya está en la pared!" con su número y el link a la pared.
5. **Email obligatorio** en los formularios de Primera visita y Pro Templo; WhatsApp opcional.

## Fuera de alcance

- Envío por WhatsApp.
- Subir el comprobante en la web (se responde el email).
- Editor visual de emails en el panel (solo el versículo y el link del mapa son editables).
- Cambiar los vouchers o visitas ya cargados.

## Lo que no puede pasar

- Que un formulario falle porque Resend no responde (los emails siguen saliendo en segundo plano,
  como hoy).
- Que los textos sigan mandando a la gente a un WhatsApp que no existe.
- Datos de la persona sin escapar dentro del HTML.

## Enfoques considerados

1. **Plantillas HTML a mano dentro de la API (elegido).** Tablas y estilos inline (lo que Gmail y
   Outlook muestran bien), sin dependencias nuevas.
2. React Email o MJML: más cómodo de escribir, pero suma dependencias y un paso de compilación para
   cuatro emails.

## Diseño

### Estilo (elegido por Franyer: oscuro, como la web)

Fondo negro, texto `#f5f5f0`, gris `#a3a3a3`, acento verde hoja `#a0d062`, franja final azul vida
`#0c74b8` con "¡La iglesia sos vos!". Logo arriba en PNG. Versículo centrado en un bloque `#0a0a0a`
con comillas grandes verdes (sin borde lateral). Botones redondeados verde hoja con texto negro.
Ancho máximo 560 px, una columna, legible en el celular. Boceto aprobado: tarjeta de Primera visita
(estilo A) con el botón "Cómo llegar".

### API (`apps/api`)

- **`src/comun/emails/`** (nuevo): `marco(contenido)` (estructura común: logo, cuerpo, franja final,
  pie con nombre y dirección) y una función por email que recibe datos y devuelve `{ asunto, html }`:
  `bienvenidaVisita`, `voucherRegistrado`, `avisoTesoreria`, `avisoRecepcion`, `ladrilloConfirmado`.
  Todo texto de la persona pasa por `escapar`. Reemplaza a `plantilla`.
- **`EmailService.enviar(para, asunto, html, opciones?: { responderA?: string })`**: `para` acepta una
  lista separada por comas (para `RECEPCION_EMAIL` y `TESORERIA_EMAIL`); `responderA` → `replyTo` de
  Resend.
- **Voucher:** `replyTo` = las direcciones de `TESORERIA_EMAIL`. Asunto `Tu voucher Pro Templo Nº
  <n>` (el número en el asunto para que tesorería ubique la respuesta).
- **Confirmación:** en `POST /api/admin/vouchers/:numero/confirmar`, después de confirmar, si el
  voucher tiene email se manda `ladrilloConfirmado` (en segundo plano).
- **Instrucciones de pago** (`instruccionesDePago`, se ven también en la web): sin WhatsApp.
  Transferencia: "Transferí a esta cuenta y respondé el email que te mandamos con la foto del
  comprobante (Nº <n>)". Mercado Pago: "Te mandamos el link de pago por email". Efectivo: igual que hoy.
- **Datos nuevos de la API:** `PANEL_URL` (para el botón "Revisar en el panel"; por defecto
  `http://localhost:4200`), y `EMAIL_FROM` por defecto `CCVida Capital <hola@ccvidacapital.org>`.
- **Textos editables en el panel** (`TextosSitio`): `versiculoBienvenida: { texto, cita }` (por
  defecto Mateo 11:28, NVI) y `mapaUrl` (link de la ficha de Google Maps; vacío = se arma una búsqueda
  con `direccion` + "CABA").
- **Formularios:** los DTO de visita y voucher pasan a `email` (obligatorio, validado) y `whatsapp`
  (opcional). En la base: el email se sigue guardando en `contacto` con `contactoTipo = 'email'` y se
  agrega la columna opcional `whatsapp` en `visitas` y `vouchers` (migración aditiva, nada se borra).

### Web (`apps/web`)

- `FormVisita.astro` y `FormVoucher.astro`: campo **Email \*** y campo **WhatsApp (opcional)**; se
  sacan los botones "WhatsApp / Email". Mensaje de éxito: "Te mandamos un email a <email>…".
- Logo para emails: `public/logo-email.png` (PNG generado desde `logo.svg`, 192 px, fondo
  transparente); el email lo carga de `SITE_URL/logo-email.png`.

### Panel (`apps/admin`)

- Pantalla de textos: campos para el versículo de bienvenida (texto y cita) y el link de Google Maps.
- Listas de visitas y vouchers: mostrar el WhatsApp cuando exista.

### Probar sin mandar emails

Script `npm run emails:muestra -w @ccvida/api` que escribe los 5 HTML con datos de ejemplo en una
carpeta ignorada por git, para abrirlos en el navegador.

## Pruebas

- Unitarias de cada plantilla: contiene los datos, escapa HTML de la persona, link de mapa (con
  `mapaUrl` y sin él), voucher con y sin datos de transferencia, sin la palabra "WhatsApp".
- e2e: crear visita y voucher con email obligatorio (400 sin email), `whatsapp` opcional guardado;
  confirmar un voucher dispara `ladrilloConfirmado` (EmailService espiado); `replyTo` de tesorería.
- Manual: `emails:muestra` revisado en el navegador; con una clave de Resend de prueba, un envío real
  a una casilla propia.

## Decisiones tomadas por Claude (revisables)

- Versículo y link del mapa editables en el panel, con valores por defecto.
- Columna nueva `whatsapp` en vez de cambiar `contacto`/`contactoTipo` (no toca datos existentes).
- `PANEL_URL` como variable nueva de la API.
- El aviso a recepción también pasa al estilo nuevo.
- Mercado Pago: el link se manda por email a mano (tesorería), como hoy se hacía por WhatsApp.
