import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import type { ErrorApi } from '@ccvida/shared';

/** Error de formulario con el formato que entiende la web: { mensaje, campos }. */
export class ErrorDeFormulario extends BadRequestException {
  constructor(campos: Record<string, string>, mensaje = 'Revisá los datos marcados.') {
    super({ mensaje, campos } satisfies ErrorApi);
  }
}

/** Un campo por error; los anidados con su ruta (`pastores.cita`, `comoLlegar.0.texto`). */
export function aplanar(errores: ValidationError[], prefijo = '', campos: Record<string, string> = {}): Record<string, string> {
  for (const e of errores) {
    const ruta = prefijo ? `${prefijo}.${e.property}` : e.property;
    const primero = e.constraints && Object.values(e.constraints)[0];
    if (primero) campos[ruta] = primero;
    if (e.children?.length) aplanar(e.children, ruta, campos);
  }
  return campos;
}

export const pipeDeValidacion = () =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errores) => new ErrorDeFormulario(aplanar(errores)),
  });
