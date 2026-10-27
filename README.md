# CCVida Capital

Sitio web y panel de administración de Centro Cristiano Vida Capital.

## Estructura

| Carpeta | Qué es | Stack |
|---|---|---|
| `apps/api` | API | NestJS + Prisma 7 + PostgreSQL |
| `apps/web` | Sitio público | Astro (SSR) + Tailwind, desplegado en Cloudflare |
| `apps/admin` | Panel `/admin` | Angular (SPA) |
| `packages/shared` | Tipos compartidos | TypeScript |

## Desarrollo

Requiere Node 24 o superior.

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d                       # Postgres de desarrollo en el puerto 5434
npm run db:migrate -w @ccvida/api          # aplica las migraciones
npm run db:seed -w @ccvida/api             # campaña Pro Templo y configuración

npm run dev:api     # http://localhost:3000
npm run dev:web     # http://localhost:4321
npm run dev:admin   # http://localhost:4200
npm run build       # compila todo
```

## API pública

| Método y ruta | Qué hace |
|---|---|
| `POST /api/vouchers` | Crea un voucher pendiente, manda el email y devuelve número e instrucciones. Máximo 5 por hora por conexión |
| `GET /api/vouchers/:numero` | Estado público del voucher, sin datos personales |
| `GET /api/pro-templo/estado` | Datos del contador (caché de 10 s). Solo suman vouchers confirmados y ajustes |
| `POST /api/visitas` | Guarda la solicitud de primera visita y avisa a recepción. Máximo 5 por hora por conexión |
| `GET /api/en-vivo` | Si hay transmisión en curso (por horario) y el link del canal |

Tests: `npm test -w @ccvida/api` (reglas) y `npm run test:e2e -w @ccvida/api` (contra la base de desarrollo).

## Panel de administración

Angular + Angular Material. Roles: administración, edición, tesorería y recepción.
Administración y tesorería usan verificación en dos pasos (app de autenticación).

Primera cuenta de administración (imprime una clave temporal que hay que cambiar al entrar):

```bash
npm run crear-admin -w @ccvida/api -- email@iglesia.org "Nombre Apellido"
```

El panel lee la URL de la API al compilar:

```bash
npm run build -w @ccvida/admin -- --define "API_URL='https://api.ccvida.com.ar'"
```

En la API, `CORS_ORIGINS` tiene que incluir la URL del panel y las variables `COOKIE_*`
dependen de si panel y API comparten dominio (ver `apps/api/.env.example`).

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
- Puerto: `3000`. Healthcheck: `GET /health` (no consulta la base).
- Monitor de caídas: `GET /health/ready` (responde 503 si la base no responde).
- Al arrancar, el contenedor corre `prisma migrate deploy`; si la base no está disponible, la API no levanta.
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
