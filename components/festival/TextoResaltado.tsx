import type { Trozo } from './Escribe';

/**
 * Texto corrido de Visión y Locación, como en Basilar: párrafos normales con
 * algunas palabras en color. Ana lo escribe en el panel con una marca simple:
 *
 *   *chico y cuidado*      → color de resalte (oliva)
 *   **escuchar música**    → color de acento (terra)
 *
 * Un renglón en blanco separa párrafos. No es Markdown: no hay links ni
 * títulos, para que no se pueda romper el diseño desde el panel.
 *
 * Sin animación: antes se escribía solo al entrar (`Escribe`) y el equipo
 * pidió que el párrafo aparezca entero.
 */
export function TextoResaltado({ texto, className }: { texto: string; className?: string }) {
  const parrafos: Trozo[][] = texto
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(parrafo =>
      parrafo
        .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
        .filter(Boolean)
        .map(trozo => {
          if (/^\*\*[^*]+\*\*$/.test(trozo)) return { texto: trozo.slice(2, -2), clase: 'text-[var(--fest-acento)]' };
          if (/^\*[^*]+\*$/.test(trozo)) return { texto: trozo.slice(1, -1), clase: 'text-[var(--fest-resalte)]' };
          return { texto: trozo };
        })
    );

  return (
    <div className={className}>
      {parrafos.map((trozos, i) => (
        <p key={i} className="mb-[1.1em] last:mb-0 whitespace-pre-line">
          {trozos.map((t, j) => (t.clase ? <span key={j} className={t.clase}>{t.texto}</span> : t.texto))}
        </p>
      ))}
    </div>
  );
}
