'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Briefcase, Trash2, Edit, Eye, EyeOff } from 'lucide-react';

interface OfertaEmpleo {
  id: string;
  area: string;
  descripcion: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

interface OfertasEmpleoListProps {
  refreshTrigger: number;
}

export function OfertasEmpleoList({ refreshTrigger }: OfertasEmpleoListProps) {
  const [ofertas, setOfertas] = useState<OfertaEmpleo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOfertas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ofertas_empleo')
      .select('*')
      .order('orden', { ascending: true });

    if (!error && data) setOfertas(data);
    setLoading(false);
  };

  useEffect(() => { fetchOfertas(); }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    await supabase.from('ofertas_empleo').delete().eq('id', id);
    fetchOfertas();
  };

  const handleToggleActivo = async (oferta: OfertaEmpleo) => {
    await supabase.from('ofertas_empleo').update({ activo: !oferta.activo }).eq('id', oferta.id);
    fetchOfertas();
  };

  const handleEdit = (oferta: OfertaEmpleo) => {
    window.dispatchEvent(new CustomEvent('editOfertaEmpleo', { detail: oferta }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 text-center">
        <p className="text-manso-cream/40 text-sm">Cargando ofertas...</p>
      </div>
    );
  }

  if (ofertas.length === 0) {
    return (
      <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 text-center">
        <Briefcase className="mx-auto text-manso-cream/40 mb-4" size={48} />
        <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-2">Sin ofertas</h3>
        <p className="text-sm text-manso-cream/60">Creá la primera oferta desde el formulario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ofertas.map((oferta) => (
        <div
          key={oferta.id}
          className={`bg-manso-cream/5 p-4 md:p-5 rounded-2xl border transition-all ${oferta.activo ? 'border-manso-cream/20' : 'border-manso-cream/5 opacity-60'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra">
                  #{oferta.orden}
                </span>
                {!oferta.activo && (
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/30 bg-manso-cream/10 px-2 py-0.5 rounded-full">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-manso-cream font-black uppercase tracking-tight text-sm md:text-base">
                {oferta.area}
              </p>
              <p className="text-manso-cream/60 text-xs md:text-sm mt-1 leading-relaxed line-clamp-2">
                {oferta.descripcion}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleToggleActivo(oferta)}
                title={oferta.activo ? 'Desactivar' : 'Activar'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream/60 hover:text-manso-cream transition-all"
              >
                {oferta.activo ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => handleEdit(oferta)}
                title="Editar"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream/60 hover:text-manso-cream transition-all"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(oferta.id)}
                title="Eliminar"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
