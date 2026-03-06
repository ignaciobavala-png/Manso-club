'use client';

import { useState, useEffect } from 'react';
import { CreditCard, MessageCircle, Mail, Clock, DollarSign, Building, User as UserIcon, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface CheckoutConfig {
  banco_nombre: string;
  banco_cbu: string;
  banco_alias: string;
  banco_titular: string;
  banco_cuit: string;
  whatsapp_numero: string;
  whatsapp_mensaje_confirmacion: string;
  email_notificaciones: string;
  moneda: string;
  tiempo_entrega: string;
}

export function FormCheckoutConfig() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<CheckoutConfig>({
    banco_nombre: '',
    banco_cbu: '',
    banco_alias: '',
    banco_titular: '',
    banco_cuit: '',
    whatsapp_numero: '',
    whatsapp_mensaje_confirmacion: '',
    email_notificaciones: '',
    moneda: 'ARS',
    tiempo_entrega: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout/config');
      const data = await response.json();
      
      if (data.success && data.config) {
        setFormData(data.config);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al cargar configuración: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof CheckoutConfig, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (message) setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/checkout/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '¡Configuración del checkout guardada correctamente!' });
        
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
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar la configuración' });
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
          <div className="text-manso-cream/60">Cargando configuración del checkout...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-manso-terra" />
          <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream">
            Configuración del Checkout
          </h2>
        </div>
        <p className="text-sm text-manso-cream/60">
          Gestiona los datos bancarios y notificaciones para el proceso de compra
        </p>
      </div>

      <div className="space-y-8">
        {/* Datos Bancarios */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="w-5 h-5 text-manso-terra" />
            <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
              Datos Bancarios
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
                Banco
              </label>
              <input
                type="text"
                placeholder="Nombre del banco"
                className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40"
                value={formData.banco_nombre}
                onChange={(e) => handleInputChange('banco_nombre', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
                Moneda
              </label>
              <select
                className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream"
                value={formData.moneda}
                onChange={(e) => handleInputChange('moneda', e.target.value)}
              >
                <option value="ARS">ARS - Pesos Argentinos</option>
                <option value="USD">USD - Dólares</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
              CBU
            </label>
            <input
              type="text"
              placeholder="CBU de la cuenta"
              className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-manso-cream placeholder:text-manso-cream/40"
              value={formData.banco_cbu}
              onChange={(e) => handleInputChange('banco_cbu', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
              Alias
            </label>
            <input
              type="text"
              placeholder="Alias de la cuenta"
              className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40"
              value={formData.banco_alias}
              onChange={(e) => handleInputChange('banco_alias', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
                Titular
              </label>
              <input
                type="text"
                placeholder="Nombre del titular"
                className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40"
                value={formData.banco_titular}
                onChange={(e) => handleInputChange('banco_titular', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
                CUIT
              </label>
              <input
                type="text"
                placeholder="CUIT del titular"
                className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40"
                value={formData.banco_cuit}
                onChange={(e) => handleInputChange('banco_cuit', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-manso-terra" />
            <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
              Notificaciones
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                placeholder="Número de WhatsApp (con código país)"
                className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40"
                value={formData.whatsapp_numero}
                onChange={(e) => handleInputChange('whatsapp_numero', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Email para notificaciones"
                className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40"
                value={formData.email_notificaciones}
                onChange={(e) => handleInputChange('email_notificaciones', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
              Mensaje de Confirmación
            </label>
            <textarea
              placeholder="Mensaje que se enviará automáticamente a los clientes"
              className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none h-20 resize-none text-manso-cream placeholder:text-manso-cream/40"
              value={formData.whatsapp_mensaje_confirmacion}
              onChange={(e) => handleInputChange('whatsapp_mensaje_confirmacion', e.target.value)}
            />
          </div>
        </div>

        {/* Configuración Adicional */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-manso-terra" />
            <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
              Configuración Adicional
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-manso-cream/60 mb-2">
              Tiempo de Entrega
            </label>
            <input
              type="text"
              placeholder="Ej: 3-5 días hábiles"
              className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40"
              value={formData.tiempo_entrega}
              onChange={(e) => handleInputChange('tiempo_entrega', e.target.value)}
            />
          </div>
        </div>

        {/* Vista Previa */}
        <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10">
          <h4 className="text-sm font-black uppercase tracking-wider text-manso-cream/60 mb-4">
            Vista Previa de Datos Bancarios
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-manso-cream/60">Banco:</span>
              <span className="text-manso-cream font-bold">{formData.banco_nombre || 'No configurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-manso-cream/60">CBU:</span>
              <span className="text-manso-cream font-mono">{formData.banco_cbu || 'No configurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-manso-cream/60">Alias:</span>
              <span className="text-manso-cream font-bold">{formData.banco_alias || 'No configurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-manso-cream/60">Titular:</span>
              <span className="text-manso-cream font-bold">{formData.banco_titular || 'No configurado'}</span>
            </div>
          </div>
        </div>

        {/* Mensaje de feedback */}
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Botón de guardar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-manso-cream border-t-transparent rounded-full animate-spin"></div>
              GUARDANDO...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              GUARDAR CONFIGURACIÓN
            </>
          )}
        </button>
      </div>
    </div>
  );
}
