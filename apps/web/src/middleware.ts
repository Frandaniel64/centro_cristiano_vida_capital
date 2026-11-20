import type { APIContext } from 'astro';
import type { MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { cargarVistaPrevia } from './lib/contenido';
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

async function enPaginaDeConstruccion(context: APIContext): Promise<Response> {
  const respuesta = await context.rewrite(PAGINA);
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  respuesta.headers.set('Cache-Control', 'no-store');
  return respuesta;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const ruta = context.url.pathname;

  // La entrada y salida de la vista previa pasan siempre (aun en construcción).
  if (ruta === '/vista-previa') return next();

  // Con permiso de vista previa se ven los borradores, aunque el sitio esté en
  // construcción. El permiso se valida aquí, antes de armar la página: Astro
  // transmite la respuesta y después ya no se puede cambiar de página.
  const permiso = context.cookies.get(COOKIE_VISTA_PREVIA)?.value;
  if (permiso && !ARCHIVOS.test(ruta)) {
    const vista = await cargarVistaPrevia(permiso);
    if (vista.estado === 'ok') {
      context.locals.vistaPrevia = permiso;
      context.locals.contenidoVistaPrevia = vista.datos;
      return sinCache(await next());
    }
    // Permiso inválido o vencido: la próxima entra sin cookie. Si la API no
    // respondió, la cookie queda (el permiso puede seguir sirviendo).
    if (vista.estado === 'rechazado') context.cookies.delete(COOKIE_VISTA_PREVIA, { path: '/' });
    // Sigue como cualquier visitante, sin cachear (la respuesta es de alguien con cookie).
    return sinCache(await sitioPublico(context, next));
  }

  return sitioPublico(context, next);
});

function sitioPublico(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const ruta = context.url.pathname;
  if (!enConstruccion()) return ruta === PAGINA ? context.rewrite('/404') : next();
  if (ruta === PAGINA || ARCHIVOS.test(ruta)) return next();
  return enPaginaDeConstruccion(context);
}

function sinCache(respuesta: Response): Response {
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  respuesta.headers.set('Cache-Control', 'private, no-store');
  return respuesta;
}
