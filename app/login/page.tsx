'use client';

import { useState } from 'react';
import { loginAction } from './actions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (from) formData.append('from', from);

    try {
      const result = await loginAction(null, formData);
      if (result?.error) setMessage(result.error);
    } catch {
      // redirect() lanza una excepción, es comportamiento esperado
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-6 pt-24" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="w-full max-w-sm bg-manso-cream/5 p-10 rounded-[40px] border border-manso-cream/10 shadow-2xl">
        <div className="text-center mb-10">
          <img src="/manso.png" alt="Manso Club" className="h-16 w-auto mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-manso-cream">Manso<span className="cursor-blink">_</span></h1>
          <p className="text-[9px] font-bold text-manso-cream/40 uppercase tracking-[0.4em] mt-2">Acceso Exclusivo</p>
        </div>

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
          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full p-5 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[9px] text-manso-cream/40 mt-4 uppercase tracking-widest">
          <Link href="/recuperar-contrasena" className="hover:text-manso-cream transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="text-center text-[9px] text-manso-cream/30 mt-3 uppercase tracking-widest">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-manso-terra hover:text-manso-cream transition-colors">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
