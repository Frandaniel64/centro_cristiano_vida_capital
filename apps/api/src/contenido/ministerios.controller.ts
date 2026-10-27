import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { EstadoContenido, Guardar, MinisterioAdmin } from '@ccvida/shared';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import type { Medio, Ministerio } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { fotoRef, incluirFoto, slugLibre } from './comun.js';
import { ContenidoService } from './contenido.service.js';

class GuardarMinisterioDto implements Guardar<MinisterioAdmin> {
  @IsString() @Length(2, 80, { message: 'Escribí el nombre del ministerio.' }) nombre!: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsIn(['borrador', 'publicado']) estado!: EstadoContenido;
  @IsOptional() @IsString() @MaxLength(100) edades!: string | null;
  @IsOptional() @IsString() @MaxLength(120) horario!: string | null;
  @IsOptional() @IsString() @MaxLength(200) resumen!: string | null;
  @IsOptional() @IsString() @MaxLength(3000) descripcion!: string | null;
  @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(160, { each: true }) actividades!: string[];
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Elegí un color.' }) color!: string | null;
  @IsInt() orden!: number;
  @IsOptional() @IsString() fotoId!: string | null;
}

export const ministerioAdmin = (m: Ministerio & { foto: Medio | null }): MinisterioAdmin => ({
  id: m.id,
  slug: m.slug,
  estado: m.estado,
  foto: fotoRef(m.foto),
  actualizado: m.actualizado.toISOString(),
  nombre: m.nombre,
  edades: m.edades,
  horario: m.horario,
  resumen: m.resumen,
  descripcion: m.descripcion,
  actividades: m.actividades,
  color: m.color,
  orden: m.orden,
});

@Controller('admin/ministerios')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class MinisteriosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contenido: ContenidoService,
  ) {}

  @Get()
  async listar(): Promise<MinisterioAdmin[]> {
    const lista = await this.prisma.ministerio.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }], include: incluirFoto });
    return lista.map(ministerioAdmin);
  }

  @Post()
  async crear(@Body() d: GuardarMinisterioDto, @Sesion() s: SesionActual) {
    return this.guardar(undefined, d, s);
  }

  @Put(':id')
  async editar(@Param('id') id: string, @Body() d: GuardarMinisterioDto, @Sesion() s: SesionActual) {
    await this.existente(id);
    return this.guardar(id, d, s);
  }

  @Delete(':id')
  @HttpCode(204)
  async borrar(@Param('id') id: string) {
    await this.existente(id);
    await this.prisma.ministerio.delete({ where: { id } });
    this.contenido.cambio();
  }

  private async guardar(id: string | undefined, d: GuardarMinisterioDto, s: SesionActual): Promise<MinisterioAdmin> {
    await this.contenido.validarFoto(d.fotoId, d.estado);
    const slug = await slugLibre((x) => this.prisma.ministerio.findUnique({ where: { slug: x }, select: { id: true } }), d.nombre, d.slug, id);
    const data = {
      nombre: d.nombre.trim(),
      slug,
      estado: d.estado,
      edades: d.edades?.trim() || null,
      horario: d.horario?.trim() || null,
      resumen: d.resumen?.trim() || null,
      descripcion: d.descripcion?.trim() || null,
      actividades: d.actividades.map((a) => a.trim()).filter(Boolean),
      color: d.color || null,
      orden: d.orden,
      fotoId: d.fotoId || null,
      actualizadoPorId: s.usuario.id,
    };
    const m = id
      ? await this.prisma.ministerio.update({ where: { id }, data, include: incluirFoto })
      : await this.prisma.ministerio.create({ data, include: incluirFoto });
    this.contenido.cambio();
    return ministerioAdmin(m);
  }

  private async existente(id: string) {
    const m = await this.prisma.ministerio.findUnique({ where: { id } });
    if (!m) throw new NotFoundException({ mensaje: 'No encontramos ese ministerio.' });
    return m;
  }
}
