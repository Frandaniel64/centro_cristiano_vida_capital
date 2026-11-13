import { defineMiddleware } from 'astro:middleware';

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
  if (!enConstruccion()) return ruta === PAGINA ? context.rewrite('/404') : next();
  if (ruta === PAGINA || ARCHIVOS.test(ruta)) return next();

  const respuesta = await context.rewrite(PAGINA);
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  respuesta.headers.set('Cache-Control', 'no-store');
  return respuesta;
});
