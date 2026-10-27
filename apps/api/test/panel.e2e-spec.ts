// Ingreso al panel, permisos por rol y circuito de tesorería, contra la base de desarrollo.
import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { codigoTotp, generarSecretoTotp, hashClave } from '../src/auth/cripto.js';
import type { Rol } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ProTemploService } from '../src/pro-templo/pro-templo.service.js';

const CLAVE = 'clave-de-prueba-123';
const SUFIJO = `${Date.now()}@e2e.test`;

describe('Panel (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const usuarios: string[] = [];
  const vouchers: string[] = [];
  let ip = 0;
  const desde = () => `10.1.0.${++ip}`;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(modulo.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.ajusteCampana.deleteMany({ where: { cargadoPorId: { in: usuarios } } });
    await prisma.voucher.deleteMany({ where: { id: { in: vouchers } } });
    await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
    app.get(ProTemploService).invalidarEstado();
    await app.close();
  });

  async function crearUsuario(rol: Rol, totp = false) {
    const secreto = totp ? generarSecretoTotp() : null;
    const u = await prisma.usuario.create({
      data: {
        nombre: `Prueba ${rol}`,
        email: `${rol}-${usuarios.length}-${SUFIJO}`,
        rol,
        passwordHash: await hashClave(CLAVE),
        debeCambiarClave: false,
        totpSecreto: secreto,
        totpActivo: totp,
      },
    });
    usuarios.push(u.id);
    return { ...u, secreto };
  }

  /** Devuelve un agente con la cookie de sesión ya completa. */
  async function ingresar(rol: Rol) {
    const conTotp = rol === 'administrador' || rol === 'tesoreria';
    const u = await crearUsuario(rol, conTotp);
    const agente = request.agent(app.getHttpServer());
    const ipAgente = desde();
    const r1 = await agente.post('/api/auth/ingresar').set('X-Forwarded-For', ipAgente).send({ email: u.email, clave: CLAVE });
    expect(r1.status).toBe(200);
    if (conTotp) {
      expect(r1.body).toEqual({ paso: 'codigo' });
      const r2 = await agente.post('/api/auth/codigo').set('X-Forwarded-For', ipAgente).send({ codigo: codigoTotp(u.secreto!) });
      expect(r2.body.paso).toBe('listo');
    }
    return { agente, usuario: u };
  }

  it('rechaza una contraseña incorrecta sin decir si el email existe', async () => {
    const u = await crearUsuario('editor');
    const mala = await request(app.getHttpServer()).post('/api/auth/ingresar').set('X-Forwarded-For', desde()).send({ email: u.email, clave: 'otra' });
    const inexistente = await request(app.getHttpServer()).post('/api/auth/ingresar').set('X-Forwarded-For', desde()).send({ email: `nadie-${SUFIJO}`, clave: 'otra' });
    expect(mala.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(mala.body.mensaje).toBe(inexistente.body.mensaje);
  });

  it('la cookie es httpOnly', async () => {
    const u = await crearUsuario('recepcion');
    const res = await request(app.getHttpServer()).post('/api/auth/ingresar').set('X-Forwarded-For', desde()).send({ email: u.email, clave: CLAVE });
    expect(res.headers['set-cookie']?.[0]).toMatch(/ccvida_sesion=.+HttpOnly/i);
  });

  it('tesorería sin 2FA activo tiene que configurarlo antes de entrar', async () => {
    const u = await crearUsuario('tesoreria');
    const agente = request.agent(app.getHttpServer());
    const ipAgente = desde();
    const r1 = await agente.post('/api/auth/ingresar').set('X-Forwarded-For', ipAgente).send({ email: u.email, clave: CLAVE });
    expect(r1.body).toEqual({ paso: 'configurar-2fa' });
    // Con la sesión a medias no se accede al panel.
    expect((await agente.get('/api/admin/resumen')).status).toBe(401);

    const config = await agente.post('/api/auth/2fa/iniciar');
    expect(config.body.qr).toMatch(/^data:image\/png;base64,/);
    const activado = await agente.post('/api/auth/2fa/activar').set('X-Forwarded-For', ipAgente).send({ codigo: codigoTotp(config.body.secreto) });
    expect(activado.body).toMatchObject({ paso: 'listo', usuario: { totpActivo: true } });
    expect((await agente.get('/api/admin/resumen')).status).toBe(200);
  });

  it('un código 2FA incorrecto no completa la sesión', async () => {
    const u = await crearUsuario('administrador', true);
    const agente = request.agent(app.getHttpServer());
    const ipAgente = desde();
    await agente.post('/api/auth/ingresar').set('X-Forwarded-For', ipAgente).send({ email: u.email, clave: CLAVE });
    const malo = await agente.post('/api/auth/codigo').set('X-Forwarded-For', ipAgente).send({ codigo: '000000' });
    expect(malo.status).toBe(401);
    expect((await agente.get('/api/auth/yo')).status).toBe(401);
  });

  it('cada rol ve solo lo suyo', async () => {
    const editor = await ingresar('editor');
    const recepcion = await ingresar('recepcion');
    const tesoreria = await ingresar('tesoreria');

    // Editor: ni vouchers ni visitas.
    expect((await editor.agente.get('/api/admin/vouchers')).status).toBe(403);
    expect((await editor.agente.get('/api/admin/visitas')).status).toBe(403);
    // Recepción: visitas sí, vouchers no.
    expect((await recepcion.agente.get('/api/admin/visitas')).status).toBe(200);
    expect((await recepcion.agente.get('/api/admin/vouchers')).status).toBe(403);
    // Tesorería: vouchers sí, usuarios no.
    expect((await tesoreria.agente.get('/api/admin/vouchers')).status).toBe(200);
    expect((await tesoreria.agente.get('/api/admin/usuarios')).status).toBe(403);

    const resumen = (await recepcion.agente.get('/api/admin/resumen')).body;
    expect(resumen.visitas).toBeDefined();
    expect(resumen.proTemplo).toBeUndefined();
  });

  it('tesorería confirma un voucher, suma al contador y queda registrado quién', async () => {
    const { agente, usuario } = await ingresar('tesoreria');
    const creado = await request(app.getHttpServer())
      .post('/api/vouchers')
      .set('X-Forwarded-For', desde())
      .send({ montoUsd: 70, nombre: 'Donante E2E', mostrarComo: 'apodo', apodo: 'Familia E2E', contactoTipo: 'whatsapp', contacto: '11 5555 1234', formaPago: 'efectivo', aceptaPrivacidad: true });
    const numero = creado.body.numero as number;
    vouchers.push((await prisma.voucher.findUniqueOrThrow({ where: { numero } })).id);

    const antes = (await request(app.getHttpServer()).get('/api/pro-templo/estado')).body.recaudadoUsd;
    const confirmado = await agente.post(`/api/admin/vouchers/${numero}/confirmar`).send({ montoRecibido: 70, monedaRecibida: 'USD' });
    expect(confirmado.status).toBe(200);
    expect(confirmado.body).toMatchObject({ estado: 'confirmado', confirmadoPor: usuario.nombre });

    const estado = (await request(app.getHttpServer()).get('/api/pro-templo/estado')).body;
    expect(estado.recaudadoUsd).toBe(antes + 70);
    // El apodo no se muestra hasta que se aprueba.
    expect(estado.ultimosVouchers[0].nombre).toBe('Alguien de la familia');
    await agente.post(`/api/admin/vouchers/${numero}/apodo`).send({ aprobado: true });
    expect((await request(app.getHttpServer()).get('/api/pro-templo/estado')).body.ultimosVouchers[0].nombre).toBe('Familia E2E');

    // Anularlo lo saca del total.
    await agente.post(`/api/admin/vouchers/${numero}/anular`).send({ motivo: 'Prueba de anulación' });
    expect((await request(app.getHttpServer()).get('/api/pro-templo/estado')).body.recaudadoUsd).toBe(antes);
  });

  it('pagado en pesos exige el tipo de cambio', async () => {
    const { agente } = await ingresar('tesoreria');
    const creado = await request(app.getHttpServer())
      .post('/api/vouchers')
      .set('X-Forwarded-For', desde())
      .send({ montoUsd: 10, nombre: 'Pesos E2E', mostrarComo: 'anonimo', contactoTipo: 'whatsapp', contacto: '11 5555 1234', formaPago: 'efectivo', aceptaPrivacidad: true });
    vouchers.push((await prisma.voucher.findUniqueOrThrow({ where: { numero: creado.body.numero } })).id);
    const res = await agente.post(`/api/admin/vouchers/${creado.body.numero}/confirmar`).send({ montoRecibido: 12000, monedaRecibida: 'ARS' });
    expect(res.status).toBe(400);
    expect(res.body.campos.tipoCambio).toBeDefined();
  });

  it('un ajuste manual suma al total y guarda quién lo cargó', async () => {
    const { agente, usuario } = await ingresar('administrador');
    const antes = (await request(app.getHttpServer()).get('/api/pro-templo/estado')).body.recaudadoUsd;
    const ajuste = await agente.post('/api/admin/ajustes').send({ montoUsd: 500, motivo: 'Lo juntado antes del sitio' });
    expect(ajuste.body).toMatchObject({ montoUsd: 500, cargadoPor: usuario.nombre });
    expect((await request(app.getHttpServer()).get('/api/pro-templo/estado')).body.recaudadoUsd).toBe(antes + 500);
  });

  it('dar de baja a alguien le cierra la sesión al instante', async () => {
    const admin = await ingresar('administrador');
    const recepcion = await ingresar('recepcion');
    expect((await recepcion.agente.get('/api/auth/yo')).status).toBe(200);
    await admin.agente.patch(`/api/admin/usuarios/${recepcion.usuario.id}`).send({ activo: false });
    expect((await recepcion.agente.get('/api/auth/yo')).status).toBe(401);
  });

  it('crear un usuario devuelve una clave temporal que obliga a cambiarla', async () => {
    const admin = await ingresar('administrador');
    const res = await admin.agente.post('/api/admin/usuarios').send({ nombre: 'Nueva Persona', email: `nueva-${SUFIJO}`, rol: 'editor' });
    expect(res.status).toBe(201);
    usuarios.push(res.body.usuario.id);
    expect(res.body.claveTemporal).toMatch(/^\w{4}-\w{4}-\w{4}$/);
    expect(res.body.usuario.debeCambiarClave).toBe(true);

    const agente = request.agent(app.getHttpServer());
    const ipAgente = desde();
    await agente.post('/api/auth/ingresar').set('X-Forwarded-For', ipAgente).send({ email: `nueva-${SUFIJO}`, clave: res.body.claveTemporal });
    const cambio = await agente.post('/api/auth/clave').set('X-Forwarded-For', ipAgente).send({ actual: res.body.claveTemporal, nueva: 'una-clave-nueva-larga' });
    expect(cambio.body.debeCambiarClave).toBe(false);
  });

  it('el sexto intento de ingreso en 15 minutos se bloquea', async () => {
    const misma = desde();
    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) {
      codigos.push((await request(app.getHttpServer()).post('/api/auth/ingresar').set('X-Forwarded-For', misma).send({ email: `x-${SUFIJO}`, clave: 'mal' })).status);
    }
    expect(codigos).toEqual([401, 401, 401, 401, 401, 429]);
  });
});
