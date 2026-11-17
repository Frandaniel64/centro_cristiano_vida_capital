import { describe, expect, it, vi } from 'vitest';
import { EmailService, escapar } from '../email.service.js';
import { instruccionesDePago } from '../../pro-templo/reglas.js';
import {
  avisoRecepcion,
  avisoTesoreria,
  bienvenidaVisita,
  ladrilloConfirmado,
  urlMapa,
  voucherRegistrado,
} from './plantillas.js';

const sitioUrl = 'https://ccvidacapital.org';
const panelUrl = 'https://panel.ccvidacapital.org';
const malo = '<script>x</script>';

const visita = (nombre = 'Lucía Pérez') =>
  bienvenidaVisita({
    nombre,
    reunion: 'Domingo 10 h',
    direccion: 'Camarones 2201',
    barrio: 'Floresta',
    mapaUrl: '',
    versiculo: { texto: 'Vengan a mí todos ustedes.', cita: 'Mateo 11:28' },
    sitioUrl,
  });
const voucher = (extra: Partial<Parameters<typeof voucherRegistrado>[0]> = {}) =>
  voucherRegistrado({
    nombre: 'Lucía Pérez',
    numero: 348,
    montoUsd: 150,
    formaPago: 'efectivo',
    datosTransferencia: '',
    sitioUrl,
    ...extra,
  });
const tesoreria = (nombre = 'Lucía Pérez', whatsapp: string | null = null) =>
  avisoTesoreria({ nombre, numero: 348, montoUsd: 150, formaPago: 'transferencia', email: 'l@x.com', whatsapp, panelUrl, sitioUrl });
const recepcion = (nombre = 'Lucía Pérez', whatsapp: string | null = null) =>
  avisoRecepcion({ nombre, email: 'l@x.com', whatsapp, intereses: ['Vida Kids'], panelUrl, sitioUrl });
const ladrillo = (nombre = 'Lucía Pérez') => ladrilloConfirmado({ nombre, numero: 348, sitioUrl });

