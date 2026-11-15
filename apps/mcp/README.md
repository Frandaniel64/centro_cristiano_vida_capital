# @ccvida/mcp

Servidor MCP (stdio) para cargar contenido del sitio desde Claude. Habla con la API del panel usando un
token de larga duración (`Authorization: Bearer`).

## Instalación

Ver "MCP de contenido" en el [README raíz](../../README.md). Resumen:

```bash
npm run crear-token-mcp -w @ccvida/api          # guardar el token en C:\Users\frand\.secrets\ccvida-mcp.env
npm run build -w @ccvida/mcp
claude mcp add --scope user ccvida-contenido -- node <ruta absoluta>/apps/mcp/dist/index.js
```

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
| `listar_contenido` | Lista ministerios, eventos, prédicas, series o fotos |
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
