// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://ccvida.com.ar',
  // Por ahora todo se genera al compilar; las páginas pasan a SSR cuando lean de la API.
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [sitemap({ filter: (pagina) => !pagina.endsWith('.ics') })],

  vite: {
    plugins: [tailwindcss()],
  },
});
