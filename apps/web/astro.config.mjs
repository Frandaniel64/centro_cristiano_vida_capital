// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// ASTRO_ADAPTER=node: servidor Node propio (contenedor en Coolify, ver Dockerfile).
// Sin la variable: Cloudflare Workers (la demo publicada).
const adapter =
  process.env.ASTRO_ADAPTER === 'node' ? node({ mode: 'standalone' }) : cloudflare({ imageService: 'passthrough' });

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://ccvida.com.ar',
  // Las páginas se arman en cada pedido con el contenido de la API (lib/contenido.ts).
  // Las fotos ya llegan optimizadas: las del panel desde la API y las de diseño
  // desde public/fotos (scripts/optimizar-fotos.mjs).
  output: 'server',
  adapter,

  vite: {
    plugins: [tailwindcss()],
  },
});
