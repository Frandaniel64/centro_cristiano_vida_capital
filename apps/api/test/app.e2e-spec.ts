// Recorre los criterios de aceptación de Pro Templo y visitas contra la base
// de desarrollo (docker compose up -d && npm run db:migrate && npm run db:seed).
import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ProTemploService } from '../src/pro-templo/pro-templo.service.js';

const voucherValido = {
  montoUsd: 150,
  nombre: 'Ana Prueba E2E',
  mostrarComo: 'anonimo',
  contactoTipo: 'email',
  contacto: 'ana@example.com',
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

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(modulo.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
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
    const res = await crearVoucher({ ...voucherValido, montoUsd: 0, contacto: 'ana@', aceptaPrivacidad: false });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe('Revisá los datos marcados.');
    expect(Object.keys(res.body.campos).sort()).toEqual(['aceptaPrivacidad', 'contacto', 'montoUsd']);
    expect(res.body.campos.contacto).toContain('email');
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

  it('guarda la solicitud de primera visita', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/visitas')
      .set('X-Forwarded-For', desde())
      .send({ nombre: 'Juan Visita E2E', contactoTipo: 'whatsapp', contacto: '11 5555 1234', intereses: ['Jóvenes'], aceptaPrivacidad: true });
    expect(res.status).toBe(201);
    const visita = await prisma.visita.findFirstOrThrow({ where: { nombre: 'Juan Visita E2E' }, orderBy: { creado: 'desc' } });
    visitas.push(visita.id);
    expect(visita).toMatchObject({ estado: 'nueva', intereses: ['Jóvenes'] });
  });

  it('informa el próximo vivo', async () => {
    const res = await request(app.getHttpServer()).get('/api/en-vivo');
    expect(res.status).toBe(200);
    expect(typeof res.body.enVivo).toBe('boolean');
  });
});
