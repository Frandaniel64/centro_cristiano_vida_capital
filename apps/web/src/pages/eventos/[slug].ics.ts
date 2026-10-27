import type { APIRoute } from 'astro';
import { contenido } from '../../lib/contenido';
import { ics } from '../../lib/eventos';

export const prerender = false;

export const GET: APIRoute = async ({ params, site }) => {
  const { eventos } = await contenido();
  const evento = eventos.find((e) => e.slug === params.slug);
  if (!evento) return new Response('No existe ese evento.', { status: 404 });
  const url = new URL(`/eventos/${evento.slug}`, site).href;
  return new Response(ics(evento, url), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="${evento.slug}.ics"` },
  });
};
