import { Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { EstadoContenido, Guardar, PredicaAdmin, SerieAdmin } from '@ccvida/shared';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import { ErrorDeFormulario } from '../comun/validacion.js';
import type { Medio, Predica, Serie } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { fotoRef, incluirFoto, slugLibre } from './comun.js';
import { ContenidoService } from './contenido.service.js';

class GuardarPredicaDto implements Guardar<PredicaAdmin> {
  @IsString() @Length(3, 120, { message: 'Escribí el título de la prédica.' }) titulo!: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsIn(['borrador', 'publicado']) estado!: EstadoContenido;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Elegí la fecha de la prédica.' }) fecha!: string;
  @IsString() @Length(2, 100, { message: 'Escribí quién predicó.' }) predicador!: string;
  @IsOptional() @IsString() serieId!: string | null;
  @IsOptional() @IsString() @MaxLength(500) urlVideo!: string | null;
  @IsOptional() @IsInt() @Min(1) @Max(600) duracionMin!: number | null;
  @IsOptional() @IsString() @MaxLength(500) resumen!: string | null;
  @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(80, { each: true }) versiculos!: string[];
  @IsBoolean() destacada!: boolean;
  @IsOptional() @IsString() fotoId!: string | null;
}

class GuardarSerieDto implements Guardar<SerieAdmin> {
  @IsString() @Length(2, 80, { message: 'Escribí el nombre de la serie.' }) nombre!: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsIn(['borrador', 'publicado']) estado!: EstadoContenido;
  @IsOptional() @IsString() @MaxLength(1000) descripcion!: string | null;
  @IsOptional() @IsString() fotoId!: string | null;
}

export const predicaAdmin = (p: Predica & { foto: Medio | null }): PredicaAdmin => ({
  id: p.id,
  slug: p.slug,
  estado: p.estado,
  foto: fotoRef(p.foto),
  actualizado: p.actualizado.toISOString(),
  titulo: p.titulo,
  fecha: p.fecha.toISOString().slice(0, 10),
  predicador: p.predicador,
  serieId: p.serieId,
  urlVideo: p.urlVideo,
  duracionMin: p.duracionMin,
  resumen: p.resumen,
  versiculos: p.versiculos,
  destacada: p.destacada,
});

const serieAdmin = (s: Serie & { foto: Medio | null; _count: { predicas: number } }): SerieAdmin => ({
  id: s.id,
  slug: s.slug,
  estado: s.estado,
  foto: fotoRef(s.foto),
  actualizado: s.actualizado.toISOString(),
  nombre: s.nombre,
  descripcion: s.descripcion,
  predicas: s._count.predicas,
});

const incluirSerie = { foto: true, _count: { select: { predicas: true } } } as const;

@Controller('admin/predicas')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class PredicasController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contenido: ContenidoService,
  ) {}

  @Get()
  async listar(): Promise<PredicaAdmin[]> {
    const lista = await this.prisma.predica.findMany({ orderBy: { fecha: 'desc' }, include: incluirFoto });
    return lista.map(predicaAdmin);
  }

  @Post()
  crear(@Body() d: GuardarPredicaDto, @Sesion() s: SesionActual) {
    return this.guardar(undefined, d, s);
  }

  @Put(':id')
  async editar(@Param('id') id: string, @Body() d: GuardarPredicaDto, @Sesion() s: SesionActual) {
    if (!(await this.prisma.predica.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException({ mensaje: 'No encontramos esa prédica.' });
    }
    return this.guardar(id, d, s);
  }

  @Delete(':id')
  @HttpCode(204)
  async borrar(@Param('id') id: string) {
    if (!(await this.prisma.predica.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException({ mensaje: 'No encontramos esa prédica.' });
    }
    await this.prisma.predica.delete({ where: { id } });
    this.contenido.cambio();
  }

  private async guardar(id: string | undefined, d: GuardarPredicaDto, s: SesionActual): Promise<PredicaAdmin> {
    if (d.urlVideo && !/^https:\/\//.test(d.urlVideo.trim())) {
      throw new ErrorDeFormulario({ urlVideo: 'Pegá el link completo del video, que empieza con https://' });
    }
    if (d.serieId && !(await this.prisma.serie.findUnique({ where: { id: d.serieId }, select: { id: true } }))) {
      throw new ErrorDeFormulario({ serieId: 'Esa serie ya no existe.' });
    }
    await this.contenido.validarFoto(d.fotoId, d.estado);
    const slug = await slugLibre((x) => this.prisma.predica.findUnique({ where: { slug: x }, select: { id: true } }), d.titulo, d.slug, id);
    const data = {
      titulo: d.titulo.trim(),
      slug,
      estado: d.estado,
      fecha: new Date(`${d.fecha}T00:00:00Z`),
      predicador: d.predicador.trim(),
      serieId: d.serieId || null,
      urlVideo: d.urlVideo?.trim() || null,
      duracionMin: d.duracionMin ?? null,
      resumen: d.resumen?.trim() || null,
      versiculos: d.versiculos.map((v) => v.trim()).filter(Boolean),
      destacada: d.destacada,
      fotoId: d.fotoId || null,
      actualizadoPorId: s.usuario.id,
    };
    const p = id
      ? await this.prisma.predica.update({ where: { id }, data, include: incluirFoto })
      : await this.prisma.predica.create({ data, include: incluirFoto });
    this.contenido.cambio();
    return predicaAdmin(p);
  }
}

@Controller('admin/series')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class SeriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contenido: ContenidoService,
  ) {}

  @Get()
  async listar(): Promise<SerieAdmin[]> {
    const lista = await this.prisma.serie.findMany({ orderBy: { creado: 'desc' }, include: incluirSerie });
    return lista.map(serieAdmin);
  }

  @Post()
  crear(@Body() d: GuardarSerieDto, @Sesion() s: SesionActual) {
    return this.guardar(undefined, d, s);
  }

  @Put(':id')
  async editar(@Param('id') id: string, @Body() d: GuardarSerieDto, @Sesion() s: SesionActual) {
    if (!(await this.prisma.serie.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException({ mensaje: 'No encontramos esa serie.' });
    }
    return this.guardar(id, d, s);
  }

  /** Una serie con prédicas no se borra: primero hay que moverlas o borrarlas. */
  @Delete(':id')
  @HttpCode(204)
  async borrar(@Param('id') id: string) {
    const s = await this.prisma.serie.findUnique({ where: { id }, include: { _count: { select: { predicas: true } } } });
    if (!s) throw new NotFoundException({ mensaje: 'No encontramos esa serie.' });
    if (s._count.predicas > 0) {
      throw new ConflictException({ mensaje: `La serie tiene ${s._count.predicas} prédica${s._count.predicas === 1 ? '' : 's'}. Cambialas de serie antes de borrarla.` });
    }
    await this.prisma.serie.delete({ where: { id } });
    this.contenido.cambio();
  }

  private async guardar(id: string | undefined, d: GuardarSerieDto, s: SesionActual): Promise<SerieAdmin> {
    await this.contenido.validarFoto(d.fotoId, d.estado);
    const slug = await slugLibre((x) => this.prisma.serie.findUnique({ where: { slug: x }, select: { id: true } }), d.nombre, d.slug, id);
    const data = {
      nombre: d.nombre.trim(),
      slug,
      estado: d.estado,
      descripcion: d.descripcion?.trim() || null,
      fotoId: d.fotoId || null,
      actualizadoPorId: s.usuario.id,
    };
    const serie = id
      ? await this.prisma.serie.update({ where: { id }, data, include: incluirSerie })
      : await this.prisma.serie.create({ data, include: incluirSerie });
    this.contenido.cambio();
    return serieAdmin(serie);
  }
}
