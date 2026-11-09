'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Los pasos que propone el asistente van al final, uno por renglón, como [[texto]]. */
const PASO = /^\s*\[\[(.+?)\]\]\s*$/;

export function separarPasos(texto: string): { cuerpo: string; pasos: string[] } {
  const lineas = texto.trimEnd().split('\n');
  const pasos: string[] = [];
  while (lineas.length && (PASO.test(lineas[lineas.length - 1]) || lineas[lineas.length - 1].trim() === '')) {
    const m = PASO.exec(lineas[lineas.length - 1]);
    if (m) pasos.unshift(m[1].trim());
    lineas.pop();
  }
  return { cuerpo: lineas.join('\n').trim(), pasos: pasos.slice(0, 3) };
}

const enlaceSeguro = (href?: string) => !!href && /^(https?:|mailto:)/i.test(href);

/** Respuesta del asistente con formato: negritas, listas, títulos chicos y tablas. Nunca HTML crudo. */
export function RespuestaIA({ texto }: { texto: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-manso-cream">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-manso-cream">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <h3 className="pt-1 text-[17px] font-black text-manso-cream">{children}</h3>,
          h2: ({ children }) => <h3 className="pt-1 text-[17px] font-black text-manso-cream">{children}</h3>,
          h3: ({ children }) => <h4 className="pt-1 text-[12px] font-black uppercase tracking-widest text-manso-cream/62">{children}</h4>,
          h4: ({ children }) => <h4 className="pt-1 text-[12px] font-black uppercase tracking-widest text-manso-cream/62">{children}</h4>,
          ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-5 marker:text-manso-cream/40">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-5 marker:text-manso-cream/50">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          hr: () => <hr className="border-manso-cream/10" />,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-manso-cream/20 pl-3 text-manso-cream/80">{children}</blockquote>,
          a: ({ href, children }) => enlaceSeguro(href)
            ? <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{children}</a>
            : <span>{children}</span>,
          code: ({ children }) => <code className="rounded bg-manso-cream/10 px-1 py-0.5 font-mono text-[13px]">{children}</code>,
          table: ({ children }) => <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-[14px]">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-manso-cream/20 px-2 py-1.5 text-[12px] font-black uppercase tracking-wider text-manso-cream/62">{children}</th>,
          td: ({ children }) => <td className="border-b border-manso-cream/10 px-2 py-1.5 align-top">{children}</td>,
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
