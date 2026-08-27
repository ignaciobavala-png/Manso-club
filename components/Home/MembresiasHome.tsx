'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Membresia } from '@/lib/types/membresia';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { useCurrency } from '@/store/useCurrency';
import { MembresiaCard } from '@/components/ui/MembresiaCard';

export const MembresiasHome = () => {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, rate } = useCurrency();

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
      <section className="py-8 sm:py-12 px-4 sm:px-8 md:px-[96px]" style={{ backgroundColor: '#000000' }}>
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
    <section className="relative py-12 sm:py-16 px-4 sm:px-8 md:px-[96px]" style={{ backgroundColor: '#000000', backgroundImage: 'linear-gradient(rgba(255,255,220,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,220,0.07) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
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
                    {categoria === 'Cowork'
                      ? <CurrencyToggle />
                      : <span className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-cream/50">{categoria}</span>
                    }
                    <div className="flex-1 h-px bg-manso-cream/10" />
                  </div>

                  <div className="mx-auto max-w-sm sm:max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                    {grupos[categoria].map((membresia) => (
                      <MembresiaCard
                        key={membresia.id}
                        membresia={membresia}
                        currency={currency}
                        rate={rate}
                        soloIncluidos
                        maxBeneficios={3}
                      />
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
