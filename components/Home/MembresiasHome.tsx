'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { Membresia, MembresiaBeneficio } from '@/lib/types/membresia';
import { TYPE } from '@/lib/ui-constants';

export const MembresiasHome = () => {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembresias();
  }, []);

  const fetchMembresias = async () => {
    const { data, error } = await supabase
      .from('membresias')
      .select(`
        *,
        membresia_beneficios (
          texto,
          incluido,
          orden
        )
      `)
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (error || !data) {
      setMembresias([]);
      setLoading(false);
      return;
    }
    const membresias = data
    setMembresias(membresias);
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 px-4 sm:px-8 md:px-[96px]" style={{ backgroundColor: '#1D1D1B' }}>
        <div className="mx-auto">
          <div className="text-left mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-manso-cream">
              MEMBRESÍAS
            </h2>
          </div>
          <div className="text-center text-manso-cream/60 py-8">
            Cargando membresías...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 sm:py-16 px-4 sm:px-8 md:px-[96px]" style={{ backgroundColor: '#1D1D1B', backgroundImage: 'linear-gradient(rgba(255,255,220,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,220,0.07) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
      <div className="relative z-10 mx-auto">
        <div className="text-left mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-manso-cream">
            MEMBRESÍAS
          </h2>
        </div>

        {membresias.length === 0 ? (
          <div className="text-center text-manso-cream/60 py-8">
            No hay membresías disponibles
          </div>
        ) : (() => {
          const ORDEN_CATEGORIAS = ['Cowork', 'Socios & Residentes'];
          const grupos = membresias.reduce<Record<string, Membresia[]>>((acc, m) => {
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
            <div className="space-y-12 mb-8 sm:mb-12">
              {categoriasOrdenadas.map((categoria) => (
                <div key={categoria}>
                  {/* Encabezado de categoría */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-cream/50">
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
                              }`}>USD</span>
                              <span className="text-4xl sm:text-5xl font-black leading-none">
                                {membresia.precio.toLocaleString('es-AR')}
                              </span>
                              <span className={`text-[10px] font-bold uppercase ${
                                membresia.destacado ? 'text-gray-400' : 'text-gray-500'
                              }`}>/{membresia.periodo}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {membresia.membresia_beneficios
                            ?.filter(b => b.incluido && b.texto?.trim())
                            .slice(0, 3)
                            .map((beneficio, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className={`text-sm shrink-0 mt-0.5 ${
                                  membresia.destacado ? 'text-green-400' : 'text-green-600'
                                }`}>✓</span>
                                <span className={`text-sm leading-snug ${
                                  membresia.destacado ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {beneficio.texto}
                                </span>
                              </div>
                            ))}
                        </div>

                        {membresia.descripcion && (
                          <p className={`${TYPE.body} font-medium leading-relaxed mb-4 ${
                             membresia.destacado ? 'text-gray-400' : 'text-gray-600'
                           }`}>
                            {membresia.descripcion}
                          </p>
                        )}

                        <Link
                          href={`/membresias/pagar?nombre=${encodeURIComponent(membresia.nombre)}&precio=${membresia.precio}&periodo=${encodeURIComponent(membresia.periodo)}`}
                          className={`mt-auto block w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-500 ease-out active:scale-95 rounded-full text-center ${
                            membresia.destacado
                              ? 'bg-white text-black hover:bg-white hover:text-black'
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

        {/* Botón ver todas */}
        <div className="text-center">
          <Link 
            href="/membresias"
            className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-manso-cream hover:text-white transition-colors group"
          >
            VER TODAS LAS MEMBRESÍAS 
            <ArrowRight 
              size={16} 
              className="transform transition-transform group-hover:translate-x-2" 
            />
          </Link>
        </div>
      </div>
    </section>
  );
};
