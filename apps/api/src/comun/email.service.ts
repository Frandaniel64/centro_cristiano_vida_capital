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
    await this.mandar(para, asunto, html, opciones);
  }

  /** Como `enviar`, pero devuelve qué pasó: lo usa el mail de prueba del panel para mostrar el error de Resend. */
  async mandar(para: string, asunto: string, html: string, opciones: { responderA?: string } = {}): Promise<ResultadoEnvio> {
    const a = lista(para);
    if (a.length === 0) return { estado: 'sin-destinatario' };
    const responderA = lista(opciones.responderA ?? '');
    if (!this.resend) {
      this.log.log(`[sin Resend] Email a ${a.join(', ')}: ${asunto}`);
      return { estado: 'sin-resend' };
    }
    try {
      const { error } = await this.resend.emails.send({
        from: config.emailDe,
        to: a,
        subject: asunto,
        html,
        ...(responderA.length ? { replyTo: responderA } : {}),
      });
      if (error) {
        this.log.error(`Resend rechazó el email a ${a.join(', ')}: ${error.message}`);
        return { estado: 'error', detalle: error.message };
      }
      return { estado: 'enviado' };
    } catch (e) {
      this.log.error(`No se pudo enviar el email a ${a.join(', ')}`, e as Error);
      return { estado: 'error', detalle: (e as Error).message };
    }
  }
}

export type ResultadoEnvio = { estado: 'enviado' | 'sin-resend' | 'sin-destinatario' } | { estado: 'error'; detalle: string };
