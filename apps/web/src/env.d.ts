declare namespace App {
  interface Locals {
    /** Permiso firmado de la vista previa (cookie); si está, se muestran borradores. */
    vistaPrevia?: string;
    /** El permiso venció o no sirve: la página salió con contenido público y la cookie se borra. */
    vistaPreviaVencida?: boolean;
  }
}
