import { calcularEstado, estadoVisible, instruccionesDePago, NOMBRE_ANONIMO, nombrePublico } from './reglas.js';

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
    expect(instruccionesDePago('efectivo', 348, '')).toContain('Nº 0348');
  });

  it('transferencia usa los datos bancarios de la configuración', () => {
    expect(instruccionesDePago('transferencia', 1, 'CBU 123')).toContain('CBU 123');
  });

  it('sin datos bancarios cargados avisa que se mandan por WhatsApp', () => {
    expect(instruccionesDePago('transferencia', 1, '')).toContain('WhatsApp');
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
