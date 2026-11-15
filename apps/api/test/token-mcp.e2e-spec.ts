// Token del MCP: sesión larga por Authorization Bearer, con permisos de editor.
import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { crearTokenMcp } from '../prisma/crear-token-mcp.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { hashToken } from '../src/auth/cripto.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const EMAIL = 'mcp@ccvidacapital.org';

describe('Token del MCP (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(modulo.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const con = (token: string, ruta: string) => request(app.getHttpServer()).get(ruta).set('Authorization', `Bearer ${token}`);

  it('crea el usuario editor del MCP y su token sirve para el contenido', async () => {
    const { token } = await crearTokenMcp(prisma);
    const usuario = await prisma.usuario.findUnique({ where: { email: EMAIL } });
    expect(usuario?.rol).toBe('editor');
    expect(usuario?.activo).toBe(true);
    expect((await con(token, '/api/admin/ministerios')).status).toBe(200);
  });

  it.each(['/api/admin/visitas', '/api/admin/usuarios', '/api/admin/vouchers'])('no llega a %s', async (ruta) => {
    const { token } = await crearTokenMcp(prisma);
    expect((await con(token, ruta)).status).toBe(403);
  });

  it('guarda solo el hash y vence a los 90 días por defecto', async () => {
    const ahora = Date.now();
    const { token, expira } = await crearTokenMcp(prisma, 90, ahora);
    expect(expira.getTime()).toBe(ahora + 90 * 86_400_000);
    const fila = await prisma.sesion.findUnique({ where: { tokenHash: hashToken(token) } });
    expect(fila?.completa).toBe(true);
  });

  it('un token nuevo anula el anterior', async () => {
    const primero = await crearTokenMcp(prisma);
    const segundo = await crearTokenMcp(prisma);
    expect((await con(primero.token, '/api/admin/ministerios')).status).toBe(401);
    expect((await con(segundo.token, '/api/admin/ministerios')).status).toBe(200);
  });

  it('un token vencido da 401', async () => {
    const { token } = await crearTokenMcp(prisma, 90, Date.now() - 100 * 86_400_000);
    expect((await con(token, '/api/admin/ministerios')).status).toBe(401);
  });

  it('con el usuario del MCP dado de baja da 401', async () => {
    const { token } = await crearTokenMcp(prisma);
    await prisma.usuario.update({ where: { email: EMAIL }, data: { activo: false } });
    expect((await con(token, '/api/admin/ministerios')).status).toBe(401);
  });
});
