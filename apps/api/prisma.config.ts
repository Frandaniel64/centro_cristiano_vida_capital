import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` no se conecta a la base: sin DATABASE_URL (por ejemplo en
    // el build de Cloudflare o de Docker) alcanza con una URL de relleno. Las
    // migraciones y la API sí necesitan la variable real y fallan sin ella.
    url: process.env.DATABASE_URL ?? 'postgresql://sin-configurar@localhost:5432/sin-configurar',
  },
});
