'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { CalendarioMensual } from '@/components/Calendario/CalendarioMensual';
import { construirOcurrencias, rangoDelMes } from '@/lib/calendario-utils';
import { CalendarioOcurrencia } from '@/lib/types/calendario';

// Misma lógica de visibilidad por nivel que /agenda (ver app/agenda/page.tsx).
type Nivel = 'publico' | 'registrado' | 'miembro';

const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};

export default function CalendarioPage() {
  const [mesVisible, setMesVisible] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [ocurrencias, setOcurrencias] = useState<CalendarioOcurrencia[]>([]);
  const [loading, setLoading] = useState(true);

  const { desde, hasta } = useMemo(() => rangoDelMes(mesVisible), [mesVisible]);

  useEffect(() => {
    let activo = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        let nivel: Nivel = 'publico';
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('permisos_totales')
            .eq('id', user.id)
            .single();
          nivel = profile?.permisos_totales ? 'miembro' : 'registrado';
        }

        const [agendaRes, eventosRes] = await Promise.all([
          supabase.from('agenda').select('*').eq('activo', true).in('visibilidad', NIVELES_VISIBLES[nivel]),
          supabase.from('eventos').select('*').eq('activo', true),
        ]);

        if (!activo) return;

        const items = construirOcurrencias(agendaRes.data || [], eventosRes.data || [], desde, hasta);
        setOcurrencias(items);
      } catch {
        if (activo) setOcurrencias([]);
      } finally {
        if (activo) setLoading(false);
      }
    };

    fetchData();
    return () => { activo = false; };
  }, [desde, hasta]);

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-32 pb-24">
        <div className="mb-12">
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-3">
            Manso Club
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
            Calendario
          </h1>
          <p className="text-sm text-manso-cream/40 font-light mt-4 max-w-lg leading-relaxed">
            Todos los talleres y eventos de Manso Club, en un solo lugar. Tocá cualquier fecha para ver el detalle.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-manso-cream/30 py-20">
            <div className="w-4 h-4 border border-manso-cream/20 border-t-manso-cream/60 rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-black">Cargando calendario...</span>
          </div>
        ) : (
          <CalendarioMensual
            ocurrencias={ocurrencias}
            mesVisible={mesVisible}
            onCambiarMes={setMesVisible}
          />
        )}
      </div>
    </div>
  );
}
