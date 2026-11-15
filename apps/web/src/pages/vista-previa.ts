import type { APIRoute } from 'astro';
import { COOKIE_VISTA_PREVIA, rutaInterna } from '../lib/vista-previa';

export const prerender = false;

// Misma hora de vigencia que el permiso de la API (la API es la que valida de verdad).
const MAX_AGE_S = 60 * 60;

// Las respuestas llevan Set-Cookie: nunca se cachean.
const ir = (destino: string) =>
  new Response(null, { status: 302, headers: { Location: destino, 'Cache-Control': 'no-store' } });

export const GET: APIRoute = ({ url, cookies }) => {
  if (url.searchParams.has('salir')) {
    cookies.delete(COOKIE_VISTA_PREVIA, { path: '/' });
    return ir('/');
  }
  const permiso = url.searchParams.get('permiso');
  if (!permiso) return ir('/');

  cookies.set(COOKIE_VISTA_PREVIA, permiso, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: MAX_AGE_S,
  });
  const destino = url.searchParams.get('ir');
  return ir(rutaInterna(destino) ? destino : '/');
};
