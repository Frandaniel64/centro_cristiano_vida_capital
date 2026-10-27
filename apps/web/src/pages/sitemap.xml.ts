import type { APIRoute } from 'astro';
import { contenido } from '../lib/contenido';

export const prerender = false;

const FIJAS = ['/', '/nosotros', '/ministerios', '/eventos', '/pro-templo', '/en-vivo', '/visitanos', '/privacidad'];

/** Sitemap con las páginas fijas y todo lo publicado en el panel. */
export const GET: APIRoute = async ({ site }) => {
  const { ministerios, eventos, predicas } = await contenido();
  const rutas = [
    ...FIJAS,
    ...ministerios.map((m) => `/ministerios/${m.slug}`),
    ...eventos.map((e) => `/eventos/${e.slug}`),
    ...predicas.map((p) => `/predicas/${p.slug}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${new URL(r, site).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
