// Recorre los criterios de aceptación de Pro Templo y visitas contra la base
// de desarrollo (docker compose up -d && npm run db:migrate && npm run db:seed).
import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { EmailService } from '../src/comun/email.service.js';
import { config } from '../src/config.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ProTemploService } from '../src/pro-templo/pro-templo.service.js';

const voucherValido = {
  montoUsd: 150,
  nombre: 'Ana Prueba E2E',
  mostrarComo: 'anonimo',
  email: 'ana@example.com',
  formaPago: 'efectivo',
  aceptaPrivacidad: true,
};

describe('API pública (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const vouchers: string[] = [];
  const visitas: string[] = [];
  // Cada prueba usa su propia IP para no chocar con el límite de 5 por hora.
  let ip = 0;
  const desde = () => `10.0.0.${++ip}`;

  // Los emails se espían: ninguno sale de verdad.
  let enviar: ReturnType<typeof vi.spyOn<EmailService, 'enviar'>>;
  const emailsOriginales = { tesoreria: config.emailTesoreria, recepcion: config.emailRecepcion };
  const asuntos = () => enviar.mock.calls.map((c) => c[1]);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(modulo.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
    enviar = vi.spyOn(app.get(EmailService), 'enviar').mockResolvedValue(undefined);
  });

  beforeEach(() => {
    enviar.mockClear();
    config.emailTesoreria = 'teso@example.com, teso2@example.com';
    config.emailRecepcion = 'recepcion@example.com';
  });

  afterAll(async () => {
    config.emailTesoreria = emailsOriginales.tesoreria;
    config.emailRecepcion = emailsOriginales.recepcion;
    await prisma.voucher.deleteMany({ where: { id: { in: vouchers } } });
    await prisma.visita.deleteMany({ where: { id: { in: visitas } } });
    app.get(ProTemploService).invalidarEstado();
    await app.close();
  });

  const crearVoucher = async (cuerpo: object, ipOrigen = desde()) => {
    const res = await request(app.getHttpServer()).post('/api/vouchers').set('X-Forwarded-For', ipOrigen).send(cuerpo);
    if (res.status === 201) {
      const v = await prisma.voucher.findUniqueOrThrow({ where: { numero: res.body.numero } });
      vouchers.push(v.id);
    }
    return res;
  };

  it('un voucher nuevo queda pendiente y no suma al contador', async () => {
    const antes = (await request(app.getHttpServer()).get('/api/pro-templo/estado')).body;
    const res = await crearVoucher(voucherValido);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ montoUsd: 150, estado: 'pendiente', formaPago: 'efectivo' });
    expect(res.body.instrucciones).toContain('mesa Pro Templo');

    app.get(ProTemploService).invalidarEstado();
    const despues = (await request(app.getHttpServer()).get('/api/pro-templo/estado')).body;
    expect(despues.recaudadoUsd).toBe(antes.recaudadoUsd);
  });

  it('al confirmarlo suma al contador y aparece anónimo', async () => {
    const res = await crearVoucher(voucherValido);
    await prisma.voucher.update({ where: { numero: res.body.numero }, data: { estado: 'confirmado', confirmadoEn: new Date() } });
    const servicio = app.get(ProTemploService);
    servicio.invalidarEstado();
    const antes = await servicio.estado();

    expect(antes.ultimosVouchers[0]).toEqual({ nombre: 'Alguien de la familia', montoUsd: 150 });
    expect(antes.ultimosVouchers.some((u) => u.nombre.includes('Ana'))).toBe(false);
  });

  it('el estado público de un voucher no muestra datos personales', async () => {
    const creado = await crearVoucher(voucherValido);
    const res = await request(app.getHttpServer()).get(`/api/vouchers/${creado.body.numero}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ numero: creado.body.numero, estado: 'pendiente', montoUsd: 150 });
    expect(JSON.stringify(res.body)).not.toMatch(/Ana|example\.com/);
  });

  it('un voucher inexistente responde 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/vouchers/999999');
    expect(res.status).toBe(404);
  });

  it('los errores de validación vienen por campo y en castellano', async () => {
    const res = await crearVoucher({ ...voucherValido, montoUsd: 0, email: 'ana@', aceptaPrivacidad: false });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe('Revisá los datos marcados.');
    expect(Object.keys(res.body.campos).sort()).toEqual(['aceptaPrivacidad', 'email', 'montoUsd']);
    expect(res.body.campos.email).toContain('email');
  });

  it('el voucher sin email responde 400 en el campo email', async () => {
    const { email: _sin, ...sinEmail } = voucherValido;
    const res = await crearVoucher(sinEmail);
    expect(res.status).toBe(400);
    expect(res.body.campos.email).toBe('Escribí tu email para que podamos escribirte.');
  });

  it('el contrato viejo (contactoTipo/contacto) sin email responde 400, no 500', async () => {
    const { email: _sin, ...sinEmail } = voucherValido;
    const res = await crearVoucher({ ...sinEmail, contactoTipo: 'whatsapp', contacto: '11 5555 1234' });
    expect(res.status).toBe(400);
    expect(res.body.campos.email).toBeDefined();
  });

  it('un WhatsApp incompleto responde 400', async () => {
    const res = await crearVoucher({ ...voucherValido, whatsapp: '123' });
    expect(res.status).toBe(400);
    expect(res.body.campos.whatsapp).toContain('código de área');
  });

  it('guarda el email como contacto y el WhatsApp opcional aparte', async () => {
    const res = await crearVoucher({ ...voucherValido, whatsapp: '11 5555 1234' });
    expect(res.status).toBe(201);
    const v = await prisma.voucher.findUniqueOrThrow({ where: { numero: res.body.numero } });
    expect(v).toMatchObject({ contactoTipo: 'email', contacto: 'ana@example.com', whatsapp: '11 5555 1234' });
    const sinWhatsapp = await crearVoucher(voucherValido);
    expect((await prisma.voucher.findUniqueOrThrow({ where: { numero: sinWhatsapp.body.numero } })).whatsapp).toBeNull();
  });

  it('el voucher le escribe a la persona (responder a tesorería) y avisa a tesorería', async () => {
    const res = await crearVoucher({ ...voucherValido, formaPago: 'efectivo' });
    const n = String(res.body.numero).padStart(4, '0');
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(2));
    const persona = enviar.mock.calls.find((c) => c[1] === `Tu voucher Pro Templo Nº ${n}`)!;
    expect(persona[0]).toBe('ana@example.com');
    expect(persona[3]).toEqual({ responderA: 'teso@example.com, teso2@example.com' });
    expect(persona[2]).toContain('mesa Pro Templo');
    const aviso = enviar.mock.calls.find((c) => c[1] === `Voucher nuevo Nº ${n}`)!;
    expect(aviso[0]).toBe('teso@example.com, teso2@example.com');
    expect(aviso[2]).toContain('/vouchers');
  });

  it('sin TESORERIA_EMAIL el voucher igual se crea, sin aviso y sin responder a', async () => {
    config.emailTesoreria = '';
    const res = await crearVoucher(voucherValido);
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    expect(asuntos()).toEqual([`Tu voucher Pro Templo Nº ${String(res.body.numero).padStart(4, '0')}`]);
    expect(enviar.mock.calls[0][3]?.responderA).toBeFalsy();
  });

  it('las instrucciones de pago no mencionan WhatsApp', async () => {
    const res = await crearVoucher({ ...voucherValido, formaPago: 'transferencia' });
    expect(res.status).toBe(201);
    expect(res.body.instrucciones).toContain('Nº ');
    expect(res.body.instrucciones).not.toMatch(/whatsapp/i);
    const publico = await request(app.getHttpServer()).get(`/api/vouchers/${res.body.numero}`);
    expect(publico.body.instrucciones).toBe(res.body.instrucciones);
  });

  it('rechaza montos sobre el máximo de la campaña', async () => {
    const res = await crearVoucher({ ...voucherValido, montoUsd: 10_001 });
    expect(res.status).toBe(400);
    expect(res.body.campos.montoUsd).toContain('máximo');
  });

  it('rechaza el envío si el campo trampa viene completo', async () => {
    const res = await crearVoucher({ ...voucherValido, sitioWeb: 'http://spam.example' });
    expect(res.status).toBe(400);
  });

  it('el sexto envío en una hora desde la misma conexión se bloquea', async () => {
    const misma = desde();
    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) codigos.push((await crearVoucher(voucherValido, misma)).status);
    expect(codigos).toEqual([201, 201, 201, 201, 201, 429]);
  });

  const crearVisita = (cuerpo: object) => request(app.getHttpServer()).post('/api/visitas').set('X-Forwarded-For', desde()).send(cuerpo);
  const visitaValida = { nombre: 'Juan Visita E2E', email: 'juan@example.com', intereses: ['Jóvenes'], aceptaPrivacidad: true };

  it('guarda la solicitud de primera visita con email y WhatsApp opcional', async () => {
    const res = await crearVisita({ ...visitaValida, whatsapp: '11 5555 1234' });
    expect(res.status).toBe(201);
    const visita = await prisma.visita.findFirstOrThrow({ where: { nombre: 'Juan Visita E2E' }, orderBy: { creado: 'desc' } });
    visitas.push(visita.id);
    expect(visita).toMatchObject({ estado: 'nueva', intereses: ['Jóvenes'], contactoTipo: 'email', contacto: 'juan@example.com', whatsapp: '11 5555 1234' });
  });

  it('la visita le da la bienvenida a la persona y avisa a recepción', async () => {
    const res = await crearVisita(visitaValida);
    expect(res.status).toBe(201);
    visitas.push((await prisma.visita.findFirstOrThrow({ where: { nombre: 'Juan Visita E2E' }, orderBy: { creado: 'desc' } })).id);
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(2));
    const bienvenida = enviar.mock.calls.find((c) => c[1] === '¡Te esperamos, Juan!')!;
    expect(bienvenida[0]).toBe('juan@example.com');
    expect(bienvenida[2]).toContain('google.com/maps');
    const aviso = enviar.mock.calls.find((c) => c[1] === 'Alguien avisó que viene el domingo')!;
    expect(aviso[0]).toBe('recepcion@example.com');
    expect(aviso[2]).toContain('/visitas');
  });

  it('sin RECEPCION_EMAIL la visita solo manda la bienvenida', async () => {
    config.emailRecepcion = '';
    const res = await crearVisita(visitaValida);
    expect(res.status).toBe(201);
    visitas.push((await prisma.visita.findFirstOrThrow({ where: { nombre: 'Juan Visita E2E' }, orderBy: { creado: 'desc' } })).id);
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(asuntos()).toEqual(['¡Te esperamos, Juan!']);
  });

  it('la visita sin email responde 400 en el campo email, también con el contrato viejo', async () => {
    const { email: _sin, ...sinEmail } = visitaValida;
    const res = await crearVisita(sinEmail);
    expect(res.status).toBe(400);
    expect(res.body.campos.email).toBe('Escribí tu email para que podamos escribirte.');
    const viejo = await crearVisita({ ...sinEmail, contactoTipo: 'whatsapp', contacto: '11 5555 1234' });
    expect(viejo.status).toBe(400);
    expect(viejo.body.campos.email).toBeDefined();
  });

  it('la visita con WhatsApp incompleto responde 400', async () => {
    const res = await crearVisita({ ...visitaValida, whatsapp: '123' });
    expect(res.status).toBe(400);
    expect(res.body.campos.whatsapp).toBeDefined();
  });

  it('informa el próximo vivo', async () => {
    const res = await request(app.getHttpServer()).get('/api/en-vivo');
    expect(res.status).toBe(200);
    expect(typeof res.body.enVivo).toBe('boolean');
  });
});
