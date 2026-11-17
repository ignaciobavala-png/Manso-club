/**
 * Fotos que pasan en la card "Cultural Manso" al hacer hover (home y
 * /membresias). Salen de la propia página de Cultural —banners y fotos de los
 * bloques activos—, así que no hay nada nuevo para cargar en el panel.
 */
export function fotosCultural(
  banners: { imagen_url: string | null }[] | null,
  bloques: { foto_izquierda_url: string | null; foto_derecha_url: string | null }[] | null,
  max = 8,
): string[] {
  return Array.from(
    new Set(
      [
        ...(banners ?? []).map((b) => b.imagen_url),
        ...(bloques ?? []).flatMap((b) => [b.foto_izquierda_url, b.foto_derecha_url]),
      ].filter((u): u is string => !!u),
    ),
  ).slice(0, max);
}
