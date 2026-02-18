'use client';

import { useState } from 'react';
import { Eye, EyeOff, Settings, Check, X, AlertTriangle } from 'lucide-react';
import { createSupabaseAnon } from '../../lib/supabase';

export function ConfiguracionPanel() {
  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [modoSandbox, setModoSandbox] = useState(true);
  const [emailContacto, setEmailContacto] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadConfig = async () => {
    try {
      const supabase = createSupabaseAnon();
      const { data, error } = await supabase
        .from('configuracion')
        .select('clave, valor')
        .in('clave', ['mp_access_token', 'mp_public_key', 'mp_modo_sandbox', 'email_contacto', 'whatsapp']);

      if (error) throw error;

      data?.forEach(item => {
        switch (item.clave) {
          case 'mp_access_token':
            setAccessToken(item.valor || '');
            break;
          case 'mp_public_key':
            setPublicKey(item.valor || '');
            break;
          case 'mp_modo_sandbox':
            setModoSandbox(item.valor === 'true');
            break;
          case 'email_contacto':
            setEmailContacto(item.valor || '');
            break;
          case 'whatsapp':
            setWhatsapp(item.valor || '');
            break;
        }
      });
    } catch (error) {
      console.error('Error cargando configuración:', error);
      showMessage('error', 'Error al cargar configuración guardada');
    }
  };

  const testConnection = async () => {
    if (!accessToken) {
      showMessage('error', 'Debes ingresar el Access Token para probar la conexión');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/mp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.ok) {
        showMessage('success', `✓ Conectado a Mercado Pago como: ${result.nombre}`);
      } else {
        showMessage('error', `✗ Error de conexión: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', '✗ Error de conexión con el servidor');
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    if (!accessToken || !publicKey) {
      showMessage('error', 'Access Token y Public Key son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseAnon();
      const configData = [
        { clave: 'mp_access_token', valor: accessToken },
        { clave: 'mp_public_key', valor: publicKey },
        { clave: 'mp_modo_sandbox', valor: modoSandbox.toString() },
        { clave: 'email_contacto', valor: emailContacto },
        { clave: 'whatsapp', valor: whatsapp },
      ];

      // Upsert configuration
      for (const config of configData) {
        const { error } = await supabase
          .from('configuracion')
          .upsert(config, { onConflict: 'clave' });
        
        if (error) throw error;
      }

      showMessage('success', '✓ Configuración guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      showMessage('error', 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  // Load configuration on mount
  useState(() => {
    loadConfig();
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="text-manso-cream" size={24} />
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-manso-cream">
            Configuración Mercado Pago
          </h2>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {message.type === 'success' ? <Check size={20} /> : 
             message.type === 'error' ? <X size={20} /> : 
             <AlertTriangle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Access Token */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-2">
              Access Token
            </label>
            <div className="relative">
              <input
                type={showAccessToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-4 py-3 bg-manso-black/50 border border-manso-cream/20 rounded-xl text-manso-cream placeholder-manso-cream/40 focus:outline-none focus:border-manso-cream/40 transition-colors pr-12"
                placeholder="APP_USR-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-manso-cream/60 hover:text-manso-cream transition-colors"
              >
                {showAccessToken ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-[9px] text-manso-cream/40 mt-1 ml-2">Token de acceso privado (nunca se expone al frontend)</p>
          </div>

          {/* Public Key */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-2">
              Public Key
            </label>
            <div className="relative">
              <input
                type={showPublicKey ? 'text' : 'password'}
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="w-full px-4 py-3 bg-manso-black/50 border border-manso-cream/20 rounded-xl text-manso-cream placeholder-manso-cream/40 focus:outline-none focus:border-manso-cream/40 transition-colors pr-12"
                placeholder="TEST-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowPublicKey(!showPublicKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-manso-cream/60 hover:text-manso-cream transition-colors"
              >
                {showPublicKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-[9px] text-manso-cream/40 mt-1 ml-2">Clave pública para el frontend</p>
          </div>

          {/* Modo Sandbox/Producción */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={modoSandbox}
                onChange={(e) => setModoSandbox(e.target.checked)}
                className="w-5 h-5 rounded border-manso-cream/40 bg-manso-black/50 text-manso-cream focus:ring-manso-cream/40 focus:ring-2"
              />
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/60">
                  Modo Sandbox
                </span>
                <p className="text-[9px] text-manso-cream/40 mt-0.5">
                  {modoSandbox ? '✓ Modo prueba activado' : '⚠️ MODO PRODUCCIÓN - Pagos reales'}
                </p>
              </div>
            </label>
            {!modoSandbox && (
              <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <p className="text-xs text-red-400 font-medium">
                  Estás en modo producción. Se procesarán pagos reales.
                </p>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-2">
                Email Contacto
              </label>
              <input
                type="email"
                value={emailContacto}
                onChange={(e) => setEmailContacto(e.target.value)}
                className="w-full px-4 py-3 bg-manso-black/50 border border-manso-cream/20 rounded-xl text-manso-cream placeholder-manso-cream/40 focus:outline-none focus:border-manso-cream/40 transition-colors"
                placeholder="contacto@manso.club"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 bg-manso-black/50 border border-manso-cream/20 rounded-xl text-manso-cream placeholder-manso-cream/40 focus:outline-none focus:border-manso-cream/40 transition-colors"
                placeholder="+5491112345678"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={testConnection}
              disabled={testing || !accessToken}
              className="flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-manso-cream/10 text-manso-cream border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-cream/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Probando...' : 'Probar Conexión'}
            </button>
            <button
              onClick={saveConfig}
              disabled={loading || !accessToken || !publicKey}
              className="flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
