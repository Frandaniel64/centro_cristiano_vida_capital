import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { TextosAdmin, TextosSitio } from '@ccvida/shared';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import { ErrorDeFormulario } from '../comun/validacion.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContenidoService } from './contenido.service.js';

class ItemDto {
  @IsString() @MaxLength(80) titulo!: string;
  @IsString() @MaxLength(400) texto!: string;
}

class AgendaDto extends ItemDto {
  @IsString() @MaxLength(10) hora!: string;
}

class PreguntaDto {
  @IsString() @MaxLength(200) pregunta!: string;
  @IsString() @MaxLength(1000) respuesta!: string;
}

class PastoresDto {
  @IsString() @MaxLength(120) nombres!: string;
  @IsString() @MaxLength(1500) texto!: string;
  @IsString() @MaxLength(300) cita!: string;
}

class PilarDto extends ItemDto {
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Elegí un color.' }) color!: string;
}

class FotosNosotrosDto {
  @IsOptional() @IsString() portada!: string | null;
  @IsOptional() @IsString() historia!: string | null;
  @IsOptional() @IsString() pastores!: string | null;
  @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) galeria!: string[];
}

class TextosDto implements TextosSitio {
  @IsString() @MaxLength(80) lema!: string;
  @IsString() @MaxLength(400) bajadaInicio!: string;
  @IsString() @MaxLength(60) reunion!: string;
  @IsString() @MaxLength(120) direccion!: string;
  @IsString() @MaxLength(60) barrio!: string;
  @IsString() @MaxLength(120) colectivos!: string;
  @IsArray() @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => ItemDto) comoLlegar!: ItemDto[];
  @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => AgendaDto) agendaDomingo!: AgendaDto[];
  @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => PreguntaDto) faqVisita!: PreguntaDto[];
  @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => PreguntaDto) faqProTemplo!: PreguntaDto[];
  @IsString() @MaxLength(4000) historia!: string;
  @IsString() @MaxLength(200) datosIglesia!: string;
  @ValidateNested() @Type(() => PastoresDto) pastores!: PastoresDto;
  @IsArray() @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => ItemDto) creemos!: ItemDto[];
  @IsString() @MaxLength(40) whatsapp!: string;
  @IsString() @MaxLength(300) instagram!: string;
  @IsString() @MaxLength(300) youtube!: string;
  @IsString() @MaxLength(300) facebook!: string;
  @IsString() @MaxLength(1000) datosTransferencia!: string;
  @IsString() @MaxLength(600) nosotrosIntro!: string;
  @IsArray() @ArrayMaxSize(6) @ValidateNested({ each: true }) @Type(() => PilarDto) pilares!: PilarDto[];
  @ValidateNested() @Type(() => FotosNosotrosDto) fotosNosotros!: FotosNosotrosDto;
}

const esLink = (v: string) => !v || /^https:\/\//.test(v);

@Controller('admin/textos')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class TextosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contenido: ContenidoService,
  ) {}

  /** Los textos y, para el panel, los datos de las fotos que nombran. */
  @Get()
  async ver(): Promise<TextosAdmin> {
    const textos = await this.contenido.textos();
    return { ...textos, fotos: await this.contenido.fotosPorId(this.contenido.idsFotosNosotros(textos)) };
  }

  @Put()
  async guardar(@Body() d: TextosDto, @Sesion() s: SesionActual): Promise<TextosAdmin> {
    const campos: Record<string, string> = {};
    for (const red of ['instagram', 'youtube', 'facebook'] as const) {
      if (!esLink(d[red].trim())) campos[red] = 'Pegá el link completo, que empieza con https://';
    }
    if (d.whatsapp && d.whatsapp.replace(/\D/g, '').length < 10) campos['whatsapp'] = 'Escribí el número con código de área, por ejemplo 11 5555 1234.';
    const ids = this.contenido.idsFotosNosotros(d);
    const existentes = await this.contenido.fotosPorId(ids);
    if (ids.some((id) => !existentes[id])) campos['fotosNosotros'] = 'Alguna de las fotos ya no existe. Elegila de nuevo.';
    if (Object.keys(campos).length) throw new ErrorDeFormulario(campos);

    const textos = JSON.parse(JSON.stringify(d)) as Prisma.InputJsonValue;
    // Algunos datos también viven en columnas propias porque los usan otras partes de la API.
    const columnas = {
      direccion: d.direccion,
      horarioReunion: d.reunion,
      whatsapp: d.whatsapp || null,
      canalYoutube: d.youtube || null,
      datosTransferencia: d.datosTransferencia || null,
      actualizadoPorId: s.usuario.id,
    };
    await this.prisma.configuracion.upsert({
      where: { id: 1 },
      update: { textos, ...columnas },
      create: { id: 1, textos, ...columnas },
    });
    this.contenido.cambio();
    return this.ver();
  }
}
