# MCP de contenido: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un servidor MCP local (stdio) que deja a Claude Code cargar todo el contenido de la web por la API, siempre en borrador, con un token propio de rol editor.

**Architecture:** La API acepta `Authorization: Bearer` como alternativa a la cookie y un script crea un token (sesión de 90 días de un usuario dedicado). Un workspace nuevo `apps/mcp` expone herramientas MCP que llaman a las rutas `/api/admin/*` existentes; la lógica de cada herramienta vive en funciones que reciben un cliente HTTP inyectable, para probarlas sin servidor.

**Tech Stack:** NestJS 11 + Prisma 7 + vitest (API); Node 24, TypeScript ESM, `@modelcontextprotocol/sdk` 1.x (stdio) + zod, vitest (MCP).

**Spec:** `docs/superpowers/specs/2026-11-15-mcp-contenido-design.md`

## Global Constraints

- Usuario del token: email `mcp@ccvidacapital.org`, nombre `MCP (Claude)`, rol `editor`, clave aleatoria, `debeCambiarClave: false`.
- Token = fila de `sesiones` con `completa: true`, vencimiento **90 días** por defecto (`--dias N`), solo el hash en la base (`hashToken`), se muestra **una sola vez**; crear uno nuevo **borra las sesiones anteriores** de ese usuario.
- La API acepta `Authorization: Bearer <token>` además de la cookie `ccvida_sesion`; la cookie tiene prioridad si vienen las dos.
- Configuración del MCP: `CCVIDA_API_URL` (por defecto `http://localhost:3000`), `CCVIDA_MCP_TOKEN`; o `CCVIDA_MCP_ENV` con la ruta a un archivo `KEY=valor` (por defecto `C:\Users\frand\.secrets\ccvida-mcp.env`). Las variables de entorno pisan al archivo. Sin token: error claro al llamar cualquier herramienta, no al arrancar.
- Todo lo que se **crea** va con `estado: 'borrador'`, aunque el pedido diga otra cosa.
- `editar_*` solo si el elemento está en `borrador`; si no, error exacto: `Está publicado: pasalo a borrador desde el panel para editarlo con el MCP.`
- `editar_textos` sin `confirmar: true` **no guarda**: devuelve los cambios (antes → después) y el aviso `Al confirmar, esto sale en la web enseguida.`
- Sin herramientas de borrar ni de publicar. Sin acceso a tesorería, visitas ni usuarios.
- El token nunca se escribe en el repo, en `.mcp.json` del proyecto ni en logs.
- Textos de las herramientas (descripciones y mensajes) en castellano rioplatense.

## Review Focus

- `subir_foto` con una ruta que no existe, un archivo que no es imagen o uno de más de 15 MB: mensaje claro, sin subir nada. → tests en Task 4.
- La API caída o el token vencido (401): la herramienta devuelve un error legible ("No se pudo conectar con la API en …" / el `mensaje` de la API), nunca un stack trace. → tests en Task 2.
- `editar_*` con un id o slug que no existe: `No encontré <tipo> "<x>".` → test en Task 3.
- Mezcla parcial: editar solo `resumen` no borra `actividades`, `fotoId` ni el slug. → test en Task 3.
- `editar_textos` con un campo anidado (`pastores.cita`) no pisa los demás campos de `pastores`. → test en Task 4.

---

### Task 1: Token del MCP en la API

**Files:**
- Modify: `apps/api/src/auth/sesion.guard.ts` (`tokenDe`)
- Create: `apps/api/prisma/crear-token-mcp.ts`
- Modify: `apps/api/package.json` (script `"crear-token-mcp": "tsx prisma/crear-token-mcp.ts"`)
- Test: `apps/api/test/panel.e2e-spec.ts` (o un archivo nuevo `apps/api/test/token-mcp.e2e-spec.ts`)

**Interfaces:**
- Produces: `tokenDe(req)` → cookie `ccvida_sesion`, o si no hay, el valor de `Authorization: Bearer <x>` (regex `/^Bearer\s+(.+)$/i`). `crearTokenMcp(prisma, dias = 90): Promise<{ token: string; expira: Date }>` exportada desde el script para poder testearla; el script la llama y muestra token, vencimiento y cómo guardarlo.

