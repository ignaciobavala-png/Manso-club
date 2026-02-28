'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AgendaEvent {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  duracion: string;
  frecuencia: string;
  precio: number | string;
  activo: boolean;
  cupos_maximos?: number | string;
  whatsapp_contacto?: string;
}

export function FormAgenda() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'Taller',
    duracion: '2 horas',
    frecuencia: 'Mensual',
    precio: '0',
    cupos_maximos: '0',
    whatsapp_contacto: ''
  });

  const categorias = ['Taller', 'Curso', 'Sesión', 'Clase', 'Evento Recurrente'];
  const duraciones = ['1 hora', '2 horas', '3 horas', '4 horas', 'Medio día', 'Día completo'];
  const frecuencias = ['Semanal', 'Quincenal', 'Mensual', 'Bimensual', 'Trimestral'];

  useEffect(() => {
    const handleEditEvent = (event: CustomEvent) => {
      const evento: AgendaEvent = event.detail;
      setEditingId(evento.id);
      setFormData({
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        categoria: evento.categoria,
        duracion: evento.duracion,
        frecuencia: evento.frecuencia,
        precio: evento.precio.toString(),
        cupos_maximos: (evento.cupos_maximos || 0).toString(),
        whatsapp_contacto: evento.whatsapp_contacto || ''
      });
    };

    window.addEventListener('editAgendaEvent', handleEditEvent as EventListener);
    
    return () => {
      window.removeEventListener('editAgendaEvent', handleEditEvent as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      descripcion: '',
      categoria: 'Taller',
      duracion: '2 horas',
      frecuencia: 'Mensual',
      precio: '0',
      cupos_maximos: '0',
      whatsapp_contacto: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('agenda')
          .update({
            ...formData,
            precio: parseInt(String(formData.precio)) || 0,
            cupos_maximos: parseInt(String(formData.cupos_maximos)) || 0
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('¡Evento de agenda actualizado correctamente!');
      } else {
        const { error } = await supabase.from('agenda').insert([{
          ...formData,
          precio: parseInt(String(formData.precio)) || 0,
          cupos_maximos: parseInt(String(formData.cupos_maximos)) || 0,
          activo: true
        }]);

        if (error) throw error;
        alert('¡Evento agregado a la agenda!');
      }

      resetForm();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    } catch (error: any) {
      alert(error.message);
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
          {editingId ? 'Editar Evento de Agenda' : 'Nuevo Evento de Agenda'}
        </h2>
        {editingId && (
          <p className="text-sm text-manso-cream/60">
            Modificando los datos del evento recurrente
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" 
            placeholder="TÍTULO DEL EVENTO"
            className="w-full text-2xl font-black bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40"
            value={formData.titulo}
            onChange={e => setFormData({...formData, titulo: e.target.value})}
            required
          />
          
          <textarea 
            placeholder="DESCRIPCIÓN DETALLADA DEL EVENTO"
            rows={4}
            className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 resize-none"
            value={formData.descripcion}
            onChange={e => setFormData({...formData, descripcion: e.target.value})}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <select 
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream"
              value={formData.categoria}
              onChange={e => setFormData({...formData, categoria: e.target.value})}
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream"
              value={formData.frecuencia}
              onChange={e => setFormData({...formData, frecuencia: e.target.value})}
            >
              {frecuencias.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select 
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream"
              value={formData.duracion}
              onChange={e => setFormData({...formData, duracion: e.target.value})}
            >
              {duraciones.map(dur => (
                <option key={dur} value={dur}>{dur}</option>
              ))}
            </select>

            <input 
              type="number" 
              placeholder="PRECIO (0 = gratis)"
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
              value={formData.precio || ''}
              onChange={e => setFormData({...formData, precio: e.target.value})}
              min="0"
              step="100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" 
              placeholder="CUPOS MÁXIMOS (0 = ilimitado)"
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
              value={formData.cupos_maximos || ''}
              onChange={e => setFormData({...formData, cupos_maximos: e.target.value})}
              min="0"
            />

            <input 
              type="text" 
              placeholder="WHATSAPP CONTACTO (+54 9 ...)"
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
              value={formData.whatsapp_contacto}
              onChange={e => setFormData({...formData, whatsapp_contacto: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-4">
          {editingId && (
            <button 
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-manso-cream/20 text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream/30 transition-all active:scale-95"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (editingId ? 'Actualizando...' : 'Agregando...') : (editingId ? 'Actualizar Evento' : 'Agregar Evento a Agenda')}
          </button>
        </div>
      </form>
    </div>
  );
}
