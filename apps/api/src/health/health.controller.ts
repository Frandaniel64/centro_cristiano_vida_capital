import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Liveness: lo usa el healthcheck de Docker/Coolify. No toca la base,
  // así una caída de Postgres no hace reiniciar la API en bucle.
  @Get()
  check() {
    return { status: 'ok' };
  }

  // Readiness: lo usa el monitor de caídas; avisa si la base no responde.
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'error' });
    }
  }
}
