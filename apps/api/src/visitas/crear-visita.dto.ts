import type { ContactoTipo, CrearVisita } from '@ccvida/shared';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, Equals, IsArray, IsIn, IsOptional, IsString, Length, MaxLength, Validate } from 'class-validator';
import { ContactoValido } from '../comun/contacto.js';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CrearVisitaDto implements CrearVisita {
  @Transform(recortar)
  @IsString()
  @Length(2, 100, { message: 'Escribí tu nombre para que sepamos a quién recibir.' })
  nombre!: string;

  @IsIn(['whatsapp', 'email'], { message: 'Elegí WhatsApp o email.' })
  contactoTipo!: ContactoTipo;

  @Transform(recortar)
  @Validate(ContactoValido)
  contacto!: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  intereses!: string[];

  @Equals(true, { message: 'Para guardar tus datos necesitamos que aceptes la política de privacidad.' })
  aceptaPrivacidad!: true;

  @IsOptional()
  @IsString()
  turnstileToken?: string;

  @IsOptional()
  @IsString()
  sitioWeb?: string;
}
