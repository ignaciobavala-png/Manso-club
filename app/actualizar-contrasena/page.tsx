'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Suspense } from 'react';

function ActualizarContrasenaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const isRecovery = searchParams.get('recovery') === '1';
    const isError = searchParams.get('error') === 'link-invalido';

    if (!isRecovery || isError) {
      // Acceso directo sin venir del link — cerrar sesión por seguridad
      supabase.auth.signOut().then(() => {
        setHasSession(false);
        setChecking(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
    });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage('No se pudo actualizar la contraseña. Intentá solicitar un nuevo link.');
    } else {
      await supabase.rpc('set_password_reset_pending', { pending: false });
      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-6 pt-24" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="w-full max-w-sm bg-manso-cream/5 p-10 rounded-[40px] border border-manso-cream/10 shadow-2xl">
        <div className="text-center mb-10">
          <img src="/manso.png" alt="Manso Club" className="h-16 w-auto mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-manso-cream">Manso<span>_</span></h1>
          <p className="text-[9px] font-bold text-manso-cream/40 uppercase tracking-[0.4em] mt-2">Nueva contraseña</p>
        </div>

        {checking && (
          <p className="text-center text-[10px] text-manso-cream/40 uppercase tracking-widest">Verificando...</p>
        )}

        {!checking && !hasSession && (
          <div className="text-center space-y-6">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium">
              El link es inválido o expiró. Solicitá uno nuevo.
            </div>
            <Link
              href="/recuperar-contrasena"
              className="block w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all text-center"
            >
              Solicitar nuevo link
            </Link>
          </div>
        )}

        {!checking && hasSession && success && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-medium">
              ¡Contraseña actualizada! Redirigiendo al login...
            </div>
          </div>
        )}

        {!checking && hasSession && !success && (
          <>
            {message && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium text-center">
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="NUEVA CONTRASEÑA"
                className="w-full p-5 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="CONFIRMAR CONTRASEÑA"
                className="w-full p-5 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ActualizarContrasenaPage() {
  return (
    <Suspense>
      <ActualizarContrasenaForm />
    </Suspense>
  );
}
