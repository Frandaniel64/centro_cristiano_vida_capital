import { Module } from '@nestjs/common';
import { ContenidoModule } from '../contenido/contenido.module.js';
import { ProTemploController } from './pro-templo.controller.js';
import { ProTemploService } from './pro-templo.service.js';

@Module({
  // ContenidoModule: la dirección del pie de los emails.
  imports: [ContenidoModule],
  controllers: [ProTemploController],
  providers: [ProTemploService],
  exports: [ProTemploService],
})
export class ProTemploModule {}
