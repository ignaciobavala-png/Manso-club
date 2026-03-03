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
        {/* Sección Título */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <label className="block text-sm font-bold uppercase tracking-widest text-manso-cream/60 mb-4">
              Título principal de la sección
            </label>
            {/* Preview del título */}
            <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10 mb-4">
              <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tighter italic text-manso-cream leading-[0.8]">
                {formData.porque_titulo || 'Espacio Híbrido'}
                <br />
                <span className="text-manso-cream/70">Cultura Digital</span>
              </h2>
            </div>
            {/* Input del título */}
            <input
              type="text"
              placeholder="Título principal de la sección"
              className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.porque_titulo || ''}
              onChange={(e) => handleInputChange('porque_titulo', e.target.value)}
            />
          </div>
        </div>

        {/* Sección ¿Por qué Manso? */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 size={20} className="text-manso-terra" />
            <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
              ¿Por qué Manso?
            </h3>
          </div>

          {/* Stats con preview visual */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-manso-cream/5 rounded-2xl p-4 border border-manso-cream/10">
                {/* Mini preview */}
                <div className="text-center mb-4 py-3 border-b border-manso-cream/10">
                  <div className="text-3xl font-black text-manso-cream">
                    {formData[`porque_stat${num}_numero`] || 'XXX'}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-manso-cream/60">
                    {formData[`porque_stat${num}_label`] || 'LABEL'}
                  </div>
                  <div className="text-xs text-manso-cream/40 mt-1">
                    {formData[`porque_stat${num}_descripcion`] || 'Descripción...'}
                  </div>
                </div>
                {/* Campos de edición */}
                <div className="space-y-2">
                  <input 
                    placeholder="Número destacado (ej: 500+, 24/7, 2x)"
                    className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/30 text-sm"
                    value={formData[`porque_stat${num}_numero`] || ''}
                    onChange={e => handleInputChange(`porque_stat${num}_numero`, e.target.value)}
                  />
                  <input 
                    placeholder="Título en mayúsculas (ej: CREATIVOS)"
                    className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/30 text-sm uppercase"
                    value={formData[`porque_stat${num}_label`] || ''}
                    onChange={e => handleInputChange(`porque_stat${num}_label`, e.target.value)}
                  />
                  <input 
                    placeholder="Descripción breve"
                    className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/30 text-sm"
                    value={formData[`porque_stat${num}_descripcion`] || ''}
                    onChange={e => handleInputChange(`porque_stat${num}_descripcion`, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Párrafo central con preview */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-manso-cream/60 mb-4">
              Párrafo central — aparece debajo de las stats
            </label>
            {/* Preview del párrafo */}
            <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10 mb-4">
              <p className="text-lg md:text-xl font-light text-manso-cream/70 leading-relaxed italic">
                {formData.porque_main_text || 'Texto descriptivo de la sección...'}
              </p>
            </div>
            {/* Textarea del párrafo */}
            <textarea
              placeholder="Párrafo descriptivo de ¿Por qué Manso?"
              className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none h-32 resize-none text-manso-cream placeholder:text-manso-cream/40"
              value={formData.porque_main_text || ''}
              onChange={(e) => handleInputChange('porque_main_text', e.target.value)}
            />
          </div>

          {/* Pills con preview visual */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-manso-cream/60 mb-4">
              Badges informativos — aparecen al pie de la sección
            </label>
            {/* Preview de los pills */}
            <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10 mb-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-manso-cream/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-manso-cream rounded-full" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {formData.porque_pill1 || 'Ubicación'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-manso-cream rounded-full" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {formData.porque_pill2 || 'Desde'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-manso-cream rounded-full" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {formData.porque_pill3 || 'Tipo'}
                  </span>
                </div>
              </div>
            </div>
            {/* Inputs de los pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="ej: Belgrano, CABA"
                className="bg-manso-cream/10 p-3 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
                value={formData.porque_pill1 || ''}
                onChange={(e) => handleInputChange('porque_pill1', e.target.value)}
              />
              <input
                type="text"
                placeholder="ej: Desde 2025"
                className="bg-manso-cream/10 p-3 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
                value={formData.porque_pill2 || ''}
                onChange={(e) => handleInputChange('porque_pill2', e.target.value)}
              />
              <input
                type="text"
                placeholder="ej: Comunidad Creativa"
                className="bg-manso-cream/10 p-3 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
                value={formData.porque_pill3 || ''}
                onChange={(e) => handleInputChange('porque_pill3', e.target.value)}
              />
            </div>
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
