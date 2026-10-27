import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;
const LARGO_HASH = 64;

// ── Contraseñas: scrypt con sal aleatoria, guardado como "scrypt$sal$hash". ──

export async function hashClave(clave: string) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(clave, sal, LARGO_HASH);
  return `scrypt$${sal.toString('base64')}$${hash.toString('base64')}`;
}

export async function verificarClave(clave: string, guardado: string) {
  const [algoritmo, sal, hash] = guardado.split('$');
  if (algoritmo !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64');
  const calculado = await scryptAsync(clave, Buffer.from(sal, 'base64'), esperado.length);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

// ── Tokens de sesión: la cookie lleva el token; la base, solo su hash. ──

export const nuevoToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// ── TOTP (RFC 6238): códigos de 6 dígitos cada 30 s, como Google Authenticator. ──

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PASO_MS = 30_000;

export function base32(datos: Buffer) {
  let bits = 0;
  let valor = 0;
  let salida = '';
  for (const byte of datos) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      salida += ALFABETO[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) salida += ALFABETO[(valor << (5 - bits)) & 31];
  return salida;
}

function desdeBase32(texto: string) {
  let bits = 0;
  let valor = 0;
  const bytes: number[] = [];
  for (const letra of texto.replace(/=+$/, '').toUpperCase()) {
    valor = (valor << 5) | ALFABETO.indexOf(letra);
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export const generarSecretoTotp = () => base32(randomBytes(20));

export function codigoTotp(secreto: string, ahora = Date.now()) {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(ahora / PASO_MS)));
  const hmac = createHmac('sha1', desdeBase32(secreto)).update(contador).digest();
  const desplazamiento = hmac[hmac.length - 1] & 0xf;
  const numero = (hmac.readUInt32BE(desplazamiento) & 0x7fffffff) % 1_000_000;
  return String(numero).padStart(6, '0');
}

/** Acepta el intervalo actual y el anterior/siguiente, por diferencias de reloj. */
export function verificarTotp(secreto: string, codigo: string, ahora = Date.now()) {
  if (!/^\d{6}$/.test(codigo)) return false;
  return [-1, 0, 1].some((d) => {
    const esperado = codigoTotp(secreto, ahora + d * PASO_MS);
    return timingSafeEqual(Buffer.from(esperado), Buffer.from(codigo));
  });
}

export const urlTotp = (secreto: string, email: string) =>
  `otpauth://totp/${encodeURIComponent(`CCVida Capital:${email}`)}?secret=${secreto}&issuer=${encodeURIComponent('CCVida Capital')}`;
