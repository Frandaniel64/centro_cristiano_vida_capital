declare namespace App {
  interface Locals {
    /** Permiso firmado de la vista previa (cookie); si está, se muestran borradores. */
    vistaPrevia?: string;
    /** Contenido con borradores que trajo el middleware para este pedido. */
    contenidoVistaPrevia?: import('@ccvida/shared').ContenidoPublico;
  }
}