- [ ] **Step 1: e2e que fallan** (`describe('Token del MCP')`):
  - `crearTokenMcp(prisma)` → con `Authorization: Bearer <token>`, `GET /api/admin/ministerios` → 200.
  - mismo token en `GET /api/admin/visitas`, `GET /api/admin/usuarios` y `GET /api/admin/vouchers` → 403.
  - `crearTokenMcp` dos veces → el primer token da 401, el segundo 200.
  - sesión con `expira` en el pasado → 401; usuario MCP con `activo: false` → 401.
  - el usuario creado tiene `rol: 'editor'`, `email: 'mcp@ccvidacapital.org'`.
  - `afterAll` borra el usuario MCP (las sesiones caen en cascada).
- [ ] **Step 2:** `npm run test:e2e -w @ccvida/api` → los nuevos FAIL.
- [ ] **Step 3: Implementar** `tokenDe` y `crearTokenMcp` (upsert del usuario con `passwordHash: await hashClave(nuevoToken())`, `activo: true`, `rol: 'editor'`; `deleteMany` de sus sesiones; `create` con `tokenHash: hashToken(token)`, `completa: true`, `expira: ahora + dias`). El script: si `import.meta` es el entrypoint, lee `--dias`, llama, imprime y desconecta.
- [ ] **Step 4:** `npm test -w @ccvida/api && npm run test:e2e -w @ccvida/api` → PASS.
- [ ] **Step 5: Commit** `feat(api): token del MCP por Authorization Bearer`

### Task 2: Workspace `apps/mcp`, configuración y cliente de la API

**Files:**
- Create: `apps/mcp/package.json` (`@ccvida/mcp`, `"type": "module"`, scripts `build: tsc`, `test: vitest run`, `start: node dist/index.js`; deps `@modelcontextprotocol/sdk`, `zod`; dev `typescript`, `vitest`, `@types/node`; dep `@ccvida/shared` para tipos), `apps/mcp/tsconfig.json` (NodeNext, `outDir: dist`, `strict`)
- Create: `apps/mcp/src/config.ts`, `apps/mcp/src/cliente.ts`
- Test: `apps/mcp/src/config.spec.ts`, `apps/mcp/src/cliente.spec.ts`

**Interfaces:**
- Produces:
  - `leerConfig(env = process.env, leerArchivo = (r) => readFileSync(r,'utf8')): { apiUrl: string; token: string | null }`
  - `class ErrorHerramienta extends Error` (mensaje para mostrar tal cual).
  - `class ClienteApi { constructor(cfg: { apiUrl: string; token: string | null }, fetchFn = fetch); get<T>(ruta): Promise<T>; post<T>(ruta, cuerpo): Promise<T>; put<T>(ruta, cuerpo): Promise<T>; subir<T>(ruta, form: FormData): Promise<T> }` — manda `Authorization: Bearer`, JSON salvo `subir`.

- [ ] **Step 1: Tests que fallan:**
  - config: env pisa archivo; archivo con `#` comentarios y líneas vacías; sin archivo y sin env → `{ apiUrl: 'http://localhost:3000', token: null }`; `apiUrl` sin barra final.
  - cliente: sin token → `ErrorHerramienta('Falta el token del MCP: corré npm run crear-token-mcp -w @ccvida/api y guardalo en …')` (con la ruta del archivo); respuesta 400 `{ mensaje, campos }` → `ErrorHerramienta` con el mensaje y cada campo en una línea `- campo: texto`; 401 → mensaje de la API; `fetch` que rechaza → `No se pudo conectar con la API en <apiUrl>.`; el header `Authorization` lleva `Bearer <token>`.
- [ ] **Step 2:** `npm test -w @ccvida/mcp` → FAIL.
- [ ] **Step 3: Implementar.** Agregar `apps/mcp` no requiere tocar el `package.json` raíz (workspaces `apps/*`); correr `npm install` para enlazarlo.
- [ ] **Step 4:** `npm test -w @ccvida/mcp && npm run build -w @ccvida/mcp` → PASS.
- [ ] **Step 5: Commit** `feat(mcp): configuración y cliente de la API`

