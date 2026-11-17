import { Controller, Get, Header } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// v1: por horario. El culto es el domingo a las 11 h de Buenos Aires (UTC-3; de 10
// a 11 h es el compartir, que no se transmite) y la transmisión se considera en
// curso de 11 a 13 h, con margen porque el culto suele pasarse de las 12:30.
// En v1.1 se consulta YouTube.
const HORA_INICIO_UTC = 14;
const DURACION_MS = 2 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

export function proximaTransmision(ahora: number): number {
  const d = new Date(ahora);
  let inicio =
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), HORA_INICIO_UTC) + ((7 - d.getUTCDay()) % 7) * DIA_MS;
  if (ahora - inicio >= DURACION_MS) inicio += 7 * DIA_MS;
  return inicio;
}

@Controller('en-vivo')
export class EnVivoController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  async estado() {
    const ahora = Date.now();
    const inicio = proximaTransmision(ahora);
    const configuracion = await this.prisma.configuracion.findUnique({ where: { id: 1 }, select: { canalYoutube: true } });
    return {
      enVivo: ahora >= inicio && ahora < inicio + DURACION_MS,
      inicio: new Date(inicio).toISOString(),
      url: configuracion?.canalYoutube || null,
    };
  }
}
