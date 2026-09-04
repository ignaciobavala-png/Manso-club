/**
 * Contenido de /nuestro-espacio — la sección "Nuestro espacio" del panel.
 *
 * Una sala por fila: el nombre va en la lista de la izquierda y la foto se
 * muestra al elegirla.
 */

/** Encabezado de la página. Fila única (`id` = 1). */
export interface EspacioConfig {
  id: number;
  titulo: string;
  intro: string | null;
}

/** Una sala del cowork. `imagen_url` en null = todavía sin foto cargada. */
export interface EspacioSala {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  orden: number;
  activo: boolean;
}
