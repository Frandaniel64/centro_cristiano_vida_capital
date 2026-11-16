# MCP de contenido para CCVida

Fecha: 2026-11-15 · Rama: `feat/mcp-contenido` (sale de `feat/vista-previa`)

## Para qué

Franyer recibe el contenido de la web por WhatsApp, audios y fotos: respuestas de los pastores y de
cada ministerio, prédicas, eventos. Hoy lo tiene que tipear en el panel. Con un servidor MCP,
Claude Code carga ese contenido directo en la API ("cargá las respuestas de Vida Kids", "subí estas
fotos del campamento") y Franyer lo revisa con la vista previa antes de publicarlo.

## Objetivos

- Herramientas MCP para **todo el contenido**: ministerios, eventos, prédicas, series, textos de la
  web (Nosotros, pastores, preguntas, etc.), link del canal de YouTube y fotos.
- **Subir fotos desde archivos de la PC** con su texto alternativo.
- Que todo lo que se crea quede **en borrador**; publicar sigue siendo una decisión humana en el panel.
- Devolver el link de **vista previa** de lo que se cargó.

## Fuera de alcance

- Publicar, despublicar o borrar desde el MCP.
- Uso por otras personas o desde Claude.ai/celular (MCP remoto). Se puede agregar después
  reutilizando las mismas herramientas.
- Tesorería, vouchers, visitas y usuarios.
- Horarios de la transmisión en vivo (hoy están fijos en el código: domingo de 10 a 13 h).

## Lo que no puede pasar

- Que el MCP cambie algo **publicado** sin que Franyer lo sepa.
- Que el token sirva para algo más que contenido, o que quede en el repo.
- Que se publique algo sin que una persona lo haya revisado.

## Enfoques considerados

1. **MCP local en el monorepo que usa la API con un token propio (elegido).** Reutiliza las
   validaciones, el procesamiento de fotos y la invalidación de caché de la API. Token acotado al
   rol de edición, revocable y con registro de quién cambió qué.
2. MCP que entra con email y contraseña de una persona: guarda una contraseña con todos sus
   permisos, las sesiones vencen a las 12 h y no sirve con cuentas que piden 2FA.
3. MCP conectado directo a Postgres: saltea validaciones, fotos y caché, da acceso total a la base
   y obliga a abrir su puerto. Descartado.

## Diseño

### API (`apps/api`): token del MCP

- **Usuario dedicado** `mcp@ccvidacapital.org`, nombre "MCP (Claude)", rol `editor`, clave
  aleatoria que nadie conoce (`debeCambiarClave: false`). Aparece en Usuarios del panel; darlo de
  baja ahí corta el acceso.
- **El token es una sesión** de ese usuario (tabla `sesiones`, `completa: true`) con vencimiento a
  **90 días**. Se guarda solo el hash, igual que las sesiones del panel.
- **Script** `npm run crear-token-mcp -w @ccvida/api [-- --dias 90]`: crea o reactiva el usuario,
  **borra sus sesiones anteriores** (rotar = revocar el viejo), crea la nueva y muestra el token
  **una sola vez**. Se corre en local o en la terminal del contenedor de la API en Coolify.
- **`SesionGuard` acepta `Authorization: Bearer <token>`** además de la cookie (`tokenDe`). Sin
  cambios de roles: las rutas de tesorería, visitas y usuarios siguen rechazando al rol editor.
- Lo que el MCP guarda queda con `actualizadoPorId` del usuario MCP, como cualquier cambio del panel.

### MCP (`apps/mcp`, nuevo workspace)

- TypeScript, `@modelcontextprotocol/sdk`, transporte **stdio**. Habla solo con la API por HTTP.
- **Configuración** por variables de entorno: `CCVIDA_API_URL` (por defecto
  `http://localhost:3000`) y `CCVIDA_MCP_TOKEN`; o `CCVIDA_MCP_ENV` con la ruta a un archivo
  `KEY=valor` (por defecto `C:\Users\frand\.secrets\ccvida-mcp.env`). El token nunca va al repo ni a
  `.mcp.json` del proyecto: se registra con `claude mcp add --scope user`.
- **Herramientas:**

| Herramienta | Qué hace |
|---|---|
| `listar_contenido` | `tipo`: ministerios / eventos / prédicas / series / fotos. Devuelve id, título, slug y estado. |
| `ver_contenido` | Un elemento completo por `tipo` + `id` o `slug`. |
| `crear_ministerio`, `crear_evento`, `crear_predica`, `crear_serie` | Crea **siempre en borrador** (ignora cualquier estado que se pase). Devuelve id, slug y link de vista previa. |
| `editar_ministerio`, `editar_evento`, `editar_predica`, `editar_serie` | Cambio parcial: lee el elemento, mezcla los campos y guarda. **Solo si está en borrador**; si está publicado responde "Está publicado: pasalo a borrador desde el panel para editarlo con el MCP". |
| `subir_foto` | `ruta` de un archivo local (JPG, PNG, WebP o AVIF), `textoAlternativo` (obligatorio), `credito` opcional. Devuelve el id para usar en `fotoId`. |
| `ver_textos` | Los textos de la web y el link de YouTube. |
| `editar_textos` | Cambio parcial de textos/YouTube **en dos pasos**: sin `confirmar` devuelve qué cambiaría (antes → después); con `confirmar: true` lo guarda. Aclara que sale en la web al guardar. |
| `link_vista_previa` | `tipo` + `slug` → URL de vista previa (usa `POST /api/admin/vista-previa`). |

- Los errores de la API (`{ mensaje, campos }`) se devuelven tal cual, para que Claude corrija y
  reintente.
- Las series se crean en borrador como el resto (su valor por defecto en la base es `publicado`, el
  MCP lo pisa).

## Pruebas

- API: e2e de `Authorization: Bearer` (token válido entra a contenido; el mismo token en
  tesorería/visitas/usuarios da 403; token vencido o de usuario dado de baja da 401) y del script
  (rota: el token anterior deja de servir).
- MCP: pruebas con vitest contra la API local para crear en borrador, negarse a editar publicados,
  mezcla parcial, `editar_textos` sin y con `confirmar`, y `subir_foto` con un archivo de prueba.
- Manual: registrar el MCP en Claude Code y cargar un ministerio con foto de punta a punta.

## Decisiones tomadas por Claude (revisables)

- El token es una sesión de 90 días de un usuario dedicado, no una tabla nueva de tokens.
- Sin herramientas de borrar ni publicar.
- Ruta del archivo de credenciales: `C:\Users\frand\.secrets\ccvida-mcp.env`.
- Nombre del usuario: `mcp@ccvidacapital.org` / "MCP (Claude)".
- La rama sale de `feat/vista-previa` porque el MCP usa la vista previa.
