/**
 * Datos estructurados para Google y los asistentes de IA. Escapa `<` porque
 * parte del contenido viene de la DB (bios, descripciones): un `</script>` en
 * una bio cerraría el tag y lo que siga se ejecutaría en la página.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c'),
      }}
    />
  );
}
