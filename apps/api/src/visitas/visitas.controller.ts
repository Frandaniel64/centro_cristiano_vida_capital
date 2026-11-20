import { Body, Controller, HttpCode, Logger, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AntiSpamService } from '../comun/anti-spam.service.js';
import { EmailService } from '../comun/email.service.js';
import { avisoRecepcion, bienvenidaVisita } from '../comun/emails/plantillas.js';
import { IpThrottlerGuard, ipDe } from '../comun/ip-throttler.guard.js';
import { config } from '../config.js';
import { ContenidoService } from '../contenido/contenido.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearVisitaDto } from './crear-visita.dto.js';

@Controller('visitas')
export class VisitasController {
  private readonly log = new Logger(VisitasController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpam: AntiSpamService,
    private readonly email: EmailService,
    private readonly contenido: ContenidoService,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(IpThrottlerGuard)
  async crear(@Body() datos: CrearVisitaDto, @Req() req: Request) {
    await this.antiSpam.verificar(datos, ipDe(req));
    const visita = await this.prisma.visita.create({
      data: {
        nombre: datos.nombre,
        // El email es el contacto principal; el WhatsApp, opcional, va aparte.
        contactoTipo: 'email',
        contacto: datos.email,
        whatsapp: datos.whatsapp || null,
        intereses: datos.intereses,
      },
    });
    this.log.log(`Visita nueva ${visita.id}`);
    void this.avisar(datos);
    return { ok: true };
  }

  // Los emails salen en segundo plano: la visita ya quedó guardada.
  private async avisar(datos: CrearVisitaDto) {
    try {
      const textos = await this.contenido.textos();
      const bienvenida = bienvenidaVisita({
        nombre: datos.nombre,
        reunion: textos.reunion,
        direccion: textos.direccion,
        barrio: textos.barrio,
        mapaUrl: textos.mapaUrl,
        versiculo: textos.versiculoBienvenida,
        sitioUrl: config.sitioUrl,
      });
      void this.email.enviar(datos.email, bienvenida.asunto, bienvenida.html);

      // Las direcciones de recepción se leen en cada envío. Vacío: sin aviso.
      const recepcion = config.emailRecepcion.trim();
      if (recepcion) {
        const aviso = avisoRecepcion({
          nombre: datos.nombre,
          email: datos.email,
          whatsapp: datos.whatsapp || null,
          intereses: datos.intereses,
          panelUrl: config.panelUrl,
          sitioUrl: config.sitioUrl,
        });
        void this.email.enviar(recepcion, aviso.asunto, aviso.html);
      }
    } catch (e) {
      this.log.error('No se pudieron armar los emails de la visita', e as Error);
    }
  }
}
