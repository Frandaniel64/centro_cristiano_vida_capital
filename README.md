# CCVida Capital

Sitio web y panel de administración de Centro Cristiano Vida Capital.

## Estructura

| Carpeta | Qué es | Stack |
|---|---|---|
| `apps/api` | API | NestJS + TypeScript |
| `apps/web` | Sitio público | Astro (SSR) + Tailwind, desplegado en Cloudflare |
| `apps/admin` | Panel `/admin` | Angular (SPA) |
| `packages/shared` | Tipos compartidos | TypeScript |

## Desarrollo

Requiere Node 24 o superior.

```bash
npm install
cp apps/api/.env.example apps/api/.env

npm run dev:api     # http://localhost:3000
npm run dev:web     # http://localhost:4321
npm run dev:admin   # http://localhost:4200
npm run build       # compila todo
```

## Despliegue

| Pieza | Dónde |
|---|---|
| API | Coolify, con `apps/api/Dockerfile` (contexto: raíz del repo) |
| Base de datos | PostgreSQL en Coolify, con backup diario a R2 |
| Sitio público | Cloudflare Workers (`apps/web/wrangler.jsonc`) |
| Panel | Cloudflare Pages (salida de `apps/admin/dist/admin/browser`) |
| Archivos | Cloudflare R2 |
| Emails | Resend |

### API en Coolify

- Build pack: **Dockerfile**, ubicación `apps/api/Dockerfile`, contexto `/`.
- Puerto: `3000`. Healthcheck: `GET /health`.
- Variables: las de `apps/api/.env.example`.
- No publicar cambios el domingo de 9 a 13 h.

Para construir la imagen en local:

```bash
docker build -f apps/api/Dockerfile -t ccvida-api .
```

### Migrar la base a otro servidor

```bash
pg_dump -Fc -h <host-viejo> -U <usuario> <base> > ccvida.dump
pg_restore -h <host-nuevo> -U <usuario> -d <base> --no-owner ccvida.dump
```

Antes de cambiar `DATABASE_URL` de la API, verificar que coincidan la cantidad de vouchers, el total recaudado y el último número correlativo.
