import { describe, expect, it } from 'vitest';
import { variablesFaltantes } from './usuarios.controller.js';

const completa = {
  emailRecepcion: 'recepcion@x.com',
  emailTesoreria: 'tesoreria@x.com',
  panelUrl: 'https://panel.ccvidacapital.org',
  sitioUrl: 'https://ccvidacapital.org',
};

describe('variablesFaltantes', () => {
  it('no marca nada con todo cargado', () => {
    expect(variablesFaltantes(completa)).toEqual([]);
  });

  it('marca destinatarios vacíos y URLs que quedaron en localhost', () => {
    expect(
      variablesFaltantes({ emailRecepcion: ' ', emailTesoreria: '', panelUrl: 'http://localhost:4200', sitioUrl: 'http://localhost:4321' }),
    ).toEqual(['RECEPCION_EMAIL', 'TESORERIA_EMAIL', 'PANEL_URL', 'SITE_URL']);
  });
});
