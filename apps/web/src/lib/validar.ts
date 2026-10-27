import type { ContactoTipo } from '@ccvida/shared';

/** Devuelve el mensaje de error del contacto, o '' si es válido. */
export function errorContacto(tipo: ContactoTipo, valor: string): string {
  const v = valor.trim();
  if (tipo === 'whatsapp') {
    if (!v) return 'Escribí tu número de WhatsApp.';
    const digitos = v.replace(/\D/g, '').length;
    if (digitos < 8 || digitos > 13) {
      return 'El número parece incompleto. Incluí el código de área, por ejemplo 11 5555 1234.';
    }
    return '';
  }
  if (!v) return 'Escribí tu email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return 'Revisá el email: le falta la @ o el dominio, por ejemplo nombre@gmail.com.';
  }
  return '';
}
