// Contenido del panel (etapa 2) contra la base de desarrollo. Las fotos van a
// disco (sin R2) y se borran al terminar.
import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import sharp from 'sharp';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { hashClave } from '../src/auth/cripto.js';
import type { Rol } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const CLAVE = 'clave-de-prueba-123';
const SUFIJO = `${Date.now()}`;

describe('Contenido (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const usuarios: string[] = [];
  const borrar = { medios: [] as string[], ministerios: [] as string[], eventos: [] as string[], predicas: [] as string[], series: [] as string[] };
  let ip = 0;
  let textosAntes: unknown;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(modulo.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
    textosAntes = (await prisma.configuracion.findUnique({ where: { id: 1 } }))?.textos ?? {};
  });

  afterAll(async () => {
    await prisma.predica.deleteMany({ where: { id: { in: borrar.predicas } } });
    await prisma.serie.deleteMany({ where: { id: { in: borrar.series } } });
    await prisma.evento.deleteMany({ where: { id: { in: borrar.eventos } } });
    await prisma.ministerio.deleteMany({ where: { id: { in: borrar.ministerios } } });
    const agente = await ingresar('administrador').catch(() => null);
    for (const id of borrar.medios) await agente?.delete(`/api/admin/medios/${id}`);
    await prisma.configuracion.update({ where: { id: 1 }, data: { textos: textosAntes as object } });
    await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
    await app.close();
  });

  /** Editor o recepción (sin 2FA) con la sesión completa. */
  async function ingresar(rol: Rol) {
    const u = await prisma.usuario.create({
      data: { nombre: `Contenido ${rol}`, email: `${rol}-${usuarios.length}-${SUFIJO}@e2e.test`, rol, passwordHash: await hashClave(CLAVE), debeCambiarClave: false },
    });
    usuarios.push(u.id);
    // Administración pide 2FA: para estas pruebas alcanza con marcar la sesión completa.
    const agente = request.agent(app.getHttpServer());
    await agente.post('/api/auth/ingresar').set('X-Forwarded-For', `10.2.0.${++ip}`).send({ email: u.email, clave: CLAVE });
    if (rol === 'administrador') await prisma.sesion.updateMany({ where: { usuarioId: u.id }, data: { completa: true } });
    return agente;
  }

  const foto = () => sharp({ create: { width: 1200, height: 800, channels: 3, background: '#8cc63f' } }).jpeg().toBuffer();

  async function subirFoto(agente: ReturnType<typeof request.agent>, alt = 'Chicos jugando en Kids Vida') {
    const res = await agente.post('/api/admin/medios').attach('archivo', await foto(), 'foto.jpg').field('textoAlternativo', alt);
    if (res.status === 201) borrar.medios.push(res.body.id);
    return res;
  }

  it('sube una foto en WebP con sus tamaños y se puede ver', async () => {
    const editor = await ingresar('editor');
    const res = await subirFoto(editor);
    expect(res.status).toBe(201);
    expect(Object.keys(res.body.tamanos)).toEqual(['480', '960', '1200']);
    const ruta = new URL(res.body.url).pathname;
    const archivo = await request(app.getHttpServer()).get(ruta);
    expect(archivo.status).toBe(200);
    expect(archivo.headers['content-type']).toBe('image/webp');
  });

  it('no acepta una foto sin texto alternativo ni un archivo que no es imagen', async () => {
    const editor = await ingresar('editor');
    const sinAlt = await editor.post('/api/admin/medios').attach('archivo', await foto(), 'foto.jpg');
    expect(sinAlt.status).toBe(400);
    expect(sinAlt.body.campos.textoAlternativo).toBeDefined();
    const texto = await editor.post('/api/admin/medios').attach('archivo', Buffer.from('hola'), { filename: 'x.jpg', contentType: 'image/jpeg' }).field('textoAlternativo', 'Algo');
    expect(texto.status).toBe(400);
    expect(texto.body.campos.archivo).toBeDefined();
  });

  it('recepción y tesorería no editan contenido', async () => {
    const recepcion = await ingresar('recepcion');
    expect((await recepcion.get('/api/admin/ministerios')).status).toBe(403);
    expect((await recepcion.post('/api/admin/medios')).status).toBe(403);
  });

  it('crea un ministerio con slug automático y no deja borrar la foto que usa', async () => {
    const editor = await ingresar('editor');
    const f = await subirFoto(editor);
    const datos = { nombre: `Jóvenes ${SUFIJO}`, estado: 'publicado', edades: 'De 15 a 30', horario: 'Sábados 19 h', resumen: 'Amistad y fe', descripcion: 'Texto', actividades: ['Música', ' ', 'Charla'], color: '#0c74b8', orden: 2, fotoId: f.body.id };
    const m = await editor.post('/api/admin/ministerios').send(datos);
    expect(m.status).toBe(201);
    borrar.ministerios.push(m.body.id);
    expect(m.body.slug).toBe(`jovenes-${SUFIJO}`);
    expect(m.body.actividades).toEqual(['Música', 'Charla']);
    expect(m.body.foto.textoAlternativo).toBe('Chicos jugando en Kids Vida');

    // Otro con el mismo nombre recibe -2.
    const otro = await editor.post('/api/admin/ministerios').send({ ...datos, fotoId: null });
    borrar.ministerios.push(otro.body.id);
    expect(otro.body.slug).toBe(`jovenes-${SUFIJO}-2`);

    const borrarFoto = await editor.delete(`/api/admin/medios/${f.body.id}`);
    expect(borrarFoto.status).toBe(409);
  });

  it('valida el evento: el fin después del inicio y links con https', async () => {
    const editor = await ingresar('editor');
    const base = { titulo: `Bautismo ${SUFIJO}`, estado: 'borrador', inicio: '2026-12-13T13:00:00.000Z', fin: '2026-12-13T12:00:00.000Z', repeticion: 'ninguna', lugar: null, resumen: null, descripcion: null, ministerioId: null, destacado: true, linkInscripcion: null, fotoId: null };
    const mal = await editor.post('/api/admin/eventos').send(base);
    expect(mal.status).toBe(400);
    expect(mal.body.campos.fin).toBeDefined();
    const link = await editor.post('/api/admin/eventos').send({ ...base, fin: null, linkInscripcion: 'forms.gle/abc' });
    expect(link.body.campos.linkInscripcion).toBeDefined();
    const bien = await editor.post('/api/admin/eventos').send({ ...base, fin: '2026-12-13T16:00:00.000Z' });
    expect(bien.status).toBe(201);
    borrar.eventos.push(bien.body.id);
  });

  it('una serie con prédicas no se borra', async () => {
    const editor = await ingresar('editor');
    const serie = await editor.post('/api/admin/series').send({ nombre: `Salmos ${SUFIJO}`, estado: 'publicado', descripcion: null, fotoId: null });
    borrar.series.push(serie.body.id);
    const predica = await editor.post('/api/admin/predicas').send({ titulo: `Bienaventurado ${SUFIJO}`, estado: 'publicado', fecha: '2026-09-20', predicador: 'Pastora Carolina', serieId: serie.body.id, urlVideo: 'https://youtu.be/abcdefghijk', duracionMin: 36, resumen: null, versiculos: ['Salmo 1'], destacada: false, fotoId: null });
    expect(predica.status).toBe(201);
    borrar.predicas.push(predica.body.id);
    expect(predica.body.fecha).toBe('2026-09-20');

    const res = await editor.delete(`/api/admin/series/${serie.body.id}`);
    expect(res.status).toBe(409);
    const lista = (await editor.get('/api/admin/series')).body as { id: string; predicas: number }[];
    expect(lista.find((s) => s.id === serie.body.id)?.predicas).toBe(1);
  });

  it('los textos del sitio arrancan con los de la maqueta y se guardan', async () => {
    const editor = await ingresar('editor');
    const textos = (await editor.get('/api/admin/textos')).body;
    expect(textos.lema).toBe('La iglesia sos vos.');
    const guardado = await editor.put('/api/admin/textos').send({ ...textos, lema: 'Vení como estés.', youtube: 'youtube.com/x' });
    expect(guardado.status).toBe(400);
    expect(guardado.body.campos.youtube).toBeDefined();
    const ok = await editor.put('/api/admin/textos').send({ ...textos, lema: 'Vení como estés.', datosTransferencia: 'CBU 0000' });
    expect(ok.body.lema).toBe('Vení como estés.');
    // Los datos de transferencia llegan a las instrucciones del voucher.
    const config = await prisma.configuracion.findUniqueOrThrow({ where: { id: 1 } });
    expect(config.datosTransferencia).toBe('CBU 0000');
  });
});
