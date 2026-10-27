import { Body, Controller, HttpCode, Logger, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AntiSpamService } from '../comun/anti-spam.service.js';
import { EmailService, escapar, plantilla } from '../comun/email.service.js';
import { IpThrottlerGuard, ipDe } from '../comun/ip-throttler.guard.js';
import { config } from '../config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearVisitaDto } from './crear-visita.dto.js';

@Controller('visitas')
export class VisitasController {
  private readonly log = new Logger(VisitasController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpam: AntiSpamService,
    private readonly email: EmailService,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(IpThrottlerGuard)
  async crear(@Body() datos: CrearVisitaDto, @Req() req: Request) {
    await this.antiSpam.verificar(datos, ipDe(req));
    const visita = await this.prisma.visita.create({
      data: {
        nombre: datos.nombre,
        contactoTipo: datos.contactoTipo,
        contacto: datos.contacto,
        intereses: datos.intereses,
      },
    });
    this.log.log(`Visita nueva ${visita.id}`);

    void this.email.enviar(
      config.emailRecepcion,
      `Primera visita: ${datos.nombre}`,
      plantilla('Alguien avisó que viene el domingo', [
        `<strong>${escapar(datos.nombre)}</strong> completó el formulario de primera visita.`,
        `Contacto (${datos.contactoTipo}): ${escapar(datos.contacto)}`,
        datos.intereses.length ? `Le interesa: ${datos.intereses.map(escapar).join(', ')}` : 'No marcó intereses.',
      ]),
    );

    return { ok: true };
  }
}
