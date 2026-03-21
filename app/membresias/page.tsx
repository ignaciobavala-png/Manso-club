'use client';

import { useState, useEffect } from 'react';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { supabase } from '@/lib/supabase';
import { Membresia } from '@/lib/types/membresia';
import { Crown, Star } from 'lucide-react';
import Link from 'next/link';

export default function MembresiasPage() {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [galleryImages, setGalleryImages] = useState<{ id: string; src: string }[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchMembresias();
    fetchGallery();
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
        {/* Galería mosaico del cowork */}
        {galleryImages.length > 0 && (
          <div className="mb-16">
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
                    <span className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra">
                      {categoria}
                    </span>
                    <div className="flex-1 h-px bg-manso-cream/10" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {grupos[categoria].map((membresia) => (
                      <div
                        key={membresia.id}
                        className="border border-zinc-700 p-10 rounded-[40px] bg-zinc-800/50 hover:bg-zinc-700 hover:text-manso-cream transition-all group shadow-sm relative"
                      >
                        {membresia.destacado && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-manso-terra text-manso-cream rounded-full text-[8px] font-black uppercase tracking-widest">
                              <Star size={8} />
                              Más Popular
                            </span>
                          </div>
                        )}

                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-400 group-hover:text-manso-cream/80 text-center">
                          {membresia.nombre}
                        </h3>

                        <p className="text-4xl font-black italic mb-8 text-center uppercase tracking-tighter text-manso-cream">
                          ${membresia.precio.toLocaleString('es-AR')}
                          <span className="text-sm block font-normal not-italic tracking-normal text-manso-cream/60">
                            /{membresia.periodo}
                          </span>
                        </p>

                        {membresia.descripcion && (
                          <p className="text-[10px] text-manso-cream/60 text-center mb-6">
                            {membresia.descripcion}
                          </p>
                        )}

                        <div className="space-y-4 mb-10 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">
                          {membresia.membresia_beneficios?.map((beneficio) => (
                            <p key={beneficio.id} className="flex items-center justify-center gap-2">
                              {beneficio.incluido ? (
                                <span className="text-green-400">✓</span>
                              ) : (
                                <span className="text-red-400">✗</span>
                              )}
                              {beneficio.texto}
                            </p>
                          ))}
                        </div>

                        <Link
                          href={`/membresias/pagar?nombre=${encodeURIComponent(membresia.nombre)}&precio=${membresia.precio}&periodo=${encodeURIComponent(membresia.periodo)}`}
                          className="block w-full py-4 bg-manso-cream rounded-2xl uppercase text-[10px] font-black text-manso-black hover:bg-white transition-all text-center"
                        >
                          Suscribirme
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </AdaptiveSectionLayout>
    </div>
  );
}
