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

/**
 * Una sala del cowork.
 *
 * `imagenes` son hasta cuatro fotos que rotan en el mismo contenedor: el
 * carrusel muestra solo las que estén cargadas, así que el array crece a
 * medida que Ana las sube. `imagen_url` es la portada —siempre `imagenes[0]`—
 * y se mantiene por compatibilidad con lo que había cuando era una sola foto.
 */
export interface EspacioSala {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  imagenes: string[] | null;
  orden: number;
  activo: boolean;
}

/** Cuántas fotos por sala admite el panel (y el CHECK de la tabla). */
export const MAX_FOTOS_SALA = 4;

/** Las fotos cargadas de una sala, cayendo a la portada vieja si el array
 *  todavía no se llenó (filas anteriores a la migración multi-foto). */
export const fotosDeSala = (
  sala: Pick<EspacioSala, 'imagen_url' | 'imagenes'>
): string[] => {
  const lista = (sala.imagenes ?? []).filter(Boolean);
  if (lista.length > 0) return lista.slice(0, MAX_FOTOS_SALA);
  return sala.imagen_url ? [sala.imagen_url] : [];
};
