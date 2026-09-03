/**
 * Contenido de /mansocultural — la sección Cultura del panel.
 *
 * No cuelga de ninguna membresía: la card "Cultural Manso" de la grilla, cuando
 * exista, solo va a linkear a esta página.
 */

/** Encabezado de la página. Fila única (`id` = 1). */
export interface CulturaConfig {
  id: number;
  titulo: string;
  intro: string | null;
}

/** Banda horizontal a sangre: foto de fondo con el texto encima. */
export interface CulturaBanner {
  id: string;
  imagen_url: string;
  titulo: string | null;
  subtitulo: string | null;
  orden: number;
  activo: boolean;
}

/** Frase centrada con fotos desparramadas a los costados. */
export interface CulturaBloque {
  id: string;
  texto: string;
  foto_izquierda_url: string | null;
  foto_derecha_url: string | null;
  orden: number;
  activo: boolean;
}
