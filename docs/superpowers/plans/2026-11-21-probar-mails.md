# Probar mails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pantalla del panel (solo administradores) para ver la configuración de mails y mandarse cualquiera de los 5 mails reales, viendo el resultado o el error exacto de Resend.

**Architecture:** `EmailService` gana `enviarYEsperar` que devuelve el resultado; `enviar` lo usa por dentro y sigue sin lanzar. Un módulo puro `emails/pruebas.ts` arma cada uno de los 5 mails con textos reales + datos de ejemplo. Un controlador `admin/emails/prueba` (GET estado, POST envío) expone eso; el panel Angular lo consume en una ruta nueva `probar-mails`.

**Tech Stack:** NestJS 11 + Prisma + Resend + vitest (API); Angular + Angular Material (panel); tipos en `@ccvida/shared`.

**Spec:** `docs/superpowers/specs/2026-11-21-probar-mails-design.md`

## Global Constraints

- Solo rol `administrador` (API: `@Roles('administrador')` + `SesionGuard`; panel: `soloRoles('administrador')`).
- La clave de Resend nunca sale de la API.
- Asunto de las pruebas: prefijo exacto `"[Prueba] "`.
- Datos de ejemplo: nombre `"María Prueba"`, voucher número `0`, monto `100`, forma de pago `transferencia`, email/WhatsApp de ejemplo `maria.prueba@ejemplo.com` / `+54 9 11 0000-0000`, intereses `['Vida Kids']`.
- Límite: 5 envíos por minuto (por IP, con `IpThrottlerGuard` + `@Throttle`).
- Un solo destinatario por prueba (email válido).
- Los formularios de la web no cambian de comportamiento: `enviar` sigue sin lanzar nunca.
- Textos de la UI en español rioplatense del panel ("Revisá", "Probá"), como el resto del panel.

## Review Focus

- Resend sin configurar (`RESEND_API_KEY` vacío): la prueba debe responder `{ ok: false, error: 'Falta RESEND_API_KEY en la API: los mails no se envían.' }`, no "enviado".
- Resend lanza una excepción (red caída) en vez de devolver `error`: debe volver `{ ok: false, error: <mensaje> }`, no un 500.
- Destinatario con varias direcciones (`a@x.com, b@x.com`) o vacío: 400 con error en el campo `para`, sin enviar.
- Plantilla desconocida en el body: 400 con error en el campo `plantilla`.
- Textos del sitio sin `datosTransferencia` cargados: el mail de voucher se arma igual (cadena vacía), no falla.

---

### Task 1: Tipos compartidos

**Files:**
- Modify: `packages/shared/src/index.ts` (al final)

**Interfaces:**
- Produces:
  ```ts
  export type PlantillaEmail = 'bienvenidaVisita' | 'avisoRecepcion' | 'voucherRegistrado' | 'avisoTesoreria' | 'ladrilloConfirmado';
  export interface EstadoEmails { resendConectado: boolean; remitente: string; recepcion: string; tesoreria: string; }
  export interface PruebaEmail { plantilla: PlantillaEmail; para: string; }
  export type ResultadoEmail = { ok: true; id: string | null } | { ok: false; error: string };
  ```

- [ ] **Step 1:** Agregar los tipos de arriba a `packages/shared/src/index.ts`.
- [ ] **Step 2:** Verificar: `npm run build -w @ccvida/shared` (o `npx tsc --noEmit -p packages/shared` si no hay script) → sin errores.
- [ ] **Step 3: Commit** `feat(shared): tipos para probar mails`

### Task 2: `EmailService.enviarYEsperar`

**Files:**
- Modify: `apps/api/src/comun/email.service.ts`
- Test: `apps/api/src/comun/emails/plantillas.spec.ts` (bloque `describe('EmailService.enviar')` existente; agregar `describe('EmailService.enviarYEsperar')`)

**Interfaces:**
- Consumes: `ResultadoEmail` (Task 1).
- Produces: `async enviarYEsperar(para: string, asunto: string, html: string, opciones?: { responderA?: string }): Promise<ResultadoEmail>`; `enviar` queda con la misma firma y comportamiento (llama a `enviarYEsperar`, loguea si `!ok`, nunca lanza).

