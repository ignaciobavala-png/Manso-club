import { Escribe, type Trozo } from './Escribe';

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
 * Se escribe solo al entrar en pantalla (`Escribe`), en no más de 3,5 s.
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
      <Escribe parrafos={parrafos} claseParrafo="mb-[1.1em] last:mb-0 whitespace-pre-line" ritmo={18} maximo={3500} retraso={350} />
    </div>
  );
}
