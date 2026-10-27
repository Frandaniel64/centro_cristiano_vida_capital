import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ComunModule } from './comun/comun.module.js';
import { ContenidoModule } from './contenido/contenido.module.js';
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
    // Se aplica solo donde se usa IpThrottlerGuard; el ingreso al panel lo ajusta con @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60 * 60 * 1000, limit: 5 }]),
    AuthModule,
    ProTemploModule,
    VisitasModule,
    AdminModule,
    ContenidoModule,
  ],
  controllers: [HealthController, EnVivoController],
})
export class AppModule {}
