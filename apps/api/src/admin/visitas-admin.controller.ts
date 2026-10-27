import { Body, Controller, Get, NotFoundException, Param, Patch, Query, UseGuards } from '@nestjs/common';
import type { EstadoVisita, Pagina, VisitaAdmin } from '@ccvida/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import type { Visita } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const POR_PAGINA = 25;

class FiltroVisitas {
  @IsOptional() @IsIn(['nueva', 'contactada', 'vino']) estado?: EstadoVisita;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number;
}

class EditarVisitaDto {
  @IsOptional() @IsIn(['nueva', 'contactada', 'vino']) estado?: EstadoVisita;
  @IsOptional() @IsString() @MaxLength(2000) notas?: string;
}

const aVista = (v: Visita & { atendidoPor: { nombre: string } | null }): VisitaAdmin => ({
  id: v.id,
  nombre: v.nombre,
  contactoTipo: v.contactoTipo,
  contacto: v.contacto,
  intereses: v.intereses,
  estado: v.estado,
  notas: v.notas,
  atendidoPor: v.atendidoPor?.nombre ?? null,
  creado: v.creado.toISOString(),
});

@Controller('admin/visitas')
@UseGuards(SesionGuard)
@Roles('administrador', 'recepcion')
export class VisitasAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@Query() f: FiltroVisitas): Promise<Pagina<VisitaAdmin>> {
    const q = f.q?.trim();
    const where = {
      ...(f.estado ? { estado: f.estado } : {}),
      ...(q ? { OR: [{ nombre: { contains: q, mode: 'insensitive' as const } }, { contacto: { contains: q, mode: 'insensitive' as const } }] } : {}),
    };
    const pagina = f.pagina ?? 1;
    const [items, total] = await Promise.all([
      this.prisma.visita.findMany({
        where,
        orderBy: { creado: 'desc' },
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
        include: { atendidoPor: { select: { nombre: true } } },
      }),
      this.prisma.visita.count({ where }),
    ]);
    return { items: items.map(aVista), total };
  }

  @Patch(':id')
  async editar(@Param('id') id: string, @Body() d: EditarVisitaDto, @Sesion() s: SesionActual): Promise<VisitaAdmin> {
    const existe = await this.prisma.visita.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException({ mensaje: 'No encontramos esa visita.' });
    const v = await this.prisma.visita.update({
      where: { id },
      data: { ...d, atendidoPorId: s.usuario.id, actualizadoPorId: s.usuario.id },
      include: { atendidoPor: { select: { nombre: true } } },
    });
    return aVista(v);
  }
}
