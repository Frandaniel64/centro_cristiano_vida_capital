import { Module } from '@nestjs/common';
import { Almacen } from '../medios/almacen.js';
import { MediosController } from '../medios/medios.controller.js';
import { ContenidoService } from './contenido.service.js';
import { EventosController } from './eventos.controller.js';
import { MinisteriosController } from './ministerios.controller.js';
import { ContenidoPublicoController } from './publico.controller.js';
import { PredicasController, SeriesController } from './predicas.controller.js';
import { TextosController } from './textos.controller.js';
import { VistaPreviaController } from './vista-previa.controller.js';

@Module({
  controllers: [ContenidoPublicoController, MediosController, MinisteriosController, EventosController, PredicasController, SeriesController, TextosController, VistaPreviaController],
  providers: [ContenidoService, Almacen],
  exports: [ContenidoService],
})
export class ContenidoModule {}
