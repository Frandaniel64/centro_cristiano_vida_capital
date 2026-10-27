import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { pipeDeValidacion } from './comun/validacion.js';
import { config } from './config.js';
import { CARPETA_LOCAL } from './medios/almacen.js';

/** Configuración común a la app real y a los tests e2e. */
export function configurarApp(app: NestExpressApplication) {
  // Detrás del proxy de Coolify: confiar en X-Forwarded-For para la IP real.
  app.set('trust proxy', 1);
  app.use(cookieParser());
  // Sin R2 (desarrollo), las fotos subidas se sirven desde disco.
  if (!config.r2.cuenta) app.useStaticAssets(CARPETA_LOCAL, { prefix: '/medios/', maxAge: '1y', immutable: true });
  app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });
  // credentials: el panel manda la cookie de sesión desde su propio origen.
  app.enableCors({ origin: config.origenes, methods: ['GET', 'POST', 'PATCH', 'DELETE'], credentials: true });
  app.useGlobalPipes(pipeDeValidacion());
  return app;
}
