'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';

interface AgendaItem {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha?: string;
  activo: boolean;
  orden: number;
}

export default function AgendaPage() {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (error) {
        throw new Error('Error fetching agenda');
      }

      setAgendaItems(data || []);
    } catch (error) {
      setAgendaItems([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <AdaptiveSectionLayout title="Agenda" subtitle="Eventos y sesiones_">
        <div className="space-y-4 py-10">
          <p className="text-zinc-500 italic text-sm">Cargando agenda...</p>
        </div>
      </AdaptiveSectionLayout>
    );
  }

  return (
    <AdaptiveSectionLayout title="Agenda" subtitle="Eventos y sesiones_">
      <div className="space-y-4 py-10">
        {agendaItems.length === 0 ? (
          <p className="text-zinc-500 italic text-sm">No hay eventos en la agenda</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {agendaItems.map((item) => (
              <div key={item.id} className="h-32 bg-zinc-50 rounded-[32px] border border-zinc-100 flex items-center px-8 justify-between group hover:bg-black transition-all cursor-pointer">
                <span className="text-xl font-black italic group-hover:text-white uppercase text-manso-black">{item.titulo}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-manso-cream">Ver Detalles</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdaptiveSectionLayout>
  );
}
