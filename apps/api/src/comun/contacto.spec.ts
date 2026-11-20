import { describe, expect, it } from 'vitest';
import { errorEmail } from './contacto.js';

describe('errorEmail', () => {
  it('acepta un email común', () => {
    expect(errorEmail('lucia@gmail.com')).toBe('');
  });

  it('rechaza coma y punto y coma: no se mandan emails a varias direcciones', () => {
    expect(errorEmail('a,b@x.com')).not.toBe('');
    expect(errorEmail('a@x.com,b@y.com')).not.toBe('');
    expect(errorEmail('a;b@x.com')).not.toBe('');
  });
});
