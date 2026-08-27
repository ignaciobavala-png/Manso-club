'use client';

import { useState } from 'react';
import { loginAction } from './actions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ParticleBackground } from '@/components/Home/ParticleBackground';

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
    <div className="fixed inset-0 z-30 flex items-center justify-center p-6 pt-24 overflow-hidden" style={{ backgroundColor: '#000000' }}>
      <ParticleBackground radiusScale={1.8} opacity={0.55} />
      <div className="relative z-10 w-full max-w-sm bg-manso-cream/5 p-8 rounded-[40px] border border-manso-cream/10 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-manso-cream">Manso<span className="cursor-blink">_</span></h1>
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
            className="w-full p-4 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full p-4 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-[9px] text-manso-cream/40 mt-3 uppercase tracking-widest">
          <Link href="/recuperar-contrasena" className="hover:text-manso-cream transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-manso-cream/10" />
          <span className="text-[9px] font-bold text-manso-cream/30 uppercase tracking-widest">o</span>
          <div className="flex-1 h-px bg-manso-cream/10" />
        </div>

        <GoogleSignInButton />

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
