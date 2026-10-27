import { Module } from '@nestjs/common';
import { ProTemploController } from './pro-templo.controller.js';
import { ProTemploService } from './pro-templo.service.js';

@Module({
  controllers: [ProTemploController],
  providers: [ProTemploService],
  exports: [ProTemploService],
})
export class ProTemploModule {}
