import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { ErrorApi } from '@ccvida/shared';
import { config } from '../config.js';

const RECHAZO: ErrorApi = {
  mensaje: 'No pudimos verificar el envío. Recargá la página y probá de nuevo.',
};

@Injectable()
export class AntiSpamService {
  private readonly log = new Logger(AntiSpamService.name);

  /** Rechaza el envío si el campo trampa llegó con valor o Turnstile no lo valida. */
  async verificar(datos: { sitioWeb?: string; turnstileToken?: string }, ip: string) {
    if (datos.sitioWeb) {
      this.log.warn(`Campo trampa completado desde ${ip}`);
      throw new BadRequestException(RECHAZO);
    }
    if (!config.turnstileSecreto) return;

    const cuerpo = new URLSearchParams({
      secret: config.turnstileSecreto,
      response: datos.turnstileToken ?? '',
      remoteip: ip,
    });
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: cuerpo });
      const resultado = (await res.json()) as { success: boolean };
      if (resultado.success) return;
    } catch (e) {
      this.log.error('No se pudo consultar Turnstile', e as Error);
    }
    throw new BadRequestException(RECHAZO);
  }
}
