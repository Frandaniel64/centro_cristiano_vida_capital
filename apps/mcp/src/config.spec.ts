import { describe, expect, it } from 'vitest';
import { leerConfig } from './config.js';

const sinArchivo = () => {
  throw new Error('ENOENT');
};

describe('leerConfig', () => {
  it('sin archivo y sin env usa los valores por defecto', () => {
    expect(leerConfig({}, sinArchivo)).toEqual({ apiUrl: 'http://localhost:3000', token: null });
  });

  it('lee el archivo, ignorando comentarios y líneas vacías', () => {
    const archivo = '# comentario\n\nCCVIDA_API_URL=https://api.ejemplo.org\n  CCVIDA_MCP_TOKEN = abc123 \n';
    expect(leerConfig({}, () => archivo)).toEqual({ apiUrl: 'https://api.ejemplo.org', token: 'abc123' });
  });

  it('las variables de entorno pisan al archivo', () => {
    const archivo = 'CCVIDA_API_URL=https://archivo.org\nCCVIDA_MCP_TOKEN=delarchivo\n';
    const cfg = leerConfig({ CCVIDA_API_URL: 'https://env.org', CCVIDA_MCP_TOKEN: 'delenv' }, () => archivo);
    expect(cfg).toEqual({ apiUrl: 'https://env.org', token: 'delenv' });
  });

  it('quita la barra final de la URL', () => {
    expect(leerConfig({ CCVIDA_API_URL: 'https://x.org//' }, sinArchivo).apiUrl).toBe('https://x.org');
  });

  it('usa CCVIDA_MCP_ENV como ruta del archivo', () => {
    let pedida = '';
    leerConfig({ CCVIDA_MCP_ENV: 'D:\\otro.env' }, (r) => {
      pedida = r;
      return '';
    });
    expect(pedida).toBe('D:\\otro.env');
  });
});
