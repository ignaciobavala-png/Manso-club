'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Link2 } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { BOTON_GUARDAR, CARD, INPUT, TITULO, AYUDA } from './festivalComun';

/** La página no está linkeada en el sitio: este es el único lugar donde se saca el link. */
export const RUTA_VOLUNTARIOS = '/blur/voluntarios';

/**
 * Link privado de la convocatoria de voluntarios. La página sigue viva pero
 * sin menú, pie, home ni sitemap, y con `noindex`: solo entra quien recibe el
 * link de producción. Se copia o se abre desde acá.
 */
export function FestivalVoluntariosLink() {
  const [copiado, setCopiado] = useState(false);
  const url = `${SITE_URL}${RUTA_VOLUNTARIOS}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Sin permiso de portapapeles: se selecciona el campo para copiar a mano.
      const campo = document.getElementById('voluntarios-link') as HTMLInputElement | null;
      campo?.select();
      return;
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2">
        <Link2 size={14} className="text-manso-cream/60" />
        <h4 className={TITULO}>Link privado para voluntarios</h4>
      </div>
      <p className={AYUDA}>
        La convocatoria no aparece en el sitio público ni en buscadores. Mandá este link solo a quienes quieras que se postulen.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input id="voluntarios-link" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={INPUT} />
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={copiar} className={BOTON_GUARDAR}>
            {copiado ? <Check size={12} /> : <Copy size={12} />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
          <a href={RUTA_VOLUNTARIOS} target="_blank" rel="noopener noreferrer" className={BOTON_GUARDAR}>
            <ExternalLink size={12} />
            Abrir
          </a>
        </div>
      </div>
    </div>
  );
}
