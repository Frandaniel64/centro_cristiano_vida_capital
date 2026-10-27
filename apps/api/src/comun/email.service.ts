import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { config } from '../config.js';

export const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Arma el HTML de un email simple con la marca. Los párrafos ya vienen escapados. */
export function plantilla(titulo: string, parrafos: string[]) {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5">${p}</p>`).join('');
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f5f5f0;font-family:Arial,sans-serif;color:#000">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
<h1 style="margin:0 0 20px;font-size:24px">${escapar(titulo)}</h1>${cuerpo}
<p style="margin:24px 0 0;font-size:13px;color:#555">Centro Cristiano Vida Capital · Camarones 2201, CABA</p>
</div></body></html>`;
}

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private readonly resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

  /** Envía sin frenar la respuesta: si falla, queda en el log y el formulario igual se guarda. */
  async enviar(para: string, asunto: string, html: string) {
    if (!para) return;
    if (!this.resend) {
      this.log.log(`[sin Resend] Email a ${para}: ${asunto}`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({ from: config.emailDe, to: para, subject: asunto, html });
      if (error) this.log.error(`Resend rechazó el email a ${para}: ${error.message}`);
    } catch (e) {
      this.log.error(`No se pudo enviar el email a ${para}`, e as Error);
    }
  }
}
