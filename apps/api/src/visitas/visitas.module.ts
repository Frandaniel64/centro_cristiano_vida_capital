import { Module } from '@nestjs/common';
import { VisitasController } from './visitas.controller.js';

@Module({
  controllers: [VisitasController],
})
export class VisitasModule {}
