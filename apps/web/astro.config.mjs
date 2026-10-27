// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://ccvida.com.ar',
  // Las páginas se arman en cada pedido con el contenido de la API (lib/contenido.ts).
  // Las fotos ya llegan optimizadas: las del panel desde la API y las de diseño
  // desde public/fotos (scripts/optimizar-fotos.mjs).
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),

  vite: {
    plugins: [tailwindcss()],
  },
});
