import { DURACION_PERMISO_MS, firmarPermiso, rutaInterna, verificarPermiso } from './vista-previa.js';

describe('permiso de vista previa', () => {
  it('un permiso vigente devuelve el usuario', () => {
    expect(verificarPermiso(firmarPermiso('u1', 's', 0), 's', 1000)).toEqual({ usuarioId: 'u1' });
  });

  it('un permiso vencido no sirve', () => {
    expect(verificarPermiso(firmarPermiso('u1', 's', 0), 's', DURACION_PERMISO_MS + 1)).toBeNull();
  });

  it('firmado con otra clave no sirve', () => {
    expect(verificarPermiso(firmarPermiso('u1', 's', 0), 'otra', 1000)).toBeNull();
  });

  it('con el payload alterado no sirve', () => {
    const permiso = firmarPermiso('u1', 's', 0);
    const alterado = (permiso[0] === 'a' ? 'b' : 'a') + permiso.slice(1);
    expect(verificarPermiso(alterado, 's', 1000)).toBeNull();
  });

  it('la basura devuelve null', () => {
    for (const basura of ['', 'abc', 'a.b.c']) expect(verificarPermiso(basura, 's', 1000)).toBeNull();
  });
});

describe('rutaInterna', () => {
  it('acepta rutas del propio sitio', () => {
    expect(rutaInterna('/')).toBe(true);
    expect(rutaInterna('/ministerios/vida-kids')).toBe(true);
  });

  it('rechaza lo que podría sacar al visitante del sitio', () => {
    for (const ruta of ['//evil.com', 'https://evil.com', 'ministerios', '/\\evil.com', '/' + 'a'.repeat(200), '/a\nb', 42]) {
      expect(rutaInterna(ruta)).toBe(false);
    }
  });
});
