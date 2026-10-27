// Tipos compartidos entre la API, el sitio y el panel.

export type Rol = 'administrador' | 'editor' | 'tesoreria' | 'recepcion';

export type EstadoVoucher = 'pendiente' | 'confirmado' | 'anulado' | 'vencido';

export interface EstadoProTemplo {
  recaudadoUsd: number;
  metaUsd: number;
  porcentaje: number;
  ladrillos: number;
  personas: number;
  ultimosVouchers: { nombre: string; montoUsd: number | null }[];
}
