import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { EstadoContenido, EventoAdmin, Guardar, Repeticion } from '@ccvida/shared';
import { IsBoolean, IsIn, IsISO8601, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import { ErrorDeFormulario } from '../comun/validacion.js';
import type { Evento, Medio } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { fotoRef, incluirFoto, slugLibre } from './comun.js';
import { ContenidoService } from './contenido.service.js';

class GuardarEventoDto implements Guardar<EventoAdmin> {
  @IsString() @Length(3, 120, { message: 'Escribí el título del evento.' }) titulo!: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsIn(['borrador', 'publicado']) estado!: EstadoContenido;
  @IsISO8601({}, { message: 'Elegí fecha y hora de inicio.' }) inicio!: string;
  @IsOptional() @IsISO8601({}, { message: 'La fecha de fin no es válida.' }) fin!: string | null;
  @IsIn(['ninguna', 'semanal', 'mensual']) repeticion!: Repeticion;
  @IsOptional() @IsString() @MaxLength(160) lugar!: string | null;
  @IsOptional() @IsString() @MaxLength(200) resumen!: string | null;
  @IsOptional() @IsString() @MaxLength(5000) descripcion!: string | null;
  @IsOptional() @IsString() ministerioId!: string | null;
  @IsBoolean() destacado!: boolean;
  @IsOptional() @IsString() @MaxLength(500) linkInscripcion!: string | null;
  @IsOptional() @IsString() fotoId!: string | null;
}

export const eventoAdmin = (e: Evento & { foto: Medio | null }): EventoAdmin => ({
  id: e.id,
  slug: e.slug,
  estado: e.estado,
  foto: fotoRef(e.foto),
  actualizado: e.actualizado.toISOString(),
  titulo: e.titulo,
  inicio: e.inicio.toISOString(),
  fin: e.fin?.toISOString() ?? null,
  repeticion: e.repeticion,
  lugar: e.lugar,
  resumen: e.resumen,
  descripcion: e.descripcion,
  ministerioId: e.ministerioId,
  destacado: e.destacado,
  linkInscripcion: e.linkInscripcion,
});

@Controller('admin/eventos')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class EventosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contenido: ContenidoService,
  ) {}

  /** Los próximos primero; después los pasados, del más reciente al más viejo. */
  @Get()
  async listar(): Promise<EventoAdmin[]> {
    const lista = await this.prisma.evento.findMany({ orderBy: { inicio: 'desc' }, include: incluirFoto });
    return lista.map(eventoAdmin);
  }

  @Post()
  crear(@Body() d: GuardarEventoDto, @Sesion() s: SesionActual) {
    return this.guardar(undefined, d, s);
  }

  @Put(':id')
  async editar(@Param('id') id: string, @Body() d: GuardarEventoDto, @Sesion() s: SesionActual) {
    await this.existente(id);
    return this.guardar(id, d, s);
  }

  @Delete(':id')
  @HttpCode(204)
  async borrar(@Param('id') id: string) {
    await this.existente(id);
    await this.prisma.evento.delete({ where: { id } });
    this.contenido.cambio();
  }

  private async guardar(id: string | undefined, d: GuardarEventoDto, s: SesionActual): Promise<EventoAdmin> {
    const inicio = new Date(d.inicio);
    const fin = d.fin ? new Date(d.fin) : null;
    if (fin && fin <= inicio) throw new ErrorDeFormulario({ fin: 'El fin tiene que ser después del inicio.' });
    if (d.linkInscripcion && !/^(https?:\/\/|\/)/.test(d.linkInscripcion.trim())) {
      throw new ErrorDeFormulario({ linkInscripcion: 'El link tiene que empezar con https:// (o / si es una página del sitio).' });
    }
    if (d.ministerioId && !(await this.prisma.ministerio.findUnique({ where: { id: d.ministerioId }, select: { id: true } }))) {
      throw new ErrorDeFormulario({ ministerioId: 'Ese ministerio ya no existe.' });
    }
    await this.contenido.validarFoto(d.fotoId, d.estado);
    const slug = await slugLibre((x) => this.prisma.evento.findUnique({ where: { slug: x }, select: { id: true } }), d.titulo, d.slug, id);
    const data = {
      titulo: d.titulo.trim(),
      slug,
      estado: d.estado,
      inicio,
      fin,
      repeticion: d.repeticion,
      lugar: d.lugar?.trim() || null,
      resumen: d.resumen?.trim() || null,
      descripcion: d.descripcion?.trim() || null,
      ministerioId: d.ministerioId || null,
      destacado: d.destacado,
      linkInscripcion: d.linkInscripcion?.trim() || null,
      fotoId: d.fotoId || null,
      actualizadoPorId: s.usuario.id,
    };
    const e = id
      ? await this.prisma.evento.update({ where: { id }, data, include: incluirFoto })
      : await this.prisma.evento.create({ data, include: incluirFoto });
    this.contenido.cambio();
    return eventoAdmin(e);
  }

  private async existente(id: string) {
    const e = await this.prisma.evento.findUnique({ where: { id } });
    if (!e) throw new NotFoundException({ mensaje: 'No encontramos ese evento.' });
    return e;
  }
}
