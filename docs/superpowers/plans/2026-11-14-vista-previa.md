# Vista previa de borradores: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desde el panel, abrir la web real mostrando borradores de ministerios, eventos y prédicas, aunque la web esté en construcción.

**Architecture:** La API firma un permiso HMAC de 1 hora y arma la URL de la web. La web lo guarda en una cookie propia; con esa cookie el middleware saltea el modo en construcción y `contenido()` pide `/api/contenido/vista-previa` (borradores + publicado, sin caché). El panel suma un botón que abre esa URL.

**Tech Stack:** NestJS 11 + Prisma 7 + vitest (API), Astro SSR con adaptador Node (web), Angular + Material con signals (panel).

**Spec:** `docs/superpowers/specs/2026-11-14-vista-previa-design.md`

## Global Constraints

- Permiso: HMAC-SHA256 con `VISTA_PREVIA_SECRETO` (solo en la API), vence a la **1 hora**, no se guarda en la base, comparación con `timingSafeEqual`.
- Sin `VISTA_PREVIA_SECRETO`: `POST /api/admin/vista-previa` y `GET /api/contenido/vista-previa` responden **503**; todo lo demás igual.
- Roles que pueden pedir el permiso: `administrador` y `editor`.
- Cookie de la web: `ccvida_vista_previa`, httpOnly, Secure en producción, SameSite=Lax, `maxAge` 3600, path `/`.
- Respuestas en vista previa: `X-Robots-Tag: noindex, nofollow` y `Cache-Control: private, no-store`.
- `/api/contenido` público, `sitemap.xml` y `eventos/[slug].ics` siguen mostrando **solo lo publicado**.
- Rutas aceptadas en `ruta`/`ir`: empiezan con `/`, no con `//`, sin `\`, máximo 200 caracteres.
- Textos de interfaz en castellano rioplatense (voseo), como el resto del proyecto.

## Review Focus

- Permiso vencido mientras se navega la vista previa: esa página sale con el contenido publicado, la web borra la cookie y la siguiente ya es la web normal (o "en construcción"); nunca error 500. → verificación en Task 3.
- `ir=https://otro-sitio.com` o `ir=//otro-sitio.com`: no debe redirigir afuera (open redirect). → tests en Task 1 (`rutaInterna`) y Task 3.
- La caché `ultimo` de la web pública nunca guarda datos de vista previa. → verificación en Task 3.
- Un evento en borrador que apunta a un ministerio en borrador: en vista previa el link al ministerio aparece. → e2e en Task 2.
- El bloqueador de ventanas emergentes: `window.open` después de un `await` lo bloquea Safari/Chrome; abrir la pestaña antes de pedir el permiso. → Task 4, paso 1.

---

### Task 1: Permiso firmado (API)

**Files:**
- Create: `apps/api/src/contenido/vista-previa.ts`
- Test: `apps/api/src/contenido/vista-previa.spec.ts`
- Modify: `apps/api/src/config.ts` (agregar `vistaPreviaSecreto: process.env.VISTA_PREVIA_SECRETO ?? ''`)
- Modify: `apps/api/.env.example` (bloque nuevo con `VISTA_PREVIA_SECRETO=` y comentario "Clave para firmar la vista previa de borradores. Vacía = vista previa desactivada. Generar con: openssl rand -base64 32")

**Interfaces:**
- Produces:
  - `DURACION_PERMISO_MS = 3_600_000`
  - `firmarPermiso(usuarioId: string, secreto: string, ahora?: number): string` → formato `<payload base64url>.<firma base64url>`, payload `{"u":usuarioId,"exp":ahora+DURACION}`
  - `verificarPermiso(permiso: string, secreto: string, ahora?: number): { usuarioId: string } | null`
  - `rutaInterna(ruta: unknown): ruta is string`

