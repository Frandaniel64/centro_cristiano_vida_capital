const COLORES = ['#0c74b8', '#8cc63f', '#f5d547', '#f5f5f0'];
const VACIO = '#1c1c1c';
export const TOTAL_LADRILLOS = 100;

/** Fondo de cada uno de los 100 ladrillos. El valor de un ladrillo es meta / 100. */
export function fondosLadrillos(recaudadoUsd: number, metaUsd: number): string[] {
  const valor = metaUsd / TOTAL_LADRILLOS;
  const total = Math.min(recaudadoUsd, metaUsd) / valor;
  const hechos = Math.floor(total);
  const parcial = Math.round((total - hechos) * 100);
  return Array.from({ length: TOTAL_LADRILLOS }, (_, i) => {
    const color = COLORES[(i * 7 + Math.floor(i / 20)) % 4];
    if (i < hechos) return color;
    if (i === hechos && parcial > 0) return `linear-gradient(to right, ${color} ${parcial}%, ${VACIO} ${parcial}%)`;
    return VACIO;
  });
}

export const colorAporte = (montoUsd: number | null) => COLORES[(montoUsd ?? 0) % 4];

export const descripcionPared = (ladrillos: number, recaudado: string, meta: string, porcentaje: number) =>
  `${ladrillos} de 100 ladrillos levantados: USD ${recaudado} de USD ${meta}, ${porcentaje} por ciento de la meta.`;
