import { Controller, Get, UseGuards } from '@nestjs/common';
import type { ResumenPanel } from '@ccvida/shared';
import type { SesionActual } from '../auth/auth.service.js';
import { Sesion, SesionGuard } from '../auth/sesion.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProTemploService } from '../pro-templo/pro-templo.service.js';
import { apodosPorRevisar, pendientesEnPlazo } from './filtros.js';

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('admin/resumen')
@UseGuards(SesionGuard)
export class ResumenController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proTemplo: ProTemploService,
  ) {}

  /** Inicio del panel: cada persona ve solo los bloques de su rol. */
  @Get()
  async resumen(@Sesion() s: SesionActual): Promise<ResumenPanel> {
    const rol = s.usuario.rol;
    const resumen: ResumenPanel = {};

    if (rol === 'administrador' || rol === 'tesoreria') {
      const campana = await this.prisma.campana.findUnique({ where: { slug: 'pro-templo' } });
      const [estado, pendientes, apodos] = await Promise.all([
        this.proTemplo.estado(),
        this.prisma.voucher.count({ where: pendientesEnPlazo(campana?.diasVencimiento ?? 30) }),
        this.prisma.voucher.count({ where: apodosPorRevisar }),
      ]);
      resumen.proTemplo = { ...estado, pendientes, apodosPorRevisar: apodos };
    }

    if (rol === 'administrador' || rol === 'recepcion') {
      const [nuevas, ultimaSemana] = await Promise.all([
        this.prisma.visita.count({ where: { estado: 'nueva' } }),
        this.prisma.visita.count({ where: { creado: { gte: new Date(Date.now() - SEMANA_MS) } } }),
      ]);
      resumen.visitas = { nuevas, ultimaSemana };
    }

    return resumen;
  }
}
