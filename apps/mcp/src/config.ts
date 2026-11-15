import { readFileSync } from 'node:fs';

export const RUTA_ENV_POR_DEFECTO = String.raw`C:\Users\frand\.secrets\ccvida-mcp.env`;

export interface ConfigMcp {
  apiUrl: string;
  token: string | null;
}

type Env = Record<string, string | undefined>;

export function rutaEnv(env: Env = process.env): string {
  return env.CCVIDA_MCP_ENV || RUTA_ENV_POR_DEFECTO;
}

function parsear(texto: string): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const linea of texto.split(/\r?\n/)) {
    const l = linea.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 1) continue;
    salida[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
  return salida;
}

export function leerConfig(
  env: Env = process.env,
  leerArchivo: (ruta: string) => string = (r) => readFileSync(r, 'utf8'),
): ConfigMcp {
  let archivo: Record<string, string> = {};
  try {
    archivo = parsear(leerArchivo(rutaEnv(env)));
  } catch {
    // Sin archivo: alcanza con las variables de entorno.
  }
  const apiUrl = env.CCVIDA_API_URL || archivo.CCVIDA_API_URL || 'http://localhost:3000';
  const token = env.CCVIDA_MCP_TOKEN || archivo.CCVIDA_MCP_TOKEN || null;
  return { apiUrl: apiUrl.replace(/\/+$/, ''), token };
}
