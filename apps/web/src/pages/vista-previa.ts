import type { APIRoute } from 'astro';
import { COOKIE_VISTA_PREVIA, rutaInterna } from '../lib/vista-previa';

export const prerender = false;

// Mismo vencimiento que el permiso de la API (la API es la que valida de verdad).
const MAX_AGE_S = 60 * 60 * 8;

export const GET: APIRoute = ({ url, cookies, redirect }) => {
  if (url.searchParams.has('salir')) {
    cookies.delete(COOKIE_VISTA_PREVIA, { path: '/' });
    return redirect('/');
  }
  const permiso = url.searchParams.get('permiso');
  if (!permiso) return redirect('/');

  cookies.set(COOKIE_VISTA_PREVIA, permiso, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: MAX_AGE_S,
  });
  const ir = url.searchParams.get('ir');
  return redirect(rutaInterna(ir) ? ir : '/');
};
