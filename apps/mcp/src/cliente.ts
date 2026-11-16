import { rutaEnv, type ConfigMcp } from './config.js';

/** Error cuyo mensaje se muestra tal cual a quien usa la herramienta. */
export class ErrorHerramienta extends Error {
  constructor(
    mensaje: string,
    readonly estado?: number,
  ) {
    super(mensaje);
    this.name = 'ErrorHerramienta';
  }
}

interface CuerpoError {
  mensaje?: string;
  campos?: Record<string, string>;
}

function mensajeDeError(estado: number, cuerpo: CuerpoError | null): string {
  if (!cuerpo?.mensaje) return `La API respondió con un error (${estado}).`;
  const lineas = Object.entries(cuerpo.campos ?? {}).map(([campo, texto]) => `- ${campo}: ${texto}`);
  return [cuerpo.mensaje, ...lineas].join('\n');
}

export class ClienteApi {
  constructor(
    private readonly cfg: ConfigMcp,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  get<T>(ruta: string): Promise<T> {
    return this.pedir<T>('GET', ruta);
  }

  post<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.pedir<T>('POST', ruta, JSON.stringify(cuerpo), true);
  }

  put<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.pedir<T>('PUT', ruta, JSON.stringify(cuerpo), true);
  }

  subir<T>(ruta: string, form: FormData): Promise<T> {
    return this.pedir<T>('POST', ruta, form);
  }

  private async pedir<T>(metodo: string, ruta: string, cuerpo?: BodyInit, json = false): Promise<T> {
    if (!this.cfg.token) {
      throw new ErrorHerramienta(
        `Falta el token del MCP: corré npm run crear-token-mcp -w @ccvida/api y guardalo en ${rutaEnv()}`,
      );
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${this.cfg.token}` };
    if (json) headers['Content-Type'] = 'application/json';

    let res: Response;
    try {
      res = await this.fetchFn(`${this.cfg.apiUrl}${ruta}`, { method: metodo, headers, body: cuerpo });
    } catch {
      throw new ErrorHerramienta(`No se pudo conectar con la API en ${this.cfg.apiUrl}.`);
    }

    if (res.status === 401) {
      throw new ErrorHerramienta(
        `El token del MCP venció o no es válido: generá uno nuevo con npm run crear-token-mcp -w @ccvida/api y guardalo en ${rutaEnv()}.`,
        401,
      );
    }
    if (!res.ok) {
      const cuerpoError = (await res.json().catch(() => null)) as CuerpoError | null;
      throw new ErrorHerramienta(mensajeDeError(res.status, cuerpoError), res.status);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}
