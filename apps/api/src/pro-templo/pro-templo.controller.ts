import { Body, Controller, Get, Header, HttpCode, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AntiSpamService } from '../comun/anti-spam.service.js';
import { IpThrottlerGuard, ipDe } from '../comun/ip-throttler.guard.js';
import { CrearVoucherDto } from './crear-voucher.dto.js';
import { ProTemploService } from './pro-templo.service.js';

@Controller()
export class ProTemploController {
  constructor(
    private readonly proTemplo: ProTemploService,
    private readonly antiSpam: AntiSpamService,
  ) {}

  // La web lo consulta cada 15 s; el CDN puede guardarlo 10 s.
  @Get('pro-templo/estado')
  @Header('Cache-Control', 'public, max-age=10, s-maxage=10')
  estado() {
    return this.proTemplo.estado();
  }

  @Post('vouchers')
  @HttpCode(201)
  @UseGuards(IpThrottlerGuard)
  async crear(@Body() datos: CrearVoucherDto, @Req() req: Request) {
    await this.antiSpam.verificar(datos, ipDe(req));
    return this.proTemplo.crearVoucher(datos);
  }

  @Get('vouchers/:numero')
  @Header('Cache-Control', 'no-store')
  consultar(@Param('numero', ParseIntPipe) numero: number) {
    return this.proTemplo.consultarVoucher(numero);
  }
}