### Task 3: Herramientas de contenido

**Files:**
- Create: `apps/mcp/src/contenido.ts`
- Test: `apps/mcp/src/contenido.spec.ts`

**Interfaces:**
- Consumes: `ClienteApi`, `ErrorHerramienta` (Task 2); tipos `MinisterioAdmin`, `EventoAdmin`, `PredicaAdmin`, `SerieAdmin`, `Guardar` de `@ccvida/shared`.
- Produces (todas `async`, reciben `cliente: ClienteApi` primero):
  - `type Tipo = 'ministerios' | 'eventos' | 'predicas' | 'series'` → rutas `/api/admin/<tipo>`; ruta web: ministerios → `/ministerios/<slug>`, eventos → `/eventos/<slug>`, predicas → `/predicas/<slug>`, series → sin página (sin link).
  - `listarContenido(cliente, tipo: Tipo | 'fotos')` → `{ id, titulo, slug, estado }[]` (`titulo` = `nombre` o `titulo`; fotos: `{ id, textoAlternativo, url }` desde `GET /api/admin/medios`, primera página).
  - `verContenido(cliente, tipo, clave: string)` → el elemento cuyo `id` o `slug` sea `clave`; si no hay: `No encontré <tipo> "<clave>".`
  - `crearContenido(cliente, tipo, datos: Record<string, unknown>)` → POST con `estado: 'borrador'` forzado; devuelve `{ id, slug, estado, vistaPrevia: string | null }`.
  - `editarContenido(cliente, tipo, clave, cambios: Record<string, unknown>)` → lee con `verContenido`; si `estado !== 'borrador'` lanza el error exacto de Global Constraints; arma el cuerpo `Guardar` desde el elemento actual (`foto` → `fotoId: foto?.id ?? null`, conserva `slug`, saca `id`, `actualizado`, `predicas`), aplica `cambios` encima (ignora `estado`), PUT a `/<tipo>/<id>`; devuelve lo mismo que crear.
  - `linkVistaPrevia(cliente, tipo, slug)` → `POST /api/admin/vista-previa { ruta }` → `url`; para `series` devuelve `null`; si la API responde 503 devuelve `null` (no falla la creación).

- [ ] **Step 1: Tests que fallan** con un `fetch` falso que registra pedidos:
  - crear con `estado: 'publicado'` en los datos → el POST lleva `estado: 'borrador'`.
  - editar un publicado → el error exacto, sin PUT.
  - editar solo `resumen` de un ministerio con `actividades` y foto → el PUT conserva `actividades`, `fotoId`, `slug`.
  - editar con clave inexistente → `No encontré ministerios "x".`
  - crear evento devuelve `vistaPrevia` con la URL del POST de vista previa; con 503 → `vistaPrevia: null` y la creación igual se devuelve.
  - `listarContenido('predicas')` mapea `titulo`.
