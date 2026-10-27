import { Module } from '@nestjs/common';
import { ProTemploModule } from '../pro-templo/pro-templo.module.js';
import { ProTemploAdminController } from './pro-templo-admin.controller.js';
import { ResumenController } from './resumen.controller.js';
import { UsuariosController } from './usuarios.controller.js';
import { VisitasAdminController } from './visitas-admin.controller.js';

@Module({
  imports: [ProTemploModule],
  controllers: [ResumenController, ProTemploAdminController, VisitasAdminController, UsuariosController],
})
export class AdminModule {}
