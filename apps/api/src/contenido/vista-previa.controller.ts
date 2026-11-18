import { BadRequestException, Body, Controller, ForbiddenException, HttpCode, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import { config } from '../config.js';
import { DURACION_COMPARTIR_MS, DURACION_PERMISO_MS, firmarPermiso, rutaInterna } from './vista-previa.js';

class PedirVistaPreviaDto {
  @IsString() ruta!: string;
  /** Link para mandarle a alguien sin cuenta en el panel: dura 7 días. */
  @IsOptional() @IsBoolean() compartir?: boolean;
}

@Controller('admin/vista-previa')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class VistaPreviaController {
  /** URL del sitio que muestra los borradores, con un permiso firmado de una hora (7 días para compartir). */
  @Post()
  @HttpCode(200)
  pedir(@Body() d: PedirVistaPreviaDto, @Sesion() s: SesionActual): { url: string; vence: string } {
    // La clave se lee en cada pedido; con la clave vacía cualquier firma sería válida.
    const secreto = config.vistaPreviaSecreto;
    if (!secreto) throw new ServiceUnavailableException({ mensaje: 'La vista previa no está configurada.' });
    if (!rutaInterna(d.ruta)) throw new BadRequestException({ mensaje: 'Ruta inválida.' });
    if (d.compartir && s.usuario.rol !== 'administrador') {
      throw new ForbiddenException({ mensaje: 'Solo un administrador puede crear links para compartir.' });
    }
    const ahora = Date.now();
    const duracion = d.compartir ? DURACION_COMPARTIR_MS : DURACION_PERMISO_MS;
    const permiso = firmarPermiso(s.usuario.id, secreto, ahora, duracion);
    return {
      url: `${config.sitioUrl}/vista-previa?permiso=${permiso}&ir=${encodeURIComponent(d.ruta)}`,
      vence: new Date(ahora + duracion).toISOString(),
    };
  }
}