- [ ] **Step 1: Escribir los tests que fallan** en `vista-previa.spec.ts`:
  - `verificarPermiso(firmarPermiso('u1','s',0),'s',1000)` → `{ usuarioId: 'u1' }`
  - vencido: `verificarPermiso(firmarPermiso('u1','s',0),'s',DURACION_PERMISO_MS + 1)` → `null`
  - otra clave: firmado con `'s'`, verificado con `'otra'` → `null`
  - payload alterado (cambiar un carácter antes del `.`) → `null`
  - basura: `''`, `'abc'`, `'a.b.c'` → `null`
  - `rutaInterna`: `true` para `'/'`, `'/ministerios/vida-kids'`; `false` para `'//evil.com'`, `'https://evil.com'`, `'ministerios'`, `'/\\evil.com'`, `'/' + 'a'.repeat(200)`, `42`
- [ ] **Step 2:** `npm test -w @ccvida/api -- vista-previa` → FAIL (módulo no existe).
- [ ] **Step 3: Implementar** con `createHmac('sha256', secreto)` sobre el payload en base64url y `timingSafeEqual` (comparar largos antes). Cualquier excepción de parseo devuelve `null`.
- [ ] **Step 4:** `npm test -w @ccvida/api -- vista-previa` → PASS.
- [ ] **Step 5: Commit** `feat(api): permiso firmado para la vista previa`

### Task 2: Endpoints de la API

**Files:**
- Modify: `apps/api/src/contenido/contenido.service.ts`
- Create: `apps/api/src/contenido/vista-previa.controller.ts`
- Modify: `apps/api/src/contenido/publico.controller.ts`
- Modify: `apps/api/src/contenido/contenido.module.ts` (registrar el controlador)
- Test: `apps/api/test/contenido.e2e-spec.ts` (nuevo `describe` o `it`s al final)

**Interfaces:**
- Consumes: Task 1 (`firmarPermiso`, `verificarPermiso`, `rutaInterna`), `config.vistaPreviaSecreto`, `config.sitioUrl`.
- Produces:
  - `ContenidoService.conBorradores(ahora?: number): Promise<ContenidoPublico>`: sin caché, estados `['borrador','publicado']`.
  - `POST /api/admin/vista-previa` body `{ ruta: string }` → `200 { url: string }` = `${config.sitioUrl}/vista-previa?permiso=<p>&ir=<encodeURIComponent(ruta)>`; ruta inválida → 400 `{ mensaje: 'Ruta inválida.' }`; sin clave → 503 `{ mensaje: 'La vista previa no está configurada.' }`.
  - `GET /api/contenido/vista-previa` con `Authorization: Bearer <permiso>` → 200 `ContenidoPublico`, header `Cache-Control: private, no-store`; sin permiso o inválido → 401; sin clave → 503.

- [ ] **Step 1: Refactor sin cambio de comportamiento:** extraer de `publico()` un `private async armar(estados: EstadoContenido[], ahora: number)`. `publico()` mantiene la caché y llama `armar(['publicado'], ahora)`. Los chequeos `e.ministerio?.estado === 'publicado'` y `p.serie?.estado === 'publicado'` pasan a `estados.includes(...)`. Agregar `conBorradores(ahora = Date.now())` que llama `armar(['borrador','publicado'], ahora)` sin tocar `this.cache`.
- [ ] **Step 2:** `npm test -w @ccvida/api && npm run test:e2e -w @ccvida/api` → todo PASS (nada cambió aún).
- [ ] **Step 3: Escribir los e2e que fallan** (la clave se fija en el test con `config.vistaPreviaSecreto = 'secreto-e2e'` en `beforeAll` y se restaura en `afterAll`):
  - `recepción no puede pedir vista previa`: POST con agente de rol `recepcion` → 403.
  - `editor pide la URL`: POST `{ ruta: '/ministerios/x' }` → 200 y `url` empieza con `${config.sitioUrl}/vista-previa?permiso=` y termina con `&ir=%2Fministerios%2Fx`.
  - `ruta externa`: POST `{ ruta: '//evil.com' }` → 400.
  - `la vista previa trae borradores`: crear ministerio borrador `M ${SUFIJO}` y evento borrador ligado a él; con el permiso de la URL, GET `/api/contenido/vista-previa` → incluye el ministerio, el evento tiene `ministerio` = slug del ministerio, header `cache-control` contiene `no-store`; GET `/api/contenido` → no incluye ninguno de los dos.
  - `sin permiso o con permiso de otra clave` → 401.
  - `sin clave configurada`: con `config.vistaPreviaSecreto = ''` → POST 503 y GET 503.
