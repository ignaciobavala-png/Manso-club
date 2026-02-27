'use client';

import { useState, useEffect } from 'react';
import { upsertTeamMember, TeamMember } from '@/lib/team';
import { ImageUploader } from './ImageUploader';
import { User, Briefcase } from 'lucide-react';

interface TeamMemberEdit {
  id: string;
  name: string;
  role: string;
  photo_url?: string;
  order_index: number;
  active: boolean;
}

export function FormTeam() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    order_index: 1,
    photo_url: ''
  });

  useEffect(() => {
    const handleEditEvent = (event: CustomEvent<TeamMemberEdit>) => {
      const member = event.detail;
      setEditingId(member.id);
      setFormData({
        name: member.name || '',
        role: member.role || '',
        order_index: member.order_index || 1,
        photo_url: member.photo_url || ''
      });
      setImageKey(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('editTeamMember', handleEditEvent as EventListener);
    return () => {
      window.removeEventListener('editTeamMember', handleEditEvent as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', role: '', order_index: 1, photo_url: '' });
    setImageKey(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await upsertTeamMember({
        id: editingId || undefined,
        name: formData.name,
        role: formData.role,
        order_index: formData.order_index,
        photo_url: formData.photo_url || undefined,
        active: true
      });

      alert(editingId ? '¡Miembro del team actualizado correctamente!' : '¡Miembro del team agregado correctamente!');
      resetForm();
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      {/* Header dinamico */}
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
          {editingId ? 'Editar Miembro del Team' : 'Nuevo Miembro del Team'}
        </h2>
        {editingId && (
          <p className="text-sm text-manso-cream/60">
            Modificando a {formData.name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Zona de Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
            Foto del Miembro
          </label>
          <ImageUploader
            key={imageKey}
            bucket="team-photos"
            folder="members"
            maxWidth={800}
            initialPreview={formData.photo_url || null}
            onUpload={(url) => setFormData({...formData, photo_url: url})} 
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Nombre */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="NOMBRE COMPLETO"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          {/* Rol */}
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="ROL EN EL EQUIPO (ej: Director, Coordinador, etc)"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
              required
            />
          </div>

          {/* Orden */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 text-[10px] font-black uppercase tracking-widest">
              #
            </div>
            <input 
              type="number" 
              placeholder="ORDEN (1, 2, 3...)"
              min="1"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.order_index}
              onChange={e => setFormData({...formData, order_index: parseInt(e.target.value) || 1})}
              required
            />
          </div>
        </div>

        {/* Botones dinamicos */}
        <div className="flex gap-4">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
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
            {loading
              ? (editingId ? 'ACTUALIZANDO...' : 'AGREGANDO...')
              : (editingId ? 'ACTUALIZAR MIEMBRO' : 'AGREGAR MIEMBRO')
            }
          </button>
        </div>
      </form>
    </div>
  );
}
