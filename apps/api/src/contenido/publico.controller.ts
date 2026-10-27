import { Controller, Get, Header } from '@nestjs/common';
import type { ContenidoPublico } from '@ccvida/shared';
import { ContenidoService } from './contenido.service.js';

@Controller('contenido')
export class ContenidoPublicoController {
  constructor(private readonly contenido: ContenidoService) {}

  /** Lo que muestra la web. Spec: lo publicado en el panel aparece en menos de 1 minuto. */
  @Get()
  @Header('Cache-Control', 'public, max-age=20, s-maxage=20')
  publico(): Promise<ContenidoPublico> {
    return this.contenido.publico();
  }
}
