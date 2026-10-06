import { Fragment } from 'react';

/**
 * Texto corrido de Visión y Locación, como en Basilar: párrafos normales con
 * algunas palabras en color. Ana lo escribe en el panel con una marca simple:
 *
 *   *chico y cuidado*      → color de resalte (oliva)
 *   **escuchar música**    → color de acento (terra)
 *
 * Un renglón en blanco separa párrafos. No es Markdown: no hay links ni
 * títulos, para que no se pueda romper el diseño desde el panel.
 */
export function TextoResaltado({ texto, className }: { texto: string; className?: string }) {
  const parrafos = texto
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {parrafos.map((parrafo, i) => (
        <p key={i} className="mb-[1.1em] last:mb-0 whitespace-pre-line">
          {parrafo.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((trozo, k) => {
            if (/^\*\*[^*]+\*\*$/.test(trozo)) {
              return (
                <span key={k} className="text-[var(--fest-acento)]">
                  {trozo.slice(2, -2)}
                </span>
              );
            }
            if (/^\*[^*]+\*$/.test(trozo)) {
              return (
                <span key={k} className="text-[var(--fest-resalte)]">
                  {trozo.slice(1, -1)}
                </span>
              );
            }
            return <Fragment key={k}>{trozo}</Fragment>;
          })}
        </p>
      ))}
    </div>
  );
}
