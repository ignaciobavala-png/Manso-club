'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';

interface Evento {
  id: string;
  titulo: string;
  fecha: string;
  descripcion?: string;
  imagen_url?: string;
  categoria?: string;
  link_tickets?: string;
  disponible: boolean;
  activo: boolean;
  orden: number;
}

export function FormEvento() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    descripcion: '',
    imagen_url: '',
    categoria: '',
    link_tickets: '',
    disponible: true,
    orden: 0
  });

  const categorias = ['Concierto', 'Festival', 'Workshop', 'Exposición', 'Show', 'Torneo', 'Otro'];

  useEffect(() => {
    const handleEditEvent = (event: CustomEvent) => {
      const evento: Evento = event.detail;
      setEditingId(evento.id);
      setFormData({
        titulo: evento.titulo,
        fecha: evento.fecha ? new Date(evento.fecha).toISOString().slice(0, 16) : '',
        descripcion: evento.descripcion || '',
        imagen_url: evento.imagen_url || '',
        categoria: evento.categoria || '',
        link_tickets: evento.link_tickets || '',
        disponible: evento.disponible,
        orden: evento.orden
      });
    };

    window.addEventListener('editEvento', handleEditEvent as EventListener);
    
    return () => {
      window.removeEventListener('editEvento', handleEditEvent as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      fecha: '',
      descripcion: '',
      imagen_url: '',
      categoria: '',
      link_tickets: '',
      disponible: true,
      orden: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        fecha: new Date(formData.fecha).toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('eventos')
          .update(submitData)
          .eq('id', editingId);

        if (error) throw error;
        alert('¡Evento actualizado correctamente!');
      } else {
        const { error } = await supabase.from('eventos').insert([{
          ...submitData,
          activo: true
        }]);

        if (error) throw error;
        alert('¡Evento creado correctamente!');
      }

      resetForm();
      window.location.reload();
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
          {editingId ? 'Editar Evento' : 'Nuevo Evento'}
        </h2>
        {editingId && (
          <p className="text-sm text-manso-cream/60">
            Modificando los datos del evento
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
          
          <input 
            type="datetime-local" 
            className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream"
            value={formData.fecha}
            onChange={e => setFormData({...formData, fecha: e.target.value})}
            required
          />
          
          <textarea 
            placeholder="DESCRIPCIÓN DEL EVENTO"
            rows={3}
            className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 resize-none"
            value={formData.descripcion}
            onChange={e => setFormData({...formData, descripcion: e.target.value})}
          />

          <div className="grid grid-cols-2 gap-4">
            <select 
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream"
              value={formData.categoria}
              onChange={e => setFormData({...formData, categoria: e.target.value})}
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input 
              type="number" 
              placeholder="ORDEN (0 = primero)"
              className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
              value={formData.orden}
              onChange={e => setFormData({...formData, orden: parseInt(e.target.value) || 0})}
              min="0"
            />
          </div>

          <input 
            type="url" 
            placeholder="LINK DE TICKETS (opcional)"
            className="w-full p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
            value={formData.link_tickets}
            onChange={e => setFormData({...formData, link_tickets: e.target.value})}
          />

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60">
              FLYER DEL EVENTO
            </label>
            <ImageUploader 
              onUpload={(url) => setFormData({...formData, imagen_url: url})}
              initialPreview={formData.imagen_url}
              folder="eventos"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-manso-cream/10 rounded-2xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.disponible}
                onChange={e => setFormData({...formData, disponible: e.target.checked})}
                className="w-4 h-4 text-manso-terra bg-manso-cream/20 border-manso-cream/30 rounded focus:ring-manso-terra"
              />
              <span className="text-sm text-manso-cream font-medium">
                Evento disponible para el público
              </span>
            </label>
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
            {loading ? (editingId ? 'Actualizando...' : 'Creando...') : (editingId ? 'Actualizar Evento' : 'Crear Evento')}
          </button>
        </div>
      </form>
    </div>
  );
}
