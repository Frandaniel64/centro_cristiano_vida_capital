import { Module } from '@nestjs/common';
import { ContenidoModule } from '../contenido/contenido.module.js';
import { ProTemploModule } from '../pro-templo/pro-templo.module.js';
import { ProTemploAdminController } from './pro-templo-admin.controller.js';
import { ResumenController } from './resumen.controller.js';
import { UsuariosController } from './usuarios.controller.js';
import { VisitasAdminController } from './visitas-admin.controller.js';

@Module({
  imports: [ProTemploModule, ContenidoModule],
  controllers: [ResumenController, ProTemploAdminController, VisitasAdminController, UsuariosController],
})
export class AdminModule {}
