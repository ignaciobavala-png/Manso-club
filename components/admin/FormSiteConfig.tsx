'use client';

import { useState, useEffect } from 'react';
import { getSiteConfig, setSiteConfig } from '@/lib/siteConfig';
import { Settings, BarChart3, Type } from 'lucide-react';

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
      setFormData(config);
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
        {/* Sección Títulos Principales */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <label className="block text-sm font-bold uppercase tracking-widest text-manso-cream/60 mb-4">
              Título Principal de la Sección
            </label>
            {/* Preview del título */}
            <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10 mb-4">
              <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tighter text-manso-cream leading-[0.9]">
                {formData.porque_titulo || 'Why Manso'}
              </h2>
              <p className="text-lg text-manso-cream/70 mt-2">
                {formData.porque_subtitulo || 'More than just a workspace...'}
              </p>
            </div>
            {/* Input del título */}
            <input
              type="text"
              placeholder="Título principal"
              className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all mb-3"
              value={formData.porque_titulo || ''}
              onChange={(e) => handleInputChange('porque_titulo', e.target.value)}
            />
            <textarea
              placeholder="Subtítulo descriptivo"
              className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none h-20 resize-none text-manso-cream placeholder:text-manso-cream/40"
              value={formData.porque_subtitulo || ''}
              onChange={(e) => handleInputChange('porque_subtitulo', e.target.value)}
            />
          </div>
        </div>

        {/* Sección Cards de Beneficios */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings size={20} className="text-manso-terra" />
            <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
              Cards de Beneficios
            </h3>
          </div>

          {/* Cards con preview visual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="bg-manso-cream/5 rounded-2xl p-4 border border-manso-cream/10">
                {/* Mini preview */}
                <div className="bg-manso-black/50 rounded-2xl p-4 mb-4 border border-manso-cream/10">
                  <h4 className="text-lg font-bold text-white mb-2">
                    {formData[`beneficio${num}_titulo`] || `Título del Beneficio ${num}`}
                  </h4>
                  <p className="text-sm text-white/60">
                    {formData[`beneficio${num}_descripcion`] || `Descripción del beneficio ${num}...`}
                  </p>
                </div>
                {/* Campos de edición */}
                <div className="space-y-2">
                  <input 
                    placeholder="Título del beneficio"
                    className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/30 text-sm"
                    value={formData[`beneficio${num}_titulo`] || ''}
                    onChange={e => handleInputChange(`beneficio${num}_titulo`, e.target.value)}
                  />
                  <textarea 
                    placeholder="Descripción del beneficio"
                    className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/30 text-sm h-20 resize-none"
                    value={formData[`beneficio${num}_descripcion`] || ''}
                    onChange={e => handleInputChange(`beneficio${num}_descripcion`, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección Texto Adicional */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-manso-cream/60 mb-4">
              Texto Adicional (Opcional) — aparece debajo de las cards
            </label>
            {/* Preview del texto */}
            <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10 mb-4">
              <p className="text-lg md:text-xl font-light text-manso-cream/70 leading-relaxed">
                {formData.porque_main_text || 'Texto descriptivo adicional...'}
              </p>
            </div>
            {/* Textarea del texto */}
            <textarea
              placeholder="Texto adicional que aparecerá debajo de las cards de beneficios"
              className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none h-32 resize-none text-manso-cream placeholder:text-manso-cream/40"
              value={formData.porque_main_text || ''}
              onChange={(e) => handleInputChange('porque_main_text', e.target.value)}
            />
          </div>
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
