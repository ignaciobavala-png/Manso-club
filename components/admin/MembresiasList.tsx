'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, Pencil, Trash2, Star, DollarSign } from 'lucide-react';
import { Membresia } from '@/lib/types/membresia';

interface MembresiasListProps {
  refreshTrigger?: number;
}

export function MembresiasList({ refreshTrigger }: MembresiasListProps) {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembresias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('membresias')
      .select(`
        *,
        membresia_beneficios (*)
      `)
      .order('orden', { ascending: true });

    if (!error && data) {
      setMembresias(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembresias();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" y todos sus beneficios?`)) return;

    const { error } = await supabase.from('membresias').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      setMembresias(membresias.filter((m) => m.id !== id));
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('membresias')
      .update({ activo: !currentActive })
      .eq('id', id);

    if (!error) {
      setMembresias(membresias.map((m) => (m.id === id ? { ...m, activo: !currentActive } : m)));
    }
  };

  const handleEdit = (membresia: Membresia) => {
    const event = new CustomEvent('editMembresia', { detail: membresia });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
      </div>
    );
  }

  if (membresias.length === 0) {
    return (
      <div className="text-center py-12 bg-manso-cream/5 border border-manso-cream/10 rounded-3xl">
        <Crown size={32} className="text-manso-cream/20 mx-auto mb-3" />
        <p className="text-sm text-manso-cream/40">No hay membresías creadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {membresias.map((membresia) => (
        <div
          key={membresia.id}
          className={`bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4 transition-all hover:border-manso-cream/20 ${
            !membresia.activo ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-manso-terra/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Crown size={14} className="text-manso-terra" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-manso-cream truncate">{membresia.nombre}</h4>
                  {membresia.destacado && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-manso-terra/20 text-manso-terra rounded-full text-[8px] font-black uppercase tracking-widest">
                      <Star size={8} />
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-manso-cream/50">
                  <span className="flex items-center gap-1">
                    <DollarSign size={10} />
                    {membresia.precio.toFixed(2)}
                  </span>
                  <span>/{membresia.periodo}</span>
                  <span>•</span>
                  <span>{membresia.membresia_beneficios?.length || 0} beneficios</span>
                </div>
                {membresia.descripcion && (
                  <p className="text-[9px] text-manso-cream/40 mt-1 line-clamp-2">
                    {membresia.descripcion}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleToggleActive(membresia.id, membresia.activo)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  membresia.activo
                    ? 'text-green-400 hover:bg-green-400/10'
                    : 'text-manso-cream/30 hover:bg-manso-cream/10'
                }`}
                title={membresia.activo ? 'Desactivar' : 'Activar'}
              >
                <div className={`w-2 h-2 rounded-full ${membresia.activo ? 'bg-green-400' : 'bg-manso-cream/30'}`} />
              </button>
              <button
                onClick={() => handleEdit(membresia)}
                className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-manso-terra transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(membresia.id, membresia.nombre)}
                className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-red-400 transition-colors"
                title="Eliminar"
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
