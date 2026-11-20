import { Module } from '@nestjs/common';
import { ContenidoModule } from '../contenido/contenido.module.js';
import { VisitasController } from './visitas.controller.js';

@Module({
  // ContenidoModule: la dirección, el horario y el versículo del email de bienvenida.
  imports: [ContenidoModule],
  controllers: [VisitasController],
})
export class VisitasModule {}
