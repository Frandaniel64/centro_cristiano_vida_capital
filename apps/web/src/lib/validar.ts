/** Devuelve el mensaje de error del email, o '' si es válido. */
export function errorEmail(valor: string): string {
  const v = valor.trim();
  if (!v) return 'Escribí tu email.';
  if (v.length > 120 || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(v)) {
    return 'Revisá el email: le falta la @ o el dominio, por ejemplo nombre@gmail.com.';
  }
  return '';
}

/** El WhatsApp es opcional: vacío es válido; si viene, 10 a 15 dígitos. */
export function errorWhatsapp(valor: string): string {
  const v = valor.trim();
  if (!v) return '';
  const digitos = v.replace(/\D/g, '').length;
  if (digitos < 10 || digitos > 15) {
    return 'El número parece incompleto. Incluí el código de área, por ejemplo 11 5555 1234.';
  }
  return '';
}
