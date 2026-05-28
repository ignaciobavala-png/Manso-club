import { createSupabaseServer } from '@/lib/supabase';
import { redirect, notFound } from 'next/navigation';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import Link from 'next/link';
import { ArrowLeft, Lock, Play, Clock, Wifi } from 'lucide-react';

export default async function StreamingPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?from=/streaming/${slug}`);

  // Fetch el contenido
  const { data: contenido } = await supabase
    .from('streaming_contenido')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  if (!contenido) notFound();

  // Verificar acceso vía función DB
  const { data: tieneAcceso } = await supabase.rpc('user_tiene_acceso_streaming', {
    p_contenido_id: contenido.id,
  });

  const TIPO_LABEL: Record<string, string> = {
    concierto: 'Concierto',
    curso: 'Curso',
    taller: 'Taller',
  };

  return (
    <div className="relative min-h-screen bg-manso-black pt-24 pb-16">
      <ParticleBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-6">

        {/* Volver */}
        <Link
          href="/streaming"
          className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-cream transition-colors mb-8"
        >
          <ArrowLeft size={12} />
          Volver a la biblioteca
        </Link>

        {/* Badges */}
        <div className="flex gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
            contenido.tipo === 'concierto' ? 'bg-manso-blue text-manso-cream' :
            contenido.tipo === 'curso' ? 'bg-manso-olive text-white' :
            'bg-manso-brown text-manso-cream'
          }`}>
            {TIPO_LABEL[contenido.tipo] ?? contenido.tipo}
          </span>
          {contenido.is_live && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-[8px] font-black uppercase tracking-widest">
              <Wifi size={8} />
              En vivo
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-2">
          {contenido.titulo}
        </h1>

        {contenido.duracion_minutos && (
          <p className="flex items-center gap-1.5 text-[9px] text-manso-cream/30 uppercase tracking-widest mb-8">
            <Clock size={10} />
            {contenido.duracion_minutos} minutos
          </p>
        )}

        {/* Player o Paywall */}
        {tieneAcceso ? (
          <div className="w-full aspect-video rounded-[20px] overflow-hidden bg-black mb-8 shadow-2xl">
            {contenido.youtube_video_id ? (
              <iframe
                src={`https://www.youtube.com/embed/${contenido.youtube_video_id}?rel=0&modestbranding=1`}
                title={contenido.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                <Play size={48} className="text-manso-cream/20 mb-4" />
                <p className="text-manso-cream/30 text-sm uppercase tracking-widest font-black">
                  Video próximamente disponible
                </p>
              </div>
            )}
          </div>
        ) : (
          // Paywall
          <div className="w-full aspect-video rounded-[20px] overflow-hidden relative mb-8">
            {/* Thumbnail difuminado */}
            {contenido.thumbnail_url ? (
              <img
                src={contenido.thumbnail_url}
                alt={contenido.titulo}
                className="w-full h-full object-cover blur-md scale-110"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-manso-black/70 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-full bg-manso-cream/10 flex items-center justify-center mb-6">
                <Lock size={28} className="text-manso-cream/60" />
              </div>
              <p className="text-manso-cream font-black text-xl uppercase tracking-tight mb-2">
                Contenido exclusivo
              </p>
              <p className="text-manso-cream/50 text-sm mb-8 max-w-sm">
                {contenido.precio_individual > 0
                  ? `Obtené acceso a este contenido por USD $${contenido.precio_individual}`
                  : 'Este contenido está disponible con una membresía activa'}
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Link
                  href="/membresias"
                  className="px-6 py-3 bg-manso-terra text-manso-cream rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all"
                >
                  Ver membresías
                </Link>
                {contenido.precio_individual > 0 && (
                  <Link
                    href={`/membresias/pagar?nombre=${encodeURIComponent(contenido.titulo)}&precio=${contenido.precio_individual}&periodo=acceso`}
                    className="px-6 py-3 border border-manso-cream/30 text-manso-cream rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream/10 transition-all"
                  >
                    Comprar acceso — USD ${contenido.precio_individual}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Descripción */}
        {contenido.descripcion && (
          <div className="max-w-2xl">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
              Descripción
            </p>
            <p className="text-manso-cream/60 leading-relaxed">
              {contenido.descripcion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