- [ ] **Step 2:** `npm test -w @ccvida/mcp` → FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(mcp): herramientas de ministerios, eventos, prédicas y series`

### Task 4: Fotos y textos

**Files:**
- Create: `apps/mcp/src/fotos.ts`, `apps/mcp/src/textos.ts`
- Test: `apps/mcp/src/fotos.spec.ts`, `apps/mcp/src/textos.spec.ts` (fixture: una imagen chica en `apps/mcp/test/fixtures/foto.jpg`, generada con sharp o un JPEG mínimo commiteado)

**Interfaces:**
- Consumes: `ClienteApi`, `ErrorHerramienta`.
- Produces:
  - `subirFoto(cliente, { ruta: string; textoAlternativo: string; credito?: string })` → `{ id, url, textoAlternativo }`. Antes de subir: existe, extensión `.jpg|.jpeg|.png|.webp|.avif` (MIME según extensión), tamaño ≤ 15 MB; si no: `No encontré el archivo <ruta>.` / `La foto tiene que ser JPG, PNG, WebP o AVIF.` / `La foto pesa más de 15 MB.` Multipart con campos `archivo`, `textoAlternativo`, `credito` a `POST /api/admin/medios`.
  - `verTextos(cliente)` → `GET /api/admin/textos` sin la clave `fotos`.
  - `editarTextos(cliente, cambios: Record<string, unknown>, confirmar = false)` → mezcla profunda (objetos planos se mezclan, arrays y valores se reemplazan) sobre lo actual sin `fotos`; lista de cambios `{ campo: 'pastores.cita', antes, despues }[]` solo de hojas que cambian. Sin `confirmar`: `{ guardado: false, cambios, aviso: 'Al confirmar, esto sale en la web enseguida.' }`. Con `confirmar: true`: `PUT /api/admin/textos` con el objeto completo → `{ guardado: true, cambios }`. Sin cambios → `{ guardado: false, cambios: [] }` sin PUT.

- [ ] **Step 1: Tests que fallan:** ruta inexistente, `.gif`, archivo > 15 MB (stub de `stat`), subida OK manda los 3 campos; `editarTextos({ pastores: { cita: 'x' } })` sin confirmar no hace PUT y lista solo `pastores.cita`; con confirmar el PUT conserva `pastores.nombres` y `pastores.texto` y no lleva `fotos`; cambio a `youtube` aparece en la lista.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** `npm test -w @ccvida/mcp` → PASS.
- [ ] **Step 5: Commit** `feat(mcp): subir fotos y editar textos con confirmación`

### Task 5: Servidor MCP, registro y prueba de punta a punta

**Files:**
- Create: `apps/mcp/src/index.ts` (servidor), `apps/mcp/README.md`
- Modify: `README.md` (sección "MCP de contenido" con 4 pasos: crear token, guardarlo en `C:\Users\frand\.secrets\ccvida-mcp.env` como `CCVIDA_MCP_TOKEN=…` y `CCVIDA_API_URL=…`, `npm run build -w @ccvida/mcp`, `claude mcp add --scope user ccvida-contenido -- node <ruta absoluta>/apps/mcp/dist/index.js`)

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces: herramientas `listar_contenido`, `ver_contenido`, `crear_ministerio`, `crear_evento`, `crear_predica`, `crear_serie`, `editar_ministerio`, `editar_evento`, `editar_predica`, `editar_serie`, `subir_foto`, `ver_textos`, `editar_textos`, `link_vista_previa`. Esquemas zod con los campos de `Guardar<…>` de cada tipo (todos opcionales en editar; obligatorios en crear: ministerio `nombre`; evento `titulo`, `inicio`; prédica `titulo`, `fecha`, `predicador`; serie `nombre`). Descripciones en castellano que digan "queda en borrador" y, en editar_textos, "pedí confirmación antes de mandar confirmar: true". Cada handler devuelve el resultado como texto JSON; `ErrorHerramienta` → `{ isError: true, content: [{ type: 'text', text: mensaje }] }`; cualquier otro error → `Error inesperado: <message>`.

- [ ] **Step 1:** Implementar `index.ts` con `McpServer` + `StdioServerTransport`; `leerConfig()` una vez al arrancar, sin fallar si falta el token. Nada de `console.log` (stdout es el protocolo): logs a `stderr`.
- [ ] **Step 2:** `npm run build -w @ccvida/mcp` y prueba de humo con el inspector o un script: `listTools` devuelve las 14 herramientas.
- [ ] **Step 3: Punta a punta en local:** API local con `VISTA_PREVIA_SECRETO`, `npm run crear-token-mcp -w @ccvida/api`, llamar por stdio (script de prueba en el scratchpad o `@modelcontextprotocol/inspector --cli`) a `subir_foto` con la fixture, `crear_ministerio` con esa `fotoId`, `editar_ministerio` cambiando `resumen`, `link_vista_previa`, `editar_textos` sin y con confirmar (restaurar el valor después). Registrar comandos y salidas en el reporte. Borrar lo creado.
- [ ] **Step 4:** README raíz + `apps/mcp/README.md`. `npm run build && npm test -w @ccvida/api && npm test -w @ccvida/mcp`.
- [ ] **Step 5: Commit** `feat(mcp): servidor MCP de contenido`
