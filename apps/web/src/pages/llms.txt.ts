import type { APIRoute } from 'astro';
import { contenido } from '../lib/contenido';
import { armarLlmsTxt } from '../lib/llms';

export const prerender = false;

/**
 * Resumen para motores de IA. Siempre con el contenido público (sin `locals`):
 * nunca muestra borradores, aunque llegue con permiso de vista previa.
 * En modo construcción el middleware lo reemplaza por la página de construcción.
 */
export const GET: APIRoute = async ({ site }) => {
  try {
    const texto = armarLlmsTxt(await contenido(), site!);
    // Corto, como el contenido: lo publicado en el panel se ve en menos de 1 minuto.
    return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=20' } });
  } catch {
    // Sin contenido: 503 y no un texto vacío, para que ningún bot guarde una versión vacía.
    return new Response('Servicio no disponible por un momento.\n', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '60' },
    });
  }
};
