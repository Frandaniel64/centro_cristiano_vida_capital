import type { ContactoTipo } from '@ccvida/shared';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

// Las mismas reglas que valida la web antes de enviar.
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

/** Valida `contacto` según el `contactoTipo` del mismo objeto. */
@ValidatorConstraint({ name: 'contacto' })
export class ContactoValido implements ValidatorConstraintInterface {
  // La instancia es compartida entre pedidos: el mensaje se recalcula con los
  // datos de cada uno en vez de guardarse.
  private mensaje(args: ValidationArguments) {
    const tipo = (args.object as { contactoTipo?: ContactoTipo }).contactoTipo ?? 'whatsapp';
    return errorContacto(tipo, typeof args.value === 'string' ? args.value : '');
  }

  validate(_valor: unknown, args: ValidationArguments) {
    return !this.mensaje(args);
  }

  defaultMessage(args: ValidationArguments) {
    return this.mensaje(args);
  }
}
