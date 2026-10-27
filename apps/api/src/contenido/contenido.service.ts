import { Injectable } from '@nestjs/common';
import type { ContenidoPublico, EstadoContenido, FotoPublica, FotoRef, TextosSitio } from '@ccvida/shared';
import { ErrorDeFormulario } from '../comun/validacion.js';
import type { Medio } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TEXTOS_INICIALES } from './textos-iniciales.js';

const DIA_MS = 24 * 60 * 60 * 1000;
const CACHE_MS = 60_000;

const fotoPublica = (m: Medio | null): FotoPublica | null =>
  m ? { url: m.url, tamanos: (m.tamanos ?? {}) as Record<string, string>, alt: m.textoAlternativo } : null;

@Injectable()
export class ContenidoService {
  // Lo que lee la web. Se rearma después de un cambio en el panel o, como mucho,
  // al minuto (por si algo se cambió por fuera del panel: un seed, una migración).
  private cache: { datos: ContenidoPublico; hasta: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Lo llaman los controladores del panel después de guardar: invalida lo que lee la web. */
  cambio() {
    this.cache = null;
  }

  /** La foto tiene que existir; para publicar, además, tener texto alternativo. */
  async validarFoto(fotoId: string | null | undefined, estado: EstadoContenido) {
    if (!fotoId) return;
    const foto = await this.prisma.medio.findUnique({ where: { id: fotoId }, select: { textoAlternativo: true } });
    if (!foto) throw new ErrorDeFormulario({ fotoId: 'Esa foto ya no existe. Elegí otra.' });
    if (estado === 'publicado' && !foto.textoAlternativo.trim()) {
      throw new ErrorDeFormulario({ fotoId: 'La foto necesita texto alternativo antes de publicar.' });
    }
  }

  /** Lo guardado, completado con los textos iniciales en lo que falte. */
  async textos(): Promise<TextosSitio> {
    const c = await this.prisma.configuracion.findUnique({ where: { id: 1 } });
    return { ...TEXTOS_INICIALES, ...((c?.textos ?? {}) as Partial<TextosSitio>) };
  }

  /** Ids de las fotos que usa la página Nosotros. */
  idsFotosNosotros(t: Pick<TextosSitio, 'fotosNosotros'>) {
    const f = t.fotosNosotros;
    return [...new Set([f.portada, f.historia, f.pastores, ...f.galeria].filter((id): id is string => !!id))];
  }

  /** Datos de varias fotos por id; las que no existen quedan afuera. */
  async fotosPorId(ids: string[]): Promise<Record<string, FotoRef>> {
    if (!ids.length) return {};
    const medios = await this.prisma.medio.findMany({ where: { id: { in: ids } } });
    return Object.fromEntries(
      medios.map((m) => [m.id, { id: m.id, url: m.url, tamanos: (m.tamanos ?? {}) as Record<string, string>, textoAlternativo: m.textoAlternativo }]),
    );
  }

  /** Todo lo publicado que muestra la web. */
  async publico(ahora = Date.now()): Promise<ContenidoPublico> {
    if (this.cache && this.cache.hasta > ahora) return this.cache.datos;
    const publicado = { estado: 'publicado' as const };
    // Un evento de una sola vez deja de mostrarse un día después de terminar.
    const desde = new Date(ahora - DIA_MS);
    const [textos, ministerios, eventos, predicas, campana] = await Promise.all([
      this.textos(),
      this.prisma.ministerio.findMany({ where: publicado, orderBy: [{ orden: 'asc' }, { nombre: 'asc' }], include: { foto: true } }),
      this.prisma.evento.findMany({
        where: { ...publicado, OR: [{ repeticion: { not: 'ninguna' } }, { fin: { gte: desde } }, { fin: null, inicio: { gte: desde } }] },
        orderBy: { inicio: 'asc' },
        include: { foto: true, ministerio: { select: { slug: true, estado: true } } },
      }),
      this.prisma.predica.findMany({
        where: publicado,
        orderBy: { fecha: 'desc' },
        take: 200,
        include: { foto: true, serie: { select: { nombre: true, estado: true } } },
      }),
      this.prisma.campana.findUnique({ where: { slug: 'pro-templo' } }),
    ]);

    const fotos = await this.prisma.medio.findMany({ where: { id: { in: this.idsFotosNosotros(textos) } } });
    const foto = (id: string | null) => fotoPublica(fotos.find((m) => m.id === id) ?? null);
    const fn = textos.fotosNosotros;
    const datos: ContenidoPublico = {
      textos,
      nosotros: {
        portada: foto(fn.portada),
        historia: foto(fn.historia),
        pastores: foto(fn.pastores),
        galeria: fn.galeria.map(foto).filter((f): f is FotoPublica => !!f),
      },
      ministerios: ministerios.map((m) => ({
        slug: m.slug,
        nombre: m.nombre,
        edades: m.edades,
        horario: m.horario,
        resumen: m.resumen,
        descripcion: m.descripcion,
        actividades: m.actividades,
        color: m.color,
        foto: fotoPublica(m.foto),
      })),
      eventos: eventos.map((e) => ({
        slug: e.slug,
        titulo: e.titulo,
        inicio: e.inicio.toISOString(),
        fin: e.fin?.toISOString() ?? null,
        repeticion: e.repeticion,
        lugar: e.lugar,
        resumen: e.resumen,
        descripcion: e.descripcion,
        // Un ministerio en borrador no tiene página: no se enlaza.
        ministerio: e.ministerio?.estado === 'publicado' ? e.ministerio.slug : null,
        destacado: e.destacado,
        linkInscripcion: e.linkInscripcion,
        foto: fotoPublica(e.foto),
      })),
      predicas: predicas.map((p) => ({
        slug: p.slug,
        titulo: p.titulo,
        fecha: p.fecha.toISOString().slice(0, 10),
        predicador: p.predicador,
        serie: p.serie?.estado === 'publicado' ? p.serie.nombre : null,
        urlVideo: p.urlVideo,
        duracionMin: p.duracionMin,
        resumen: p.resumen,
        versiculos: p.versiculos,
        destacada: p.destacada,
        foto: fotoPublica(p.foto),
      })),
      campana: {
        metaUsd: campana?.metaUsd ?? 10_000,
        montoMaximoUsd: campana?.montoMaximoUsd ?? 10_000,
        montosSugeridos: campana?.montosSugeridos ?? [],
        formasPago: campana?.formasPagoActivas ?? [],
      },
    };
    this.cache = { datos, hasta: ahora + CACHE_MS };
    return datos;
  }
}