- [ ] **Step 1: Tests que fallan** (reusar el helper `armar()` del archivo):
  - `'devuelve ok con el id de Resend'`: `send` resuelve `{ data: { id: 'abc' }, error: null }` → `expect(await svc.enviarYEsperar('a@x.com','H','<p/>')).toEqual({ ok: true, id: 'abc' })`.
  - `'devuelve el error que da Resend'`: `send` resuelve `{ data: null, error: { message: 'The domain is not verified' } }` → `{ ok: false, error: 'The domain is not verified' }`.
  - `'si Resend lanza, devuelve el mensaje'`: `send` rechaza `new Error('socket hang up')` → `{ ok: false, error: 'socket hang up' }`.
  - `'sin Resend avisa que falta la clave'`: `svc.resend = null` → `{ ok: false, error: 'Falta RESEND_API_KEY en la API: los mails no se envían.' }`.
  - `'sin destinatarios'`: `' , '` → `{ ok: false, error: 'No hay destinatario.' }` y `send` no se llama.
  - `'enviar no lanza aunque Resend falle'`: `send` rechaza → `await expect(svc.enviar('a@x.com','H','<p/>')).resolves.toBeUndefined()`.
- [ ] **Step 2:** `cd apps/api && npx vitest run src/comun/emails/plantillas.spec.ts` → los nuevos FALLAN (`enviarYEsperar is not a function`).
- [ ] **Step 3:** Implementar `enviarYEsperar` moviendo ahí la lógica actual de `enviar`; `enviar` pasa a `const r = await this.enviarYEsperar(...)` y loguea con `this.log.error` cuando `!r.ok` (sin Resend sigue logueando con `this.log.log` como hoy).
- [ ] **Step 4:** Mismo comando → todo PASA (incluidos los 3 tests viejos de `enviar`).
- [ ] **Step 5: Commit** `feat(api): EmailService.enviarYEsperar devuelve el resultado del envío`

### Task 3: Armar los mails de prueba

**Files:**
- Create: `apps/api/src/comun/emails/pruebas.ts`
- Test: `apps/api/src/comun/emails/pruebas.spec.ts`

**Interfaces:**
- Consumes: plantillas de `./plantillas.js`; `TextosSitio` y `PlantillaEmail` de `@ccvida/shared`.
- Produces:
  ```ts
  export const PLANTILLAS_PRUEBA: PlantillaEmail[]; // los 5, en el orden del tipo
  export function emailDePrueba(plantilla: PlantillaEmail, d: { textos: TextosSitio; datosTransferencia: string; sitioUrl: string; panelUrl: string }): Email; // asunto con "[Prueba] "
  ```

- [ ] **Step 1: Tests que fallan** (`textos` de ejemplo armado a mano con los campos que usan las plantillas: `reunion`, `direccion`, `barrio`, `mapaUrl`, `versiculoBienvenida`; castear a `TextosSitio`):
  - `it.each(PLANTILLAS_PRUEBA)('%s: asunto con [Prueba] y nombre de ejemplo')` → `expect(asunto.startsWith('[Prueba] ')).toBe(true)` y `expect(html).toContain('María')`.
  - `'bienvenida usa la dirección real'`: `emailDePrueba('bienvenidaVisita', {...textos con direccion 'Camarones 2201'})` → `html` contiene `'Camarones 2201'`.
  - `'voucher con transferencia muestra los datos cargados'`: `datosTransferencia: 'CBU 123'` → `html` contiene `'CBU 123'`.
  - `'voucher sin datos de transferencia no falla'`: `datosTransferencia: ''` → no lanza, asunto `'[Prueba] Tu voucher Pro Templo Nº 0000'` (usar el formato real de `numeroVoucher(0)`; ajustar la cadena si el formato difiere).
  - `'PLANTILLAS_PRUEBA tiene las 5'` → `toHaveLength(5)`.
- [ ] **Step 2:** `npx vitest run src/comun/emails/pruebas.spec.ts` → FALLA (módulo no existe).
- [ ] **Step 3:** Implementar con un `switch` sobre `plantilla` llamando a cada plantilla con los datos de ejemplo de Global Constraints y los textos reales (`textos.direccion` como `direccion` en las que lo aceptan); después prefijar el asunto.
- [ ] **Step 4:** Mismo comando → PASA.
- [ ] **Step 5: Commit** `feat(api): mails de prueba con textos reales y datos de ejemplo`

### Task 4: Endpoints `admin/emails/prueba`

**Files:**
- Create: `apps/api/src/admin/emails-admin.controller.ts`
- Modify: `apps/api/src/admin/admin.module.ts` (registrar el controlador)
- Test: `apps/api/test/panel.e2e-spec.ts` (agregar casos, siguiendo cómo ese archivo ingresa como administrador y como otro rol)

