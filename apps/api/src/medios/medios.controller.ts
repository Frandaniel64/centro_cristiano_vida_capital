import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { MedioAdmin, Pagina } from '@ccvida/shared';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';
import { randomUUID } from 'node:crypto';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import { ErrorDeFormulario } from '../comun/validacion.js';
import type { Medio } from '../generated/prisma/client.js';
import { ContenidoService } from '../contenido/contenido.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Almacen } from './almacen.js';
import { PESO_MAXIMO, TIPOS_ACEPTADOS, procesarFoto } from './procesar.js';

const POR_PAGINA = 40;

/** Lo que usa este controlador del archivo que entrega multer. */
interface ArchivoSubido {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

class SubirDto {
  @IsString()
  @Length(3, 300, { message: 'Describí la foto para quien no puede verla (texto alternativo).' })
  textoAlternativo!: string;

  @IsOptional() @IsString() @MaxLength(200) credito?: string;
}

class EditarDto {
  @IsOptional() @IsString() @Length(3, 300, { message: 'Describí la foto para quien no puede verla (texto alternativo).' }) textoAlternativo?: string;
  @IsOptional() @IsString() @MaxLength(200) credito?: string;
}

class FiltroMedios {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number;
}

export const medioAdmin = (m: Medio): MedioAdmin => ({
  id: m.id,
  url: m.url,
  tamanos: (m.tamanos ?? {}) as Record<string, string>,
  textoAlternativo: m.textoAlternativo,
  credito: m.credito,
  ancho: m.ancho,
  alto: m.alto,
  creado: m.creado.toISOString(),
});

@Controller('admin/medios')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class MediosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly almacen: Almacen,
    private readonly contenido: ContenidoService,
  ) {}

  @Get()
  async listar(@Query() f: FiltroMedios): Promise<Pagina<MedioAdmin>> {
    const pagina = f.pagina ?? 1;
    const [items, total] = await Promise.all([
      this.prisma.medio.findMany({ orderBy: { creado: 'desc' }, skip: (pagina - 1) * POR_PAGINA, take: POR_PAGINA }),
      this.prisma.medio.count(),
    ]);
    return { items: items.map(medioAdmin), total };
  }

  /** Sube una foto: el texto alternativo es obligatorio (spec: no se publica una foto sin él). */
  @Post()
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: PESO_MAXIMO, files: 1 } }))
  async subir(@UploadedFile() archivo: ArchivoSubido | undefined, @Body() d: SubirDto, @Sesion() s: SesionActual): Promise<MedioAdmin> {
    if (!archivo) throw new ErrorDeFormulario({ archivo: 'Elegí una foto.' });
    if (!TIPOS_ACEPTADOS.includes(archivo.mimetype)) {
      throw new ErrorDeFormulario({ archivo: 'La foto tiene que ser JPG, PNG, WebP o AVIF.' });
    }
    let foto: Awaited<ReturnType<typeof procesarFoto>>;
    try {
      foto = await procesarFoto(archivo.buffer);
    } catch {
      throw new ErrorDeFormulario({ archivo: 'No pudimos leer esa foto. Probá con otra o exportala de nuevo como JPG.' });
    }

    const id = randomUUID();
    const tamanos: Record<string, string> = {};
    for (const v of foto.variantes) {
      tamanos[v.ancho] = await this.almacen.guardar(`fotos/${id}/${v.ancho}.webp`, v.datos, 'image/webp');
    }
    tamanos['compartir'] = await this.almacen.guardar(`fotos/${id}/compartir.jpg`, foto.compartir, 'image/jpeg');
    const mayor = Math.max(...foto.variantes.map((v) => v.ancho));
    const medio = await this.prisma.medio.create({
      data: {
        clave: `fotos/${id}`,
        url: tamanos[mayor],
        tamanos,
        textoAlternativo: d.textoAlternativo.trim(),
        credito: d.credito?.trim() || null,
        mime: 'image/webp',
        ancho: foto.ancho,
        alto: foto.alto,
        actualizadoPorId: s.usuario.id,
      },
    });
    return medioAdmin(medio);
  }

  @Patch(':id')
  async editar(@Param('id') id: string, @Body() d: EditarDto, @Sesion() s: SesionActual): Promise<MedioAdmin> {
    await this.medio(id);
    const m = await this.prisma.medio.update({
      where: { id },
      data: { ...d, textoAlternativo: d.textoAlternativo?.trim(), actualizadoPorId: s.usuario.id },
    });
    return medioAdmin(m);
  }

  /** Solo se borra una foto que no usa ningún contenido. */
  @Delete(':id')
  @HttpCode(204)
  async borrar(@Param('id') id: string) {
    const m = await this.prisma.medio.findUnique({
      where: { id },
      include: { _count: { select: { publicaciones: true, eventos: true, predicas: true, series: true, ministerios: true, paginas: true } } },
    });
    if (!m) throw new NotFoundException({ mensaje: 'No encontramos esa foto.' });
    const enNosotros = this.contenido.idsFotosNosotros(await this.contenido.textos()).includes(id) ? 1 : 0;
    const usos = Object.values(m._count).reduce((a, b) => a + b, 0) + enNosotros;
    if (usos > 0) throw new ConflictException({ mensaje: `Esta foto se usa en ${usos} contenido${usos === 1 ? '' : 's'}. Cambiala ahí antes de borrarla.` });
    // Cada variante se guardó como <clave>/<archivo>: el nombre sale del final de su URL.
    for (const url of Object.values((m.tamanos ?? {}) as Record<string, string>)) {
      await this.almacen.borrar(`${m.clave}/${url.split('/').pop()}`);
    }
    await this.prisma.medio.delete({ where: { id } });
  }

  private async medio(id: string) {
    const m = await this.prisma.medio.findUnique({ where: { id } });
    if (!m) throw new NotFoundException({ mensaje: 'No encontramos esa foto.' });
    return m;
  }
}
