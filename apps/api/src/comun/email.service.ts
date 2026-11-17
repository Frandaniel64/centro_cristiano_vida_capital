import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { config } from '../config.js';

export const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Parte "a@x.com, b@x.com" en direcciones sueltas, sin vacíos. */
const lista = (texto: string) =>
  texto
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private readonly resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

  /**
   * Envía sin frenar la respuesta: si falla, queda en el log y el formulario igual se guarda.
   * `para` y `responderA` aceptan varias direcciones separadas por coma.
   */
  async enviar(para: string, asunto: string, html: string, opciones: { responderA?: string } = {}) {
    const a = lista(para);
    if (a.length === 0) return;
    const responderA = lista(opciones.responderA ?? '');
    if (!this.resend) {
      this.log.log(`[sin Resend] Email a ${a.join(', ')}: ${asunto}`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({
        from: config.emailDe,
        to: a,
        subject: asunto,
        html,
        ...(responderA.length ? { replyTo: responderA } : {}),
      });
      if (error) this.log.error(`Resend rechazó el email a ${a.join(', ')}: ${error.message}`);
    } catch (e) {
      this.log.error(`No se pudo enviar el email a ${a.join(', ')}`, e as Error);
    }
  }
}
