import type { CrearVisita } from '@ccvida/shared';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, Equals, IsArray, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { CampoEmail, CampoWhatsapp } from '../comun/contacto.js';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CrearVisitaDto implements CrearVisita {
  @Transform(recortar)
  @IsString()
  @Length(2, 100, { message: 'Escribí tu nombre para que sepamos a quién recibir.' })
  nombre!: string;

  @CampoEmail()
  email!: string;

  @CampoWhatsapp()
  whatsapp?: string;

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
