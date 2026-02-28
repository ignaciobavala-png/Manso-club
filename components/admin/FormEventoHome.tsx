'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EventoHome {
  id: string;
  fecha: string;
  titulo: string;
  categoria: string;
  disponible: boolean;
  orden: number | string;
  activo: boolean;
}

export function FormEventoHome() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fecha: '',
    titulo: '',
    categoria: 'Club',
    disponible: true,
    orden: '0'
  });

  const categorias = ['Club', 'Talleres', 'Tienda'];

  useEffect(() => {
    // Escuchar evento de edición
    const handleEditEvent = (event: CustomEvent) => {
      const evento: EventoHome = event.detail;
      setEditingId(evento.id);
      setFormData({
        fecha: evento.fecha ? new Date(evento.fecha).toISOString().split('T')[0] : '',
        titulo: evento.titulo,
        categoria: evento.categoria,
        disponible: evento.disponible,
        orden: evento.orden.toString(),
      });
    };

    window.addEventListener('editEventoHome', handleEditEvent as EventListener);
    
    return () => {
      window.removeEventListener('editEventoHome', handleEditEvent as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ fecha: '', titulo: '', categoria: 'Club', disponible: true, orden: '0' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        // Modo edición
        const { error } = await supabase
          .from('eventos_home')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        alert('¡Evento actualizado correctamente!');
      } else {
        // Modo creación
        let finalOrden = parseInt(String(formData.orden)) || 0;
        if (finalOrden === 0) {
          const { data: maxOrden } = await supabase
            .from('eventos_home')
            .select('orden')
            .order('orden', { ascending: false })
            .limit(1);
          finalOrden = (maxOrden?.[0]?.orden || 0) + 1;
        }
        
        const { error } = await supabase.from('eventos_home').insert([{
          ...formData,
          orden: parseInt(String(formData.orden)) || 0,
          activo: true
        }]);

        if (error) throw error;
        alert('¡Evento agregado al home!');
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
      {/* Header dinámico */}
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
          {editingId ? 'Editar Evento del Home' : 'Nuevo Evento del Home'}
        </h2>
        {editingId && (
          <p className="text-sm text-manso-cream/60">
            Modificando los datos del evento seleccionado
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
          
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="date"
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40 [color-scheme:dark]"
              value={formData.fecha}
              onChange={e => setFormData({...formData, fecha: e.target.value})}
              required
            />

            <select 
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream"
              value={formData.categoria}
              onChange={e => setFormData({...formData, categoria: e.target.value})}
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" 
              placeholder="ORDEN (opcional, auto-asignado)"
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
              value={formData.orden || ''}
              onChange={e => setFormData({...formData, orden: e.target.value})}
              min="0"
            />

            <label className="flex items-center gap-3 p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 cursor-pointer">
              <input 
                type="checkbox"
                checked={formData.disponible}
                onChange={e => setFormData({...formData, disponible: e.target.checked})}
                className="w-5 h-5 text-manso-terra bg-manso-cream/20 border-manso-cream/40 rounded focus:ring-manso-terra"
              />
              <span className="text-sm font-mono text-manso-cream">Disponible para venta</span>
            </label>
          </div>
        </div>

        {/* Botones dinámicos */}
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
            {loading ? (editingId ? 'Actualizando...' : 'Agregando...') : (editingId ? 'Actualizar Evento' : 'Agregar Evento al Home')}
          </button>
        </div>
      </form>
    </div>
  );
}
