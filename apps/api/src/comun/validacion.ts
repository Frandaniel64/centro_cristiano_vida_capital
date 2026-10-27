import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import type { ErrorApi } from '@ccvida/shared';

/** Error de formulario con el formato que entiende la web: { mensaje, campos }. */
export class ErrorDeFormulario extends BadRequestException {
  constructor(campos: Record<string, string>, mensaje = 'Revisá los datos marcados.') {
    super({ mensaje, campos } satisfies ErrorApi);
  }
}

function aplanar(errores: ValidationError[]): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const e of errores) {
    const primero = e.constraints && Object.values(e.constraints)[0];
    if (primero) campos[e.property] = primero;
  }
  return campos;
}

export const pipeDeValidacion = () =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errores) => new ErrorDeFormulario(aplanar(errores)),
  });
