import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseAnon, createSupabaseServer } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { TallerCarousel } from '@/components/Home/TallerCarousel';
import { ContenidoDetalle } from '@/components/Home/ContenidoDetalle';
import { ShareButton } from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

type Nivel = 'publico' | 'registrado' | 'miembro';

const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};

interface AgendaItem {
  id: string;
  titulo: string;
  descripcion?: string;
  contenido_detalle?: string;
  slug: string;
  categoria?: string;
  duracion?: string;
  frecuencia?: string;
  precio?: number;
  cupos_maximos?: number;
  clases?: number;
  luma_url?: string;
  visibilidad: Nivel;
}

interface AgendaFoto {
  id: string;
  url: string;
  orden: number;
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getTaller(slug: string): Promise<AgendaItem | null> {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('agenda')
    .select('id, titulo, descripcion, contenido_detalle, slug, categoria, duracion, frecuencia, precio, cupos_maximos, clases, luma_url, visibilidad')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  return data;
}

async function getTallerFotos(agendaId: string): Promise<AgendaFoto[]> {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('agenda_fotos')
    .select('id, url, orden')
    .eq('agenda_id', agendaId)
    .order('orden', { ascending: true });

  return data || [];
}

export async function generateStaticParams() {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('agenda')
    .select('slug')
    .eq('activo', true)
    .not('slug', 'is', null);

  return (data || []).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const taller = await getTaller(slug);

  if (!taller) {
    return { title: 'Taller no encontrado | Manso Club' };
  }

  return {
    title: `${taller.titulo} | Manso Club`,
    description: taller.descripcion || `${taller.titulo} en Manso Club.`,
    openGraph: {
      title: `${taller.titulo} | Manso Club`,
      description: taller.descripcion || `${taller.titulo} en Manso Club.`,
      type: 'website',
    },
  };
}

export default async function TallerPage({ params }: Props) {
  const { slug } = await params;

  const supabaseServer = await createSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  let nivel: Nivel = 'publico';
  if (user) {
    const { data: profile } = await supabaseServer
      .from('user_profiles')
      .select('permisos_totales')
      .eq('id', user.id)
      .single();

    nivel = profile?.permisos_totales ? 'miembro' : 'registrado';
  }

  const taller = await getTaller(slug);
  if (!taller) notFound();

  const nivelesVisibles = NIVELES_VISIBLES[nivel];
  if (!nivelesVisibles.includes(taller.visibilidad)) notFound();

  const fotos = await getTallerFotos(taller.id);

  const precioLabel = !taller.precio || taller.precio === 0
    ? 'Gratis'
    : `$${taller.precio.toLocaleString('es-AR')}`;

  return (
    <main className="min-h-screen bg-manso-black">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-28 pb-4">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-2 text-manso-cream/60 hover:text-manso-cream transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Agenda</span>
        </Link>
      </div>

      {/* Carrusel */}
      {fotos.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <TallerCarousel fotos={fotos} />
        </div>
      )}

      <section className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-10 lg:gap-16">
          {/* Columna izquierda: fixed/sticky con la info clave */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            {taller.categoria && (
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
                {taller.categoria}
              </p>
            )}

            <h1 className="text-3xl md:text-5xl lg:text-5xl font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-6">
              {taller.titulo}
            </h1>

            {taller.descripcion && (
              <p className="text-sm md:text-base text-manso-cream/60 leading-relaxed font-light mb-8">
                {taller.descripcion}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-col gap-4 mb-8 pb-8 border-b border-manso-cream/10">
              {taller.frecuencia && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Frecuencia</p>
                  <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{taller.frecuencia}</p>
                </div>
              )}
              {taller.duracion && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Duración</p>
                  <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{taller.duracion}</p>
                </div>
              )}
              {taller.cupos_maximos ? (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Cupos</p>
                  <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{taller.cupos_maximos}</p>
                </div>
              ) : null}
              {taller.clases ? (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Clases</p>
                  <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{taller.clases}</p>
                </div>
              ) : null}
              <div>
                <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Precio</p>
                <p className="text-base font-black text-manso-cream">{precioLabel}</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/agenda/pagar?titulo=${encodeURIComponent(taller.titulo)}&precio=${taller.precio || 0}&frecuencia=${encodeURIComponent(taller.frecuencia || '')}&categoria=${encodeURIComponent(taller.categoria || '')}`}
                className="bg-manso-cream text-manso-black hover:bg-white px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Inscribirme
              </a>
              <ShareButton
                title={`${taller.titulo} | Manso Club`}
                text={taller.descripcion || `${taller.titulo} en Manso Club.`}
                url={`/agenda/${taller.slug}`}
              />
            </div>
          </div>

          {/* Columna derecha: contenido largo, se desplaza con el scroll de la página */}
          <div>
            {taller.contenido_detalle && (
              <ContenidoDetalle texto={taller.contenido_detalle} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