- [ ] **Step 4:** `npm run test:e2e -w @ccvida/api` → FAIL (rutas no existen).
- [ ] **Step 5: Implementar** `VistaPreviaController` (`@Controller('admin/vista-previa')`, `@UseGuards(SesionGuard)`, `@Roles('administrador','editor')`, `@Post() @HttpCode(200)`, usa `@Sesion() s: SesionActual` → `s.usuario.id`). En `ContenidoPublicoController` agregar `@Get('vista-previa')` que lee `req.headers.authorization`, quita `Bearer `, valida y responde con `@Header('Cache-Control','private, no-store')`. Errores con `ServiceUnavailableException`, `UnauthorizedException`, `BadRequestException` usando `{ mensaje }` como el resto.
- [ ] **Step 6:** `npm test -w @ccvida/api && npm run test:e2e -w @ccvida/api` → PASS.
- [ ] **Step 7: Commit** `feat(api): endpoints de vista previa con borradores`

### Task 3: Modo vista previa en la web

**Files:**
- Create: `apps/web/src/env.d.ts` (`declare namespace App { interface Locals { vistaPrevia?: string } }`)
- Create: `apps/web/src/lib/vista-previa.ts`
- Create: `apps/web/src/pages/vista-previa.ts`
- Modify: `apps/web/src/middleware.ts`
- Modify: `apps/web/src/lib/contenido.ts`
- Modify: `apps/web/src/layouts/Base.astro` (aviso) y cada página que llama `contenido()`: `index.astro`, `nosotros.astro`, `en-vivo.astro`, `eventos/index.astro`, `eventos/[slug].astro`, `ministerios/index.astro`, `ministerios/[slug].astro`, `predicas/[slug].astro` si la usa, y cualquier otra que aparezca con `grep -rn "contenido()" apps/web/src`.

**Interfaces:**
- Consumes: `GET /api/contenido/vista-previa` (Task 2).
- Produces:
  - `COOKIE_VISTA_PREVIA = 'ccvida_vista_previa'`, `rutaInterna(ruta: unknown): ruta is string` (misma regla que la API) en `lib/vista-previa.ts`.
  - `App.Locals` también lleva `vistaPreviaVencida?: boolean`.
  - `contenido(locals?: App.Locals): Promise<ContenidoPublico>`: con `locals?.vistaPrevia` pide la vista previa **sin leer ni escribir `ultimo`**; si la API responde 401, pone `locals.vistaPrevia = undefined`, `locals.vistaPreviaVencida = true` y devuelve el contenido público normal (con la caché de siempre). No se lanza excepción: Astro transmite la página en streaming y un error a mitad de render no llega al middleware.
  - Endpoint `GET /vista-previa?permiso=&ir=`: setea la cookie y `redirect(ir válido ?? '/')`; `GET /vista-previa?salir` borra la cookie y redirige a `/`. Sin `permiso` ni `salir` → redirige a `/`.

