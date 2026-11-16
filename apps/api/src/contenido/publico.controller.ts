import { Controller, Get, Header, Req, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { ContenidoPublico } from '@ccvida/shared';
import { config } from '../config.js';
import { ContenidoService } from './contenido.service.js';
import { verificarPermiso } from './vista-previa.js';

@Controller('contenido')
export class ContenidoPublicoController {
  constructor(private readonly contenido: ContenidoService) {}

  /** Lo que muestra la web. Spec: lo publicado en el panel aparece en menos de 1 minuto. */
  @Get()
  @Header('Cache-Control', 'public, max-age=20, s-maxage=20')
  publico(): Promise<ContenidoPublico> {
    return this.contenido.publico();
  }

  /** Lo mismo con los borradores, para quien trae un permiso firmado desde el panel. */
  @Get('vista-previa')
  @Header('Cache-Control', 'private, no-store')
  vistaPrevia(@Req() req: Request): Promise<ContenidoPublico> {
    // La clave se lee en cada pedido; con la clave vacía cualquier firma sería válida.
    const secreto = config.vistaPreviaSecreto;
    if (!secreto) throw new ServiceUnavailableException({ mensaje: 'La vista previa no está configurada.' });
    const permiso = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!permiso || !verificarPermiso(permiso, secreto)) {
      throw new UnauthorizedException({ mensaje: 'El permiso de vista previa no es válido o venció. Abrila de nuevo desde el panel.' });
    }
    return this.contenido.conBorradores();
  }
}
