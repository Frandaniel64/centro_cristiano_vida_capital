import type { ValidationError } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { aplanar } from './validacion.js';

describe('aplanar', () => {
  it('usa la ruta completa para los errores anidados', () => {
    const errores = [
      { property: 'lema', constraints: { maxLength: 'lema muy largo' }, children: [] },
      { property: 'pastores', children: [{ property: 'cita', constraints: { maxLength: 'cita muy larga' }, children: [] }] },
      {
        property: 'creemos',
        children: [{ property: '0', children: [{ property: 'texto', constraints: { isString: 'texto inválido' }, children: [] }] }],
      },
    ] as ValidationError[];
    expect(aplanar(errores)).toEqual({
      lema: 'lema muy largo',
      'pastores.cita': 'cita muy larga',
      'creemos.0.texto': 'texto inválido',
    });
  });
});
