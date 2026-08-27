'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setMessage(error.message || 'No se pudo enviar el email. Verificá que la dirección sea correcta.');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-6 pt-24" style={{ backgroundColor: '#000000' }}>
      <div className="w-full max-w-sm bg-manso-cream/5 p-10 rounded-[40px] border border-manso-cream/10 shadow-2xl">
        <div className="text-center mb-10">
          <img src="/manso.png" alt="Manso Club" className="h-16 w-auto mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-manso-cream">Manso<span>_</span></h1>
          <p className="text-[9px] font-bold text-manso-cream/40 uppercase tracking-[0.4em] mt-2">Recuperar contraseña</p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-medium">
              Te enviamos un link a <span className="text-manso-cream">{email}</span>. Revisá tu bandeja de entrada.
            </div>
            <Link
              href="/login"
              className="block w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all text-center"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-manso-cream/50 text-center mb-6 leading-relaxed uppercase tracking-wider">
              Ingresá tu email y te enviamos un link para restablecer tu contraseña.
            </p>

            {message && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="EMAIL"
                className="w-full p-5 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <p className="text-center text-[9px] text-manso-cream/30 mt-6 uppercase tracking-widest">
              <Link href="/login" className="text-manso-terra hover:text-manso-cream transition-colors">
                Volver al login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
