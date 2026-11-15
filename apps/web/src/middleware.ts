import { defineMiddleware } from 'astro:middleware';
import { COOKIE_VISTA_PREVIA } from './lib/vista-previa';

// Con EN_CONSTRUCCION=true (variable de entorno del contenedor, se lee en cada
// pedido) todas las páginas muestran "en construcción". Se apaga sacando la
// variable y reiniciando el servicio, sin volver a construir la imagen.
const ARCHIVOS = /^\/(_astro|fonts|fotos)\/|^\/(favicon\.(svg|ico)|logo\.svg|robots\.txt)$/;
const PAGINA = '/en-construccion';

function enConstruccion(): boolean {
  const valor = globalThis.process?.env?.EN_CONSTRUCCION ?? import.meta.env.EN_CONSTRUCCION;
  return valor === 'true';
}

export const onRequest = defineMiddleware(async (context, next) => {
  const ruta = context.url.pathname;

  // La entrada y salida de la vista previa pasan siempre (aun en construcción).
  if (ruta === '/vista-previa') return next();

  // Con permiso de vista previa se ven los borradores, aunque el sitio esté en
  // construcción. Nada de esto se cachea ni se indexa.
  const permiso = context.cookies.get(COOKIE_VISTA_PREVIA)?.value;
  if (permiso) {
    context.locals.vistaPrevia = permiso;
    const respuesta = await next();
    respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
    respuesta.headers.set('Cache-Control', 'private, no-store');
    // Esa página ya salió con contenido público y sin aviso: la próxima entra sin cookie.
    if (context.locals.vistaPreviaVencida) context.cookies.delete(COOKIE_VISTA_PREVIA, { path: '/' });
    return respuesta;
  }

  if (!enConstruccion()) return ruta === PAGINA ? context.rewrite('/404') : next();
  if (ruta === PAGINA || ARCHIVOS.test(ruta)) return next();

  const respuesta = await context.rewrite(PAGINA);
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  respuesta.headers.set('Cache-Control', 'no-store');
  return respuesta;
});