**Interfaces:**
- Consumes: `EmailService.enviarYEsperar` (Task 2), `emailDePrueba`/`PLANTILLAS_PRUEBA` (Task 3), `ContenidoService.textos()`, `prisma.configuracion.findUnique({ where: { id: 1 } })` → `datosTransferencia`, `config.{resendApiKey,emailDe,emailRecepcion,emailTesoreria,sitioUrl,panelUrl}`.
- Produces:
  - `GET /api/admin/emails/prueba` → `EstadoEmails` (`recepcion`/`tesoreria` = el valor recortado o `''`).
  - `POST /api/admin/emails/prueba` body `PruebaEmail` → `200` con `ResultadoEmail`. DTO: `@IsIn(PLANTILLAS_PRUEBA, { message: 'Elegí qué mail mandar.' }) plantilla`; `@Transform(trim) @IsEmail({}, { message: 'Escribí un email válido.' }) para` (una sola dirección: `IsEmail` rechaza listas).
  - Controlador: `@Controller('admin/emails')`, `@UseGuards(SesionGuard)`, `@Roles('administrador')`; el POST además `@HttpCode(200)`, `@UseGuards(IpThrottlerGuard)`, `@Throttle({ default: { ttl: 60_000, limit: 5 } })`.

- [ ] **Step 1: Tests e2e que fallan** (con Resend sin clave en el entorno de test):
  - `'GET estado como administrador'` → 200, `body.resendConectado === false`, `body` no tiene ninguna propiedad cuyo valor sea la clave (`expect(JSON.stringify(body)).not.toContain('re_')`).
  - `'POST como editor → 403'`.
  - `'POST con plantilla desconocida → 400 con campos.plantilla'`.
  - `'POST con dos destinatarios → 400 con campos.para'` (`para: 'a@x.com, b@x.com'`).
  - `'POST válido sin Resend → 200 { ok: false, error: "Falta RESEND_API_KEY…" }'`.
- [ ] **Step 2:** `cd apps/api && npm run test:e2e -- panel` → los nuevos FALLAN (404).
- [ ] **Step 3:** Implementar el controlador y registrarlo en `AdminModule`.
- [ ] **Step 4:** Mismo comando → PASA. Además `npm test` (unitarios) → PASA.
- [ ] **Step 5: Commit** `feat(api): endpoints para probar mails desde el panel`

### Task 5: Pantalla "Probar mails" en el panel

**Files:**
- Create: `apps/admin/src/app/emails/probar-mails.ts`
- Modify: `apps/admin/src/app/app.routes.ts` (ruta `probar-mails`, título `'Probar mails · Panel CCVida'`, `canActivate: [soloRoles('administrador')]`, después de `usuarios`)
- Modify: `apps/admin/src/app/marco/marco.ts` (`SECCIONES`: `{ ruta: '/probar-mails', texto: 'Probar mails', icono: 'mail', roles: ['administrador'] }` al final; si `mail` no está registrado como `svgIcon`, registrarlo donde se registran los demás íconos)

**Interfaces:**
- Consumes: `GET/POST /api/admin/emails/prueba` (Task 4), tipos de Task 1, `SesionService.usuario()` (email por defecto), `errorDe` de `../api`.
- Produces: componente standalone `ProbarMails`.

- [ ] **Step 1:** Implementar `ProbarMails` siguiendo el estilo de `usuarios/usuarios.ts` (signals, `firstValueFrom`, Angular Material):
  - Bloque "Configuración": Resend `Conectado` / `Sin configurar` (etiquetas `success`/`danger` como en usuarios), remitente, recepción y tesorería (`'Sin cargar'` si vacío).
  - Formulario: `mat-select` con las 5 opciones (textos: `Bienvenida a una visita`, `Aviso a recepción`, `Voucher registrado`, `Aviso a tesorería`, `Ladrillo confirmado`), input `Para` precargado con el email del usuario, botón `Mandar prueba` deshabilitado mientras envía.
  - Resultado: `✔ Enviado a {para}` (+ `id de Resend: {id}` si hay) o `✘ {error}`; errores de validación de la API debajo de cada campo (`errorDe(e).campos`); 429 usa el mensaje de `errorDe`.
- [ ] **Step 2:** `cd apps/admin && npx ng build` → sin errores.
- [ ] **Step 3: Verificación en el navegador** (API local + panel local, usuario administrador): el ítem aparece en el menú; con un usuario editor no aparece y `/probar-mails` redirige; sin `RESEND_API_KEY` el envío muestra `✘ Falta RESEND_API_KEY…`; con dos direcciones muestra el error bajo `Para`.
- [ ] **Step 4: Commit** `feat(admin): pantalla para probar mails`
