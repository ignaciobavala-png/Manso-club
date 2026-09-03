import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseAnon } from '@/lib/supabase';
import { Membresia } from '@/lib/types/membresia';
import { fondoAcento } from '@/lib/membresia-color';
import { MembresiaDetalleCTA } from './MembresiaDetalleCTA';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

const getMembresia = async (slug: string) => {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('membresias')
    .select('*, membresia_beneficios (id, texto, incluido, orden)')
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle();

  return (data as Membresia | null) ?? null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const membresia = await getMembresia(slug);
  if (!membresia) return { title: 'Membresía | Manso Club' };

  const descripcion =
    membresia.descripcion_corta?.trim() || membresia.descripcion?.trim() || undefined;

  return {
    title: `${membresia.nombre} | Manso Club`,
    description: descripcion,
    openGraph: { title: `${membresia.nombre} | Manso Club`, description: descripcion },
  };
}

/**
 * Detalle de un plan — refe somoseito.io/pass/x5: pantalla de color pleno, el
 * nombre enorme a la izquierda, la descripción larga a la derecha, y abajo el
 * bloque INCLUYE como filas separadas por líneas finas.
 */
export default async function MembresiaDetallePage({ params }: Props) {
  const { slug } = await params;
  const membresia = await getMembresia(slug);
  if (!membresia) notFound();

  const descripcion =
    membresia.descripcion_completa?.trim() ||
    membresia.descripcion_corta?.trim() ||
    membresia.descripcion?.trim();

  // Los beneficios tachados de la card no tienen sentido acá: el bloque se
  // titula INCLUYE, así que solo entran los incluidos.
  const beneficios = (membresia.membresia_beneficios || [])
    .filter(b => b.incluido && b.texto?.trim())
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return (
    <main className={`min-h-screen ${fondoAcento(membresia.color_acento)} text-manso-cream`}>
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-16">
        <Link
          href="/membresias"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-manso-cream/70 hover:text-manso-cream transition-colors"
        >
          <ArrowLeft size={14} />
          Membresías
        </Link>

        <div className="mt-10 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          <h1 className="font-montreal font-black tracking-[-0.04em] leading-[0.9] text-5xl sm:text-6xl md:text-7xl break-words">
            {membresia.nombre}
          </h1>

          {descripcion && (
            <div className="space-y-4 md:pt-3">
              {descripcion.split(/\n\n+/).map((p, i) => (
                <p key={i} className="text-sm md:text-base leading-relaxed text-manso-cream/90 whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>

        {beneficios.length > 0 && (
          <div className="mt-16 md:mt-24">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-manso-cream/70">
              Incluye:
            </span>
            <ul className="mt-4">
              {beneficios.map(beneficio => (
                <li
                  key={beneficio.id}
                  className="border-b border-manso-cream/30 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-manso-cream/90"
                >
                  {beneficio.texto}
                </li>
              ))}
            </ul>
          </div>
        )}

        <MembresiaDetalleCTA
          membresiaId={membresia.id}
          membresiaNombre={membresia.nombre}
          precio={membresia.precio}
          periodo={membresia.periodo}
        />
      </div>
    </main>
  );
}
