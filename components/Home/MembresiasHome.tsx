'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { Membresia, MembresiaBeneficio } from '@/lib/types/membresia';

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
      <section className="py-12 sm:py-16 px-4 sm:px-8 md:px-20" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-black">
              MEMBRESÍAS 2026
            </h2>
          </div>
          <div className="text-center text-black/60 py-8">
            Cargando membresías...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 md:px-20" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-black">
            MEMBRESÍAS 2026
          </h2>
        </div>

        {membresias.length === 0 ? (
          <div className="text-center text-black/40 py-8">
            No hay membresías disponibles
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8 mb-8 sm:mb-12">
            {membresias.map((membresia) => (
              <div
                key={membresia.id}
                className={`group rounded-[20px] sm:rounded-[30px] md:rounded-[40px] p-4 sm:p-6 md:p-8 transition-all duration-700 ease-out hover:scale-[1.02] cursor-pointer relative ${
                  membresia.destacado
                    ? 'bg-black text-white border-black hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]'
                    : 'bg-white border-2 border-gray-300 hover:border-manso-black/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]'
                }`}
              >
                {/* Etiqueta "Más Popular" */}
                {membresia.destacado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      membresia.destacado 
                        ? 'bg-white text-black' 
                        : 'bg-black text-white'
                    }`}>
                      <Star size={8} />
                      Más Popular
                    </span>
                  </div>
                )}
                {/* Header de la membresía */}
                <div className="mb-3 sm:mb-4 md:mb-6">
                  <h3 className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold uppercase tracking-tighter italic mb-2 ${
                    membresia.destacado ? 'text-white' : 'text-black'
                  }`}>
                    {membresia.nombre}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black ${
                      membresia.destacado ? 'text-white' : 'text-gray-800'
                    }`}>
                      ${membresia.precio.toLocaleString('es-AR')}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold uppercase ${
                      membresia.destacado ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      /{membresia.periodo}
                    </span>
                  </div>
                </div>

                {/* Beneficios destacados */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {membresia.membresia_beneficios
                    ?.filter(b => b.incluido)
                    .slice(0, 3)
                    .map((beneficio, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 shrink-0" />
                        <span className={`text-xs sm:text-sm leading-relaxed ${
                          membresia.destacado ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {beneficio.texto}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Descripción adicional */}
                {membresia.descripcion && (
                  <p className={`text-[10px] sm:text-xs leading-relaxed mb-4 sm:mb-6 ${
                    membresia.destacado ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {membresia.descripcion}
                  </p>
                )}

                {/* CTA */}
                <Link
                  href={`/membresias/pagar?nombre=${encodeURIComponent(membresia.nombre)}&precio=${membresia.precio}&periodo=${encodeURIComponent(membresia.periodo)}`}
                  className={`block w-full px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-500 ease-out active:scale-95 rounded-full text-center ${
                    membresia.destacado
                      ? 'bg-white text-black hover:bg-manso-olive hover:text-white'
                      : 'bg-black text-white hover:bg-manso-black/80'
                  }`}
                >
                  SELECCIONAR
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Botón ver todas */}
        <div className="text-center">
          <Link 
            href="/membresias"
            className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-black hover:text-gray-600 transition-colors group"
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
