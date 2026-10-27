import { base32, codigoTotp, generarSecretoTotp, hashClave, hashToken, nuevoToken, verificarClave, verificarTotp } from './cripto.js';

describe('contraseñas', () => {
  it('verifica la contraseña correcta y rechaza otra', async () => {
    const hash = await hashClave('una clave larga 123');
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verificarClave('una clave larga 123', hash)).toBe(true);
    expect(await verificarClave('otra clave', hash)).toBe(false);
  });

  it('dos hashes de la misma clave son distintos (sal aleatoria)', async () => {
    expect(await hashClave('x'.repeat(12))).not.toBe(await hashClave('x'.repeat(12)));
  });

  it('un hash mal formado no explota: devuelve false', async () => {
    expect(await verificarClave('lo que sea', 'basura')).toBe(false);
  });
});

describe('TOTP (RFC 6238, SHA-1)', () => {
  // Secreto del RFC: "12345678901234567890" en ASCII.
  const secreto = base32(Buffer.from('12345678901234567890'));

  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('a los %i segundos el código es %s', (segundos, esperado) => {
    expect(codigoTotp(secreto, segundos * 1000)).toBe(esperado);
  });

  it('acepta el código del intervalo anterior por desfase de reloj', () => {
    expect(verificarTotp(secreto, '287082', 59_000 + 30_000)).toBe(true);
  });

  it('rechaza un código viejo o mal formado', () => {
    expect(verificarTotp(secreto, '287082', 59_000 + 120_000)).toBe(false);
    expect(verificarTotp(secreto, '12345', 59_000)).toBe(false);
  });

  it('genera secretos base32 de 32 caracteres', () => {
    expect(generarSecretoTotp()).toMatch(/^[A-Z2-7]{32}$/);
  });
});

describe('tokens de sesión', () => {
  it('son aleatorios y se guardan solo como hash', () => {
    const a = nuevoToken();
    expect(a).not.toBe(nuevoToken());
    expect(hashToken(a)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
  });
});
