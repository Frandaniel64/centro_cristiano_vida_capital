import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ComunModule } from './comun/comun.module.js';
import { EnVivoController } from './en-vivo/en-vivo.controller.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProTemploModule } from './pro-templo/pro-templo.module.js';
import { VisitasModule } from './visitas/visitas.module.js';

@Module({
  imports: [
    PrismaModule,
    ComunModule,
    // Límite de los formularios (spec): 5 envíos por hora desde la misma conexión.
    // Se aplica solo donde se usa IpThrottlerGuard.
    ThrottlerModule.forRoot([{ ttl: 60 * 60 * 1000, limit: 5 }]),
    ProTemploModule,
    VisitasModule,
  ],
  controllers: [HealthController, EnVivoController],
})
export class AppModule {}
