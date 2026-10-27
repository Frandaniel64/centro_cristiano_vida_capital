import type { ContactoTipo, CrearVoucher, FormaPago, MostrarComo } from '@ccvida/shared';
import { Transform } from 'class-transformer';
import { Equals, IsIn, IsInt, IsOptional, IsString, Length, MaxLength, Min, Validate, ValidateIf } from 'class-validator';
import { ContactoValido } from '../comun/contacto.js';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CrearVoucherDto implements CrearVoucher {
  // El máximo depende de la campaña y se controla en el servicio.
  @IsInt({ message: 'Elegí un monto en dólares, sin centavos.' })
  @Min(1, { message: 'El monto mínimo es USD 1.' })
  montoUsd!: number;

  @Transform(recortar)
  @IsString()
  @Length(2, 100, { message: 'Escribí tu nombre y apellido.' })
  nombre!: string;

  @IsIn(['nombre', 'apodo', 'anonimo'], { message: 'Elegí cómo querés aparecer.' })
  mostrarComo!: MostrarComo;

  @ValidateIf((o: CrearVoucherDto) => o.mostrarComo === 'apodo')
  @Transform(recortar)
  @IsString()
  @Length(1, 60, { message: 'Escribí cómo querés aparecer (hasta 60 letras).' })
  apodo?: string;

  @IsIn(['whatsapp', 'email'], { message: 'Elegí WhatsApp o email.' })
  contactoTipo!: ContactoTipo;

  @Transform(recortar)
  @Validate(ContactoValido)
  contacto!: string;

  @IsIn(['efectivo', 'transferencia', 'mercadopago'], { message: 'Elegí cómo lo vas a pagar.' })
  formaPago!: FormaPago;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(500, { message: 'El mensaje puede tener hasta 500 letras.' })
  mensaje?: string;

  @Equals(true, { message: 'Para registrar tu voucher necesitamos que aceptes la política de privacidad.' })
  aceptaPrivacidad!: true;

  @IsOptional()
  @IsString()
  turnstileToken?: string;

  @IsOptional()
  @IsString()
  sitioWeb?: string;
}
