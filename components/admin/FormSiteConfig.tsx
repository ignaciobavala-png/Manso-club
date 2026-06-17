'use client';

import { useState, useEffect } from 'react';
import { getSiteConfig, setSiteConfig } from '@/lib/siteConfig';
import { Search } from 'lucide-react';

export function FormSiteConfig() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await getSiteConfig();
      // Extraer solo los valores para el formulario
      const formDataValues: Record<string, string> = {};
      Object.entries(config).forEach(([key, data]) => {
        if (data && typeof data === 'object' && 'value' in data) {
          formDataValues[key] = data.value;
        } else if (typeof data === 'string') {
          formDataValues[key] = data;
        }
      });
      setFormData(formDataValues);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al cargar configuración: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Limpiar mensaje al cambiar cualquier valor
    if (message) setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Guardar todos los valores modificados
      const savePromises = Object.entries(formData).map(([key, value]) => 
        setSiteConfig(key, value)
      );

      await Promise.all(savePromises);
      
      setMessage({ type: 'success', text: '¡Configuración guardada correctamente!' });
      
      // Disparar dashboardRefresh
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      
      // Revalidar cache
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REVALIDATE_SECRET}` }
        });
      } catch (error) {
        console.warn('Error revalidando cache:', error);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al guardar: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-manso-cream/60">Cargando configuración...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
          Configuración del Sitio
        </h2>
        <p className="text-sm text-manso-cream/60">
          Gestiona los textos y valores generales del sitio
        </p>
      </div>

      <div className="space-y-8">
        {/* Sección SEO */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Search size={20} className="text-manso-terra" />
            <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
              SEO — Google
            </h3>
          </div>
          <p className="text-xs text-manso-cream/50 mb-4">
            Así aparece el sitio cuando alguien busca "Manso Club" en Google.
          </p>
          {/* Preview estilo Google */}
          <div className="bg-white rounded-2xl p-5 border border-manso-cream/10">
            <p className="text-[#1a0dab] text-lg font-medium leading-tight">
              {formData.seo_title || 'Manso Club | Cowork Creativo & Talleres en Buenos Aires'}
            </p>
            <p className="text-[#006621] text-xs mt-0.5">mansoclub.com.ar</p>
            <p className="text-[#545454] text-sm mt-1 leading-snug">
              {formData.seo_description || 'Ideal para freelancers, emprendedores, startups, trabajadores remotos, estudiantes y artistas que busquen un lugar creativo de pertenencia.'}
            </p>
          </div>
          <input
            type="text"
            placeholder="Título (ej: Manso Club | Cowork Creativo & Talleres en Buenos Aires)"
            maxLength={60}
            className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all text-sm"
            value={formData.seo_title || ''}
            onChange={(e) => handleInputChange('seo_title', e.target.value)}
          />
          <p className="text-[10px] text-manso-cream/30 text-right -mt-2">
            {(formData.seo_title || '').length}/60 caracteres recomendados
          </p>
          <textarea
            placeholder="Descripción (ej: Cultura electrónica y diseño en Buenos Aires)"
            maxLength={160}
            rows={3}
            className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 transition-all resize-none text-sm"
            value={formData.seo_description || ''}
            onChange={(e) => handleInputChange('seo_description', e.target.value)}
          />
          <p className="text-[10px] text-manso-cream/30 text-right -mt-2">
            {(formData.seo_description || '').length}/160 caracteres recomendados
          </p>
        </div>

        {/* Mensaje de feedback */}
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Botón de guardar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? 'GUARDANDO...' : 'GUARDAR TODO'}
        </button>
      </div>
    </div>
  );
}
