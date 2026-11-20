import { Transform } from 'class-transformer';
import { IsOptional, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, Validate } from 'class-validator';

// Las mismas reglas que valida la web antes de enviar.
export function errorEmail(valor: unknown): string {
  const v = typeof valor === 'string' ? valor.trim() : '';
  if (!v) return 'Escribí tu email para que podamos escribirte.';
  if (v.length > 120) return 'El email puede tener hasta 120 letras.';
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(v)) {
    return 'Revisá el email: le falta la @ o el dominio, por ejemplo nombre@gmail.com.';
  }
  return '';
}

/** WhatsApp es opcional: vacío vale; si viene, con código de área. */
export function errorWhatsapp(valor: unknown): string {
  if (valor === undefined || valor === null || valor === '') return '';
  if (typeof valor !== 'string') return 'Escribí tu número de WhatsApp.';
  const digitos = valor.replace(/\D/g, '').length;
  if (digitos < 10 || digitos > 15 || valor.length > 40) {
    return 'El número parece incompleto. Incluí el código de área, por ejemplo 11 5555 1234.';
  }
  return '';
}

@ValidatorConstraint({ name: 'email' })
export class EmailValido implements ValidatorConstraintInterface {
  validate(valor: unknown) {
    return !errorEmail(valor);
  }
  defaultMessage(args: ValidationArguments) {
    return errorEmail(args.value);
  }
}

@ValidatorConstraint({ name: 'whatsapp' })
export class WhatsappValido implements ValidatorConstraintInterface {
  validate(valor: unknown) {
    return !errorWhatsapp(valor);
  }
  defaultMessage(args: ValidationArguments) {
    return errorWhatsapp(args.value);
  }
}

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
// Un WhatsApp vacío se guarda como ausente.
const recortarOVacio = ({ value }: { value: unknown }) => {
  const v = recortar({ value });
  return v === '' ? undefined : v;
};

/** Decoradores del email obligatorio de los formularios públicos. */
export const CampoEmail = (): PropertyDecorator => (destino, clave) => {
  Transform(recortar)(destino, clave);
  Validate(EmailValido)(destino, clave);
};

/** Decoradores del WhatsApp opcional de los formularios públicos. */
export const CampoWhatsapp = (): PropertyDecorator => (destino, clave) => {
  Transform(recortarOVacio)(destino, clave);
  IsOptional()(destino, clave);
  Validate(WhatsappValido)(destino, clave);
};
