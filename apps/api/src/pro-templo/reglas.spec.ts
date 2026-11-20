import { calcularEstado, estadoVisible, instruccionesDePago, instruccionesEnTexto, NOMBRE_ANONIMO, nombrePublico } from './reglas.js';

describe('calcularEstado', () => {
  const campana = { metaUsd: 10_000, mostrarMontos: true };

  it('suma confirmados y ajustes y calcula ladrillos y porcentaje', () => {
    const e = calcularEstado(campana, { confirmadoUsd: 3_000, ajustesUsd: 240, personas: 86, ultimos: [] });
    expect(e).toMatchObject({ recaudadoUsd: 3_240, metaUsd: 10_000, porcentaje: 32, ladrillos: 32, personas: 86 });
  });

  it('no pasa de 100 ladrillos ni de 100 % aunque se supere la meta', () => {
    const e = calcularEstado(campana, { confirmadoUsd: 12_500, ajustesUsd: 0, personas: 1, ultimos: [] });
    expect(e.recaudadoUsd).toBe(12_500);
    expect(e.ladrillos).toBe(100);
    expect(e.porcentaje).toBe(100);
  });

  it('un ajuste negativo no deja el total por debajo de cero', () => {
    const e = calcularEstado(campana, { confirmadoUsd: 100, ajustesUsd: -500, personas: 1, ultimos: [] });
    expect(e.recaudadoUsd).toBe(0);
  });

  it('el valor del ladrillo sale de la meta', () => {
    const e = calcularEstado({ metaUsd: 5_000, mostrarMontos: true }, { confirmadoUsd: 120, ajustesUsd: 0, personas: 1, ultimos: [] });
    expect(e.ladrillos).toBe(2);
  });

  it('oculta los montos de los últimos vouchers si la campaña lo pide', () => {
    const ultimos = [{ nombre: 'Lucía', montoUsd: 20 }];
    expect(calcularEstado({ ...campana, mostrarMontos: false }, { confirmadoUsd: 20, ajustesUsd: 0, personas: 1, ultimos }).ultimosVouchers).toEqual([
      { nombre: 'Lucía', montoUsd: null },
    ]);
  });
});

describe('nombrePublico', () => {
  const base = { nombre: 'Ana Pérez', apodo: 'Familia Pérez', apodoAprobado: true };

  it('muestra el nombre real solo si lo eligió', () => {
    expect(nombrePublico({ ...base, mostrarComo: 'nombre' })).toBe('Ana Pérez');
  });

  it('anónimo nunca muestra el nombre real', () => {
    expect(nombrePublico({ ...base, mostrarComo: 'anonimo' })).toBe(NOMBRE_ANONIMO);
  });

  it('el apodo se muestra recién cuando está aprobado', () => {
    expect(nombrePublico({ ...base, mostrarComo: 'apodo' })).toBe('Familia Pérez');
    expect(nombrePublico({ ...base, mostrarComo: 'apodo', apodoAprobado: false })).toBe(NOMBRE_ANONIMO);
  });
});

describe('instruccionesDePago', () => {
  it('efectivo indica la mesa Pro Templo con el número', () => {
    expect(instruccionesDePago('efectivo', 348, '')).toEqual({
      texto: 'Acércate a la mesa Pro Templo el domingo después de la reunión y di tu número: Nº 0348.',
    });
  });

  it('transferencia con datos pide responder el email con el comprobante y aparta los datos', () => {
    expect(instruccionesDePago('transferencia', 1, '  CBU 123\nAlias X  ')).toEqual({
      texto: 'Transfiere a esta cuenta y responde el email que te mandamos con la foto del comprobante (Nº 0001):',
      datos: 'CBU 123\nAlias X',
    });
  });

  it('transferencia sin datos cargados: tesorería los pasa por email', () => {
    expect(instruccionesDePago('transferencia', 1, '  ')).toEqual({
      texto: 'Responde el email que te mandamos y tesorería te pasa los datos para transferir (Nº 0001).',
    });
  });

  it('en el email se habla de "este email", no del que te mandamos', () => {
    expect(instruccionesDePago('transferencia', 1, 'CBU 123', 'email')).toEqual({
      texto: 'Transfiere a esta cuenta y responde este email con la foto del comprobante (Nº 0001):',
      datos: 'CBU 123',
    });
    expect(instruccionesDePago('transferencia', 1, '', 'email')).toEqual({
      texto: 'Responde este email y tesorería te pasa los datos para transferir (Nº 0001).',
    });
    expect(instruccionesDePago('efectivo', 1, '', 'email')).toEqual(instruccionesDePago('efectivo', 1, ''));
  });

  it('Mercado Pago avisa que el link llega por email', () => {
    expect(instruccionesDePago('mercadopago', 7, '')).toEqual({ texto: 'Te mandamos el link de pago por email. Tu número es Nº 0007.' });
  });

  it('ninguna instrucción menciona WhatsApp', () => {
    for (const forma of ['efectivo', 'transferencia', 'mercadopago'] as const) {
      for (const datos of ['', 'CBU 123']) {
        for (const canal of ['web', 'email'] as const) {
          expect(instruccionesEnTexto(instruccionesDePago(forma, 1, datos, canal))).not.toMatch(/whatsapp/i);
        }
      }
    }
  });

  it('en texto plano los datos van en las líneas siguientes', () => {
    expect(instruccionesEnTexto(instruccionesDePago('transferencia', 1, 'CBU 123'))).toBe(
      'Transfiere a esta cuenta y responde el email que te mandamos con la foto del comprobante (Nº 0001):\nCBU 123',
    );
    expect(instruccionesEnTexto(instruccionesDePago('efectivo', 1, ''))).toBe(
      'Acércate a la mesa Pro Templo el domingo después de la reunión y di tu número: Nº 0001.',
    );
  });
});

describe('estadoVisible', () => {
  const ahora = new Date('2026-11-30T12:00:00Z');

  it('un pendiente viejo se informa como vencido', () => {
    expect(estadoVisible({ estado: 'pendiente', creado: new Date('2026-10-01T12:00:00Z') }, 30, ahora)).toBe('vencido');
  });

  it('un pendiente reciente sigue pendiente', () => {
    expect(estadoVisible({ estado: 'pendiente', creado: new Date('2026-11-20T12:00:00Z') }, 30, ahora)).toBe('pendiente');
  });

  it('al reactivarlo, el plazo cuenta desde la reactivación', () => {
    const v = { estado: 'pendiente' as const, creado: new Date('2026-09-01T12:00:00Z'), reactivadoEn: new Date('2026-11-25T12:00:00Z') };
    expect(estadoVisible(v, 30, ahora)).toBe('pendiente');
  });

  it('confirmado no vence nunca', () => {
    expect(estadoVisible({ estado: 'confirmado', creado: new Date('2026-01-01T12:00:00Z') }, 30, ahora)).toBe('confirmado');
  });
});