- [ ] **Step 1: Middleware.** Orden: (1) `/vista-previa` pasa siempre; (2) si existe la cookie: `locals.vistaPrevia = valor`, `next()`, y a la respuesta le pone `X-Robots-Tag: noindex, nofollow` y `Cache-Control: private, no-store`; si después de `next()` quedó `locals.vistaPreviaVencida`, borra la cookie (esa página ya salió con contenido público y sin aviso; la siguiente entra sin cookie); (3) sin cookie, la lógica actual de `EN_CONSTRUCCION`.
- [ ] **Step 2: `contenido(locals)`** y pasar `Astro.locals` en `Base.astro` y en todas las páginas de la lista. `sitemap.xml.ts` y `eventos/[slug].ics.ts` siguen con `contenido()` sin argumento.
- [ ] **Step 3: Aviso en `Base.astro`** cuando `Astro.locals.vistaPrevia`: barra fija arriba, fondo amarillo de la marca (`#f5d547`), texto negro: **"Vista previa: estás viendo borradores."** y link **"Salir"** a `/vista-previa?salir`. Además `<meta name="robots" content="noindex, nofollow">`.
- [ ] **Step 4: Verificación manual en local** (la web no tiene tests automáticos). Con la API local con `VISTA_PREVIA_SECRETO=dev` y un ministerio en borrador `prueba-borrador`; web con `ASTRO_ADAPTER=node`, `EN_CONSTRUCCION=true`, `npm run build -w @ccvida/web && node apps/web/dist/server/entry.mjs`:
  - URL del POST de la API (con sesión de editor) → abrirla: redirige a `/ministerios/prueba-borrador`, se ve la página con el aviso, `curl -I` muestra `x-robots-tag: noindex, nofollow` y `cache-control: private, no-store`.
  - Sin cookie: `curl -s localhost:4321/ministerios/prueba-borrador` → página "en construcción".
  - `curl -sI "localhost:4321/vista-previa?permiso=x&ir=//evil.com"` → `location: /`.
  - Permiso inválido en la cookie (`curl -i -b ccvida_vista_previa=basura localhost:4321/ministerios`) → 200 con contenido público, sin el borrador, con `set-cookie` que borra la cookie; nunca 500.
  - Con `EN_CONSTRUCCION` apagada y sin cookie, recargar `/ministerios` después de una vista previa → el borrador **no** aparece (la caché `ultimo` no se ensució).
- [ ] **Step 5:** `npm run build` (todo el monorepo) → sin errores.
- [ ] **Step 6: Commit** `feat(web): modo vista previa con borradores`

### Task 4: Botón en el panel

**Files:**
- Modify: `apps/admin/src/app/contenido/comun.ts`
- Modify: `apps/admin/src/app/contenido/ministerios.ts`, `eventos.ts`, `predicas.ts`

**Interfaces:**
- Consumes: `POST /api/admin/vista-previa` (Task 2).
- Produces: `abrirVistaPrevia(http: HttpClient, avisos: Avisos, ruta: string): Promise<void>` en `contenido/comun.ts`.

- [ ] **Step 1: `abrirVistaPrevia`.** Primero `const pestana = window.open('', '_blank')` (sincrónico, para que no lo bloquee el navegador), después el POST y `pestana.location.href = url`. Si falla: `pestana?.close()` y `avisos.error(errorDe(e).mensaje)` (el 503 ya trae "La vista previa no está configurada.").
- [ ] **Step 2: En la lista** de cada pantalla, al lado del botón de editar: `<button matIconButton type="button" (click)="vistaPrevia(x)" [attr.aria-label]="'Vista previa de ' + nombre"><mat-icon svgIcon="visibility" /></button>`, con ruta `/ministerios/${m.slug}`, `/eventos/${e.slug}`, `/predicas/${p.slug}`.
- [ ] **Step 3: En el formulario de edición** (solo si `editando()` es un id): botón `matButton` "Vista previa" junto a Cancelar. Guardar el slug y una foto del formulario al entrar a `editar()` (`JSON.stringify(this.f)`); si el formulario cambió, el botón queda deshabilitado con `matTooltip`/texto de ayuda **"Guardá para ver la vista previa"**. Usa el slug guardado, no el del formulario.
- [ ] **Step 4:** `npm run build -w @ccvida/admin` → sin errores. Verificación manual con `npm run dev:admin` + API local: el botón abre la web en una pestaña nueva con el borrador; con la API sin clave aparece el aviso de error y la pestaña se cierra.
- [ ] **Step 5: Commit** `feat(admin): botón de vista previa en ministerios, eventos y prédicas`

### Task 5: Documentación y cierre

**Files:**
- Modify: `README.md` (sección "Sitio público y contenido": cómo funciona la vista previa y la variable `VISTA_PREVIA_SECRETO`; en la tabla de la API de Coolify, nombrar la variable).
- Modify: `.env.produccion` (local, ignorado por git): agregar `VISTA_PREVIA_SECRETO=` al bloque de la API con la nota "generar con openssl rand -base64 32".

- [ ] **Step 1:** Editar README y `.env.produccion`.
- [ ] **Step 2:** `npm run build && npm test -w @ccvida/api && npm run test:e2e -w @ccvida/api` → todo PASS.
- [ ] **Step 3: Commit** `docs: vista previa de borradores`
