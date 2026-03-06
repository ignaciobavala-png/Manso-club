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
      <section className="py-20 px-8 md:px-20" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-black">
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
    <section className="py-20 px-8 md:px-20" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-black">
            MEMBRESÍAS 2026
          </h2>
        </div>

        {membresias.length === 0 ? (
          <div className="text-center text-black/40 py-8">
            No hay membresías disponibles
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {membresias.map((membresia) => (
              <div 
                key={membresia.id}
                className={`group rounded-[40px] p-8 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer relative ${
                  membresia.destacado 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white border border-gray-200'
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
                <div className="mb-6">
                  <h3 className={`text-xl md:text-2xl font-bold uppercase tracking-tighter italic mb-2 ${
                    membresia.destacado ? 'text-white' : 'text-black'
                  }`}>
                    {membresia.nombre}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl md:text-4xl font-black ${
                      membresia.destacado ? 'text-white' : 'text-gray-800'
                    }`}>
                      ${membresia.precio.toLocaleString('es-AR')}
                    </span>
                    <span className={`text-sm font-bold uppercase ${
                      membresia.destacado ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      /{membresia.periodo}
                    </span>
                  </div>
                </div>

                {/* Beneficios destacados */}
                <div className="space-y-3 mb-6">
                  {membresia.membresia_beneficios
                    ?.filter(b => b.incluido)
                    .slice(0, 3)
                    .map((beneficio, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 shrink-0" />
                        <span className={`text-sm leading-relaxed ${
                          membresia.destacado ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {beneficio.texto}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Descripción adicional */}
                {membresia.descripcion && (
                  <p className={`text-xs leading-relaxed mb-6 ${
                    membresia.destacado ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {membresia.descripcion}
                  </p>
                )}

                {/* CTA */}
                <button className={`w-full px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 active:scale-95 ${
                  membresia.destacado 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}>
                  SELECCIONAR
                </button>
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
