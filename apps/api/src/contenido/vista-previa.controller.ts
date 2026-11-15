import { BadRequestException, Body, Controller, HttpCode, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import { config } from '../config.js';
import { firmarPermiso, rutaInterna } from './vista-previa.js';

class PedirVistaPreviaDto {
  @IsString() ruta!: string;
}

@Controller('admin/vista-previa')
@UseGuards(SesionGuard)
@Roles('administrador', 'editor')
export class VistaPreviaController {
  /** URL del sitio que muestra los borradores, con un permiso firmado de una hora. */
  @Post()
  @HttpCode(200)
  pedir(@Body() d: PedirVistaPreviaDto, @Sesion() s: SesionActual): { url: string } {
    // La clave se lee en cada pedido; con la clave vacía cualquier firma sería válida.
    const secreto = config.vistaPreviaSecreto;
    if (!secreto) throw new ServiceUnavailableException({ mensaje: 'La vista previa no está configurada.' });
    if (!rutaInterna(d.ruta)) throw new BadRequestException({ mensaje: 'Ruta inválida.' });
    const permiso = firmarPermiso(s.usuario.id, secreto);
    return { url: `${config.sitioUrl}/vista-previa?permiso=${permiso}&ir=${encodeURIComponent(d.ruta)}` };
  }
}
