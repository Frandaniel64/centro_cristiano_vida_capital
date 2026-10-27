import { Injectable } from '@nestjs/common';
import type { EstadoContenido } from '@ccvida/shared';
import { ErrorDeFormulario } from '../comun/validacion.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ContenidoService {
  // Cuándo cambió el contenido por última vez: la web lo usa para saber si
  // tiene que volver a pedir (etapa 3).
  private ultimoCambio = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  cambio() {
    this.ultimoCambio = Date.now();
  }

  version() {
    return this.ultimoCambio;
  }

  /** La foto tiene que existir; para publicar, además, tener texto alternativo. */
  async validarFoto(fotoId: string | null | undefined, estado: EstadoContenido) {
    if (!fotoId) return;
    const foto = await this.prisma.medio.findUnique({ where: { id: fotoId }, select: { textoAlternativo: true } });
    if (!foto) throw new ErrorDeFormulario({ fotoId: 'Esa foto ya no existe. Elegí otra.' });
    if (estado === 'publicado' && !foto.textoAlternativo.trim()) {
      throw new ErrorDeFormulario({ fotoId: 'La foto necesita texto alternativo antes de publicar.' });
    }
  }
}
