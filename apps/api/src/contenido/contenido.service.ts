import { Injectable } from '@nestjs/common';
import type { ContenidoPublico, EstadoContenido, FotoPublica, TextosSitio } from '@ccvida/shared';
import { ErrorDeFormulario } from '../comun/validacion.js';
import type { Medio } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TEXTOS_INICIALES } from './textos-iniciales.js';

const DIA_MS = 24 * 60 * 60 * 1000;

const fotoPublica = (m: Medio | null): FotoPublica | null =>
  m ? { url: m.url, tamanos: (m.tamanos ?? {}) as Record<string, string>, alt: m.textoAlternativo } : null;

@Injectable()
export class ContenidoService {
  // Lo que lee la web; se rearma la próxima vez que se pide después de un cambio.
  private cache: ContenidoPublico | null = null;

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

  /** Todo lo publicado que muestra la web. */
  async publico(ahora = Date.now()): Promise<ContenidoPublico> {
    if (this.cache) return this.cache;
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

    this.cache = {
      textos,
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
    return this.cache;
  }
}
