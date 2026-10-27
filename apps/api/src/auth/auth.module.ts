import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SesionGuard } from './sesion.guard.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SesionGuard],
  exports: [AuthService, SesionGuard],
})
export class AuthModule {}