describe('plantillas de email', () => {
  it('incluyen sus datos y los asuntos pedidos', () => {
    expect(visita().asunto).toBe('¡Te esperamos, Lucía!');
    expect(visita().html).toContain('Camarones 2201');
    expect(visita().html).toContain('Mateo 11:28');
    expect(voucher().asunto).toBe('Tu voucher Pro Templo Nº 0348');
    expect(voucher().html).toContain('0348');
    expect(voucher().html).toContain('USD 150');
    expect(tesoreria().html).toContain('0348');
    expect(tesoreria().html).toContain('USD 150');
    expect(tesoreria().html).toContain(`${panelUrl}/vouchers`);
    expect(recepcion().html).toContain('Vida Kids');
    expect(recepcion().html).toContain(`${panelUrl}/visitas`);
    expect(ladrillo().asunto).toBe('¡Tu ladrillo ya está en la pared!');
    expect(ladrillo().html).toContain('0348');
    expect(ladrillo().html).toContain(`${sitioUrl}/pro-templo`);
  });

  it('escapan lo que escribió la persona en las 5', () => {
    for (const { html } of [visita(malo), voucher({ nombre: malo }), tesoreria(malo), recepcion(malo), ladrillo(malo)]) {
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    }
  });

  it('solo los avisos internos nombran WhatsApp, y solo con el número de la persona', () => {
    for (const { html } of [visita(), voucher(), voucher({ formaPago: 'transferencia' }), voucher({ formaPago: 'mercadopago' }), ladrillo()]) {
      expect(html).not.toContain('WhatsApp');
    }
    expect(tesoreria().html).not.toContain('WhatsApp');
    expect(recepcion().html).not.toContain('WhatsApp');
    expect(tesoreria('A', '1155551234').html).toContain('WhatsApp');
    expect(recepcion('A', '1155551234').html).toContain('1155551234');
  });

  it('transferencia sin datos no deja bloque vacío y avisa que tesorería pasa los datos', () => {
    const { html } = voucher({ formaPago: 'transferencia', datosTransferencia: '' });
    expect(html).toContain('Respondé el email que te mandamos y tesorería te pasa los datos para transferir (Nº 0348).');
    expect(html).not.toContain('<pre');
  });

  it('transferencia con datos los muestra línea por línea, escapados y sin pre-line', () => {
    const { html } = voucher({ formaPago: 'transferencia', datosTransferencia: 'CBU 123\nAlias <CCVIDA>' });
    expect(html).toContain('CBU 123<br>Alias &lt;CCVIDA&gt;');
    expect(html).not.toContain('pre-line');
    expect(html).toContain('respondé el email que te mandamos con la foto del comprobante');
    expect(html).toContain('Tu ladrillo aparece en la pared cuando tesorería confirma el pago.');
  });

  it('las instrucciones del email salen de la misma fuente que las de la web', () => {
    for (const formaPago of ['efectivo', 'transferencia', 'mercadopago'] as const) {
      for (const datosTransferencia of ['', 'CBU 123\nAlias X']) {
        const { texto, datos } = instruccionesDePago(formaPago, 348, datosTransferencia);
        const { html } = voucher({ formaPago, datosTransferencia });
        expect(html).toContain(escapar(texto));
        if (datos) expect(html).toContain(datos.split('\n').map(escapar).join('<br>'));
      }
    }
  });

  it('urlMapa arma el link o respeta el cargado', () => {
    const busqueda = 'https://www.google.com/maps/search/?api=1&query=Camarones%202201%2C%20CABA';
    expect(urlMapa('Camarones 2201', '')).toBe(busqueda);
    expect(urlMapa('Camarones 2201', 'https://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc');
    expect(urlMapa('Camarones 2201', 'HTTP://maps.example/x')).toBe('HTTP://maps.example/x');
  });

  it('urlMapa ignora links que no son http(s)', () => {
    expect(urlMapa('x', 'javascript:alert(1)')).toBe('https://www.google.com/maps/search/?api=1&query=x%2C%20CABA');
    expect(urlMapa('x', 'maps.app.goo.gl/abc')).toBe('https://www.google.com/maps/search/?api=1&query=x%2C%20CABA');
  });

  it('los avisos internos usan el sitioUrl que reciben para el logo', () => {
    const otro = 'https://otro.example';
    expect(avisoTesoreria({ nombre: 'A', numero: 1, montoUsd: 1, formaPago: 'efectivo', email: 'a@x.com', whatsapp: null, panelUrl, sitioUrl: otro }).html).toContain(`${otro}/logo-email.png`);
    expect(avisoRecepcion({ nombre: 'A', email: 'a@x.com', whatsapp: null, intereses: [], panelUrl, sitioUrl: otro }).html).toContain(`${otro}/logo-email.png`);
  });

  it('tienen el estilo de la marca', () => {
    for (const { html } of [visita(), voucher(), tesoreria(), recepcion(), ladrillo()]) {
      expect(html).toContain('logo-email.png');
      expect(html).toContain('#a0d062');
      expect(html).not.toContain('border-left');
      // Clientes que ignoran el CSS (Outlook) igual pintan la tarjeta negra y el botón verde.
      expect(html).toContain('bgcolor="#000000"');
      expect(html).toContain('bgcolor="#a0d062"');
    }
  });
});

describe('EmailService.enviar', () => {
  const armar = () => {
    const send = vi.fn().mockResolvedValue({ error: null });
    const svc = new EmailService();
    (svc as unknown as { resend: unknown }).resend = { emails: { send } };
    return { svc, send };
  };

  it('parte las listas por coma', async () => {
    const { svc, send } = armar();
    await svc.enviar('a@x.com, b@x.com', 'Hola', '<p>x</p>', { responderA: 't@x.com , u@x.com' });
    expect(send.mock.calls[0][0].to).toEqual(['a@x.com', 'b@x.com']);
    expect(send.mock.calls[0][0].replyTo).toEqual(['t@x.com', 'u@x.com']);
  });

  it('sin responderA no manda replyTo', async () => {
    const { svc, send } = armar();
    await svc.enviar('a@x.com', 'Hola', '<p>x</p>', { responderA: '' });
    expect(send.mock.calls[0][0]).not.toHaveProperty('replyTo');
    await svc.enviar('a@x.com', 'Hola', '<p>x</p>');
    expect(send.mock.calls[1][0]).not.toHaveProperty('replyTo');
  });

  it('sin destinatarios no llama a Resend', async () => {
    const { svc, send } = armar();
    await svc.enviar(' , ', 'Hola', '<p>x</p>');
    expect(send).not.toHaveBeenCalled();
  });
});
