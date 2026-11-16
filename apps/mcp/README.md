# @ccvida/mcp

Servidor MCP (stdio) para cargar contenido del sitio desde Claude. Habla con la API del panel usando un
token de larga duración (`Authorization: Bearer`).

## Instalación

Ver "MCP de contenido" en el [README raíz](../../README.md). Resumen:

```bash
npm run crear-token-mcp -w @ccvida/api          # guardar el token en C:\Users\frand\.secrets\ccvida-mcp.env
npm run build -w @ccvida/mcp
claude mcp add --scope user ccvida-contenido -- node <ruta absoluta>/apps/mcp/dist/index.js
# por ejemplo, en Windows:
claude mcp add --scope user ccvida-contenido -- node C:/repos_franyer/centro_cristiano_vida_capital/apps/mcp/dist/index.js
```

Contra producción el token se crea en la terminal del contenedor de la API con
`npm run crear-token-mcp:prod -w @ccvida/api` (ver "API en Coolify" en el README raíz).

## Seguridad del token

- El token es una credencial de **editor**: fuera del MCP, usado directo contra la API, podría publicar o
  borrar contenido. Las herramientas del MCP son la barrera (todo queda en borrador, no hay borrar ni
  publicar). Guardalo solo en `C:\Users\frand\.secrets`, nunca en el repo, y si se filtra generá uno
  nuevo (crear otro anula el anterior).
- Correr las pruebas e2e de la API (`npm run test:e2e -w @ccvida/api`) borra el usuario del MCP de la base
  local, así que el token local deja de andar: después generá uno nuevo.

## Configuración

| Variable | Qué es |
|---|---|
| `CCVIDA_API_URL` | URL de la API (por defecto `http://localhost:3000`) |
| `CCVIDA_MCP_TOKEN` | Token del MCP |
| `CCVIDA_MCP_ENV` | Ruta a un archivo `KEY=valor` (por defecto `C:\Users\frand\.secrets\ccvida-mcp.env`) |

Las variables de entorno pisan al archivo. Sin token el servidor arranca igual y cada herramienta
responde con un error claro. El token nunca va al repo.

## Herramientas

| Herramienta | Qué hace |
|---|---|
| `listar_contenido` | Lista ministerios, eventos, prédicas, series o fotos (de las fotos, las 40 más recientes) |
| `ver_contenido` | Todos los campos de un elemento, por id o slug |
| `crear_ministerio` / `crear_evento` / `crear_predica` / `crear_serie` | Crea un borrador (obligatorios: ministerio `nombre` y `orden`; evento `titulo` e `inicio`; prédica `titulo`, `fecha`, `predicador`; serie `nombre`) |
| `editar_ministerio` / `editar_evento` / `editar_predica` / `editar_serie` | Edita solo los campos que se pasan; solo si está en borrador |
| `subir_foto` | Sube una foto del disco (JPG, PNG, WebP, AVIF, hasta 15 MB) y devuelve el `fotoId` |
| `ver_textos` | Textos editables del sitio |
| `editar_textos` | Sin `confirmar: true` solo muestra antes y después; con él, guarda y sale en la web enseguida |
| `link_vista_previa` | Link de vista previa de 1 hora (ministerios, eventos, prédicas) |

Los campos que no existen se rechazan con un error en vez de ignorarse. No hay herramientas para
borrar ni publicar, ni acceso a tesorería, visitas o usuarios.

## Desarrollo

```bash
npm test -w @ccvida/mcp
npm run build -w @ccvida/mcp
```

Stdout es el protocolo: los logs van a stderr.
