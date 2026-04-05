'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, DollarSign, Calendar, Text, Plus, Trash2, Check, X, Hash } from 'lucide-react';
import { Membresia, MembresiaBeneficio, MembresiaForm } from '@/lib/types/membresia';

export function FormMembresia() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState<MembresiaForm>({
    nombre: '',
    precio: 0,
    periodo: 'mes',
    descripcion: '',
    destacado: false,
    activo: true,
    orden: 0,
    categoria: 'Cowork',
    beneficios: [],
  });

  // Listen for edit events from the list
  useEffect(() => {
    const handleEdit = (event: CustomEvent<Membresia>) => {
      const item = event.detail;
      setEditingId(item.id);
      setFormData({
        nombre: item.nombre || '',
        precio: item.precio || 0,
        periodo: item.periodo || 'mes',
        descripcion: item.descripcion || '',
        destacado: item.destacado || false,
        activo: item.activo || true,
        orden: item.orden || 0,
        categoria: item.categoria || 'Cowork',
        beneficios: item.membresia_beneficios || [],
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('editMembresia', handleEdit as EventListener);
    return () => {
      window.removeEventListener('editMembresia', handleEdit as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      precio: 0,
      periodo: 'mes',
      descripcion: '',
      destacado: false,
      activo: true,
      orden: 0,
      categoria: 'Cowork',
      beneficios: [],
    });
    setFeedback(null);
  };

  const addBeneficio = () => {
    const newBeneficio: MembresiaBeneficio = {
      id: '',
      membresia_id: '',
      texto: '',
      incluido: true,
      orden: formData.beneficios.length,
    };
    setFormData({
      ...formData,
      beneficios: [...formData.beneficios, newBeneficio],
    });
  };

  const updateBeneficio = (index: number, field: keyof MembresiaBeneficio, value: any) => {
    const updatedBeneficios = [...formData.beneficios];
    updatedBeneficios[index] = { ...updatedBeneficios[index], [field]: value };
    setFormData({ ...formData, beneficios: updatedBeneficios });
  };

  const removeBeneficio = (index: number) => {
    const updatedBeneficios = formData.beneficios.filter((_, i) => i !== index);
    setFormData({ ...formData, beneficios: updatedBeneficios });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setFeedback({ type: 'error', message: 'El nombre del plan es requerido' });
      return;
    }

    if (parseFloat(String(formData.precio)) < 0) {
      setFeedback({ type: 'error', message: 'El precio no puede ser negativo' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      if (editingId) {
        // Update existing membresia
        const { error: membresiaError } = await supabase
          .from('membresias')
          .update({
            nombre: formData.nombre,
            precio: parseFloat(String(formData.precio)) || 0,
            periodo: formData.periodo,
            descripcion: formData.descripcion,
            destacado: formData.destacado,
            activo: formData.activo,
            orden: parseInt(String(formData.orden)) || 0,
            categoria: formData.categoria,
          })
          .eq('id', editingId);

        if (membresiaError) throw membresiaError;

        // Delete existing beneficios
        const { error: deleteError } = await supabase
          .from('membresia_beneficios')
          .delete()
          .eq('membresia_id', editingId);

        if (deleteError) throw deleteError;

        // Insert new beneficios
        const beneficiosToInsert = formData.beneficios.map((beneficio, index) => ({
          membresia_id: editingId,
          texto: beneficio.texto,
          incluido: beneficio.incluido,
          orden: index,
        }));

        if (beneficiosToInsert.length > 0) {
          const { error: beneficiosError } = await supabase
            .from('membresia_beneficios')
            .insert(beneficiosToInsert);

          if (beneficiosError) throw beneficiosError;
        }

        setFeedback({ type: 'success', message: '¡Membresía actualizada!' });
      } else {
        // Create new membresia
        const { data: newMembresia, error: membresiaError } = await supabase
          .from('membresias')
          .insert({
            nombre: formData.nombre,
            precio: parseFloat(String(formData.precio)) || 0,
            periodo: formData.periodo,
            descripcion: formData.descripcion,
            destacado: formData.destacado,
            activo: formData.activo,
            orden: parseInt(String(formData.orden)) || 0,
            categoria: formData.categoria,
          })
          .select()
          .single();

        if (membresiaError) throw membresiaError;

        // Insert beneficios
        const beneficiosToInsert = formData.beneficios.map((beneficio, index) => ({
          membresia_id: newMembresia.id,
          texto: beneficio.texto,
          incluido: beneficio.incluido,
          orden: index,
        }));

        if (beneficiosToInsert.length > 0) {
          const { error: beneficiosError } = await supabase
            .from('membresia_beneficios')
            .insert(beneficiosToInsert);

          if (beneficiosError) throw beneficiosError;
        }

        setFeedback({ type: 'success', message: '¡Membresía creada!' });
      }

      setTimeout(() => {
        resetForm();
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      }, 1500);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-manso-cream/5 border border-manso-cream/10 rounded-3xl p-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-manso-terra mb-4">
        {editingId ? '✏️ Editando Membresía' : '👑 Nueva Membresía'}
      </h3>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-black uppercase tracking-widest ${
            feedback.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Nombre del Plan
        </label>
        <div className="relative">
          <Crown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Coworker, Miembro Club"
            required
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
          />
        </div>
      </div>

      {/* Precio */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Precio
        </label>
        <div className="relative">
          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <input
            type="number"
            value={formData.precio}
            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
          />
        </div>
      </div>

      {/* Periodo */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Periodo
        </label>
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <select
            value={formData.periodo}
            onChange={(e) => setFormData({ ...formData, periodo: e.target.value as 'mes' | 'año' })}
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream focus:outline-none focus:border-manso-terra/50 transition-colors appearance-none"
          >
            <option value="mes">Mensual</option>
            <option value="año">Anual</option>
          </select>
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Categoría
        </label>
        <select
          value={formData.categoria}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 text-sm text-manso-cream focus:outline-none focus:border-manso-terra/50 transition-colors appearance-none"
        >
          <option value="Cowork">Cowork</option>
          <option value="Socios & Residentes">Socios &amp; Residentes</option>
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Descripción Corta
        </label>
        <div className="relative">
          <Text size={14} className="absolute left-3 top-3 text-manso-cream/40" />
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Breve descripción del plan..."
            rows={3}
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Orden */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Orden (menor = primero)
        </label>
        <div className="relative">
          <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <input
            type="number"
            value={formData.orden}
            onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.destacado}
            onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
            className="w-4 h-4 text-manso-terra bg-manso-cream/10 border-manso-cream/20 rounded focus:ring-manso-terra/50"
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60">
            Destacado (muestra badge "Más popular")
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.activo}
            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
            className="w-4 h-4 text-manso-terra bg-manso-cream/10 border-manso-cream/20 rounded focus:ring-manso-terra/50"
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60">
            Activo (visible en la web)
          </span>
        </label>
      </div>

      {/* Beneficios */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60">
            Beneficios del Plan
          </label>
          <button
            type="button"
            onClick={addBeneficio}
            className="flex items-center gap-1 px-2 py-1 bg-manso-terra/20 text-manso-terra rounded-lg text-[9px] font-black uppercase hover:bg-manso-terra/30 transition-colors"
          >
            <Plus size={10} />
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {formData.beneficios.map((beneficio, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-manso-cream/5 rounded-lg">
              <input
                type="text"
                value={beneficio.texto}
                onChange={(e) => updateBeneficio(index, 'texto', e.target.value)}
                placeholder="Descripción del beneficio..."
                className="flex-1 bg-manso-cream/5 border border-manso-cream/10 rounded px-2 py-1 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
              />
              
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={beneficio.incluido}
                  onChange={(e) => updateBeneficio(index, 'incluido', e.target.checked)}
                  className="w-3 h-3 text-manso-terra bg-manso-cream/10 border-manso-cream/20 rounded focus:ring-manso-terra/50"
                />
                {beneficio.incluido ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <X size={12} className="text-red-400" />
                )}
              </label>

              <button
                type="button"
                onClick={() => removeBeneficio(index)}
                className="w-6 h-6 flex items-center justify-center text-manso-cream/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}

          {formData.beneficios.length === 0 && (
            <div className="text-center py-4 text-manso-cream/30 text-[10px]">
              No hay beneficios agregados
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-manso-terra text-manso-cream py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-manso-terra/80 transition-all disabled:opacity-50"
        >
          {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Membresía'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 bg-manso-cream/10 text-manso-cream/60 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-manso-cream/20 transition-all"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
