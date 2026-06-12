'use client';

import { useState, useEffect } from 'react';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { supabase } from '@/lib/supabase';
import { Membresia } from '@/lib/types/membresia';
import { Crown, Star } from 'lucide-react';
import Link from 'next/link';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { useCurrency } from '@/store/useCurrency';

export default function MembresiasPage() {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [galleryImages, setGalleryImages] = useState<{ id: string; src: string }[]>([]);
  const [textoIntro, setTextoIntro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currency, rate } = useCurrency();

  useEffect(() => {
    const fetchMembresias = async () => {
      const { data, error } = await supabase
        .from('membresias')
        .select(`
          *,
          membresia_beneficios (
            id,
            texto,
            incluido
          )
        `)
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (error) {
        console.error('Error fetching membresías:', error);
        setMembresias([]);
      } else {
        setMembresias(data || []);
      }
      setLoading(false);
    };

    const fetchTextoIntro = async () => {
      const { data } = await supabase
        .from('membresias_config')
        .select('texto_intro')
        .single();
      setTextoIntro(data?.texto_intro || '');
    };

    fetchMembresias();
    fetchGallery();
    fetchTextoIntro();
  }, []);

  const fetchGallery = async () => {
    const { data } = await supabase
      .from('membresias_gallery')
      .select('id, photo_url')
      .eq('active', true)
      .order('order_index', { ascending: true });
    setGalleryImages((data || []).map(img => ({ id: img.id, src: img.photo_url })));
  };

  return (
    <div className="relative min-h-screen bg-manso-black">
      {/* Canvas de partículas — siempre montado, no se ve afectado por cambios de estado */}
      <ParticleBackground />

      <AdaptiveSectionLayout
        title="Membresías"
        subtitle="Acceso exclusivo_"
        customBg="bg-transparent"
      >
        {/* Párrafo de gancho */}
        {textoIntro === null ? null : textoIntro.trim() ? (
          <div className="mb-16 max-w-2xl space-y-4">
            {textoIntro.trim().split(/\n\n+/).map((p, i) => (
              <p key={i} className="text-manso-cream/80 text-base sm:text-lg leading-relaxed text-pretty">
                {p.replace(/\s(\S+)$/, ' $1')}
              </p>
            ))}
          </div>
        ) : (
          <div className="mb-16 max-w-2xl space-y-4" aria-hidden="true">
            {[
              ['w-full', 'w-11/12', 'w-4/5'],
              ['w-full', 'w-full', 'w-10/12', 'w-3/4'],
              ['w-9/12', 'w-full'],
            ].map((lineas, pi) => (
              <div key={pi} className="space-y-2">
                {lineas.map((w, li) => (
                  <div key={li} className={`${w} h-[1.1em] rounded-sm bg-manso-cream/10`} />
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-start mb-8">
          <CurrencyToggle />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
          </div>
        ) : membresias.length === 0 ? (
          <div className="text-center py-20">
            <Crown size={48} className="text-manso-cream/20 mx-auto mb-4" />
            <p className="text-sm text-manso-cream/40">Próximamente disponibles</p>
          </div>
        ) : (() => {
          // Agrupar por categoría manteniendo el orden: Cowork primero, resto después
          const ORDEN_CATEGORIAS = ['Cowork', 'Socios & Residentes'];
          const grupos = membresias.reduce<Record<string, typeof membresias>>((acc, m) => {
            const cat = m.categoria || 'Cowork';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(m);
            return acc;
          }, {});
          const categoriasOrdenadas = [
            ...ORDEN_CATEGORIAS.filter(c => grupos[c]),
            ...Object.keys(grupos).filter(c => !ORDEN_CATEGORIAS.includes(c)),
          ];

          return (
            <div className="py-10 space-y-20">
              {categoriasOrdenadas.map((categoria) => (
                <div key={categoria}>
                  {/* Encabezado de categoría */}
                  <div className="flex items-center gap-4 mb-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-cream/50">
                      {categoria}
                    </span>
                    <div className="flex-1 h-px bg-manso-cream/10" />
                  </div>

                  <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                    {grupos[categoria].map((membresia) => (
                      <div
                        key={membresia.id}
                        className={`group flex flex-col w-full max-w-[360px] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 transition-all duration-700 ease-out hover:scale-[1.02] cursor-pointer relative ${
                          membresia.destacado
                            ? 'bg-black text-white border-black hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]'
                            : 'bg-zinc-100 border-2 border-zinc-200 hover:border-manso-black/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]'
                        }`}
                      >
                        {membresia.destacado && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-white text-black">
                              <Star size={8} />
                              Más Popular
                            </span>
                          </div>
                        )}

                        <div className="mb-3">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                            membresia.destacado ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {membresia.nombre}
                          </h3>
                          <div className="text-center">
                            <div className={`flex items-baseline justify-center gap-2 ${
                              membresia.destacado ? 'text-white' : 'text-gray-900'
                            }`}>
                              <span className={`text-[10px] font-bold uppercase ${
                                membresia.destacado ? 'text-gray-400' : 'text-gray-500'
                              }`}>{currency}</span>
                              <span className="text-4xl sm:text-5xl font-black leading-none">
                                {currency === 'ARS' && rate
                                  ? Math.round(membresia.precio * rate).toLocaleString('es-AR')
                                  : membresia.precio.toLocaleString('es-AR')}
                              </span>
                              <span className={`text-[10px] font-bold uppercase ${
                                membresia.destacado ? 'text-gray-400' : 'text-gray-500'
                              }`}>/{membresia.periodo}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {membresia.membresia_beneficios?.filter(b => b.texto?.trim()).map((beneficio) => (
                            <div key={beneficio.id} className="flex items-start gap-2">
                              {beneficio.incluido ? (
                                <span className={`text-sm shrink-0 mt-0.5 ${membresia.destacado ? 'text-green-400' : 'text-green-600'}`}>✓</span>
                              ) : (
                                <span className={`text-sm shrink-0 mt-0.5 ${membresia.destacado ? 'text-red-400' : 'text-red-500'}`}>✗</span>
                              )}
                              <span className={`text-sm leading-snug ${
                                !beneficio.incluido
                                  ? membresia.destacado ? 'text-gray-500 line-through' : 'text-gray-400 line-through'
                                  : membresia.destacado ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {beneficio.texto}
                              </span>
                            </div>
                          ))}
                        </div>

                        {membresia.descripcion && (
                          <p className={`text-sm font-medium leading-relaxed mb-4 ${
                            membresia.destacado ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {membresia.descripcion}
                          </p>
                        )}

                        <Link
                          href={`/membresias/pagar?nombre=${encodeURIComponent(membresia.nombre)}&precio=${membresia.precio}&periodo=${encodeURIComponent(membresia.periodo)}`}
                          className={`mt-auto flex items-center justify-center w-full px-4 min-h-[44px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ease-out active:scale-95 rounded-full text-center ${
                            membresia.destacado
                              ? 'bg-white text-black hover:bg-gray-100'
                              : 'bg-black text-white hover:bg-manso-black/80'
                          }`}
                        >
                          SELECCIONAR
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Galería mosaico del cowork — cierre visual */}
        {galleryImages.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra">
                El espacio
              </span>
              <div className="flex-1 h-px bg-manso-cream/10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                >
                  <img
                    src={image.src}
                    alt="Manso Club Cowork"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        )}
      </AdaptiveSectionLayout>
    </div>
  );
}
