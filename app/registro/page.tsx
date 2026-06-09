'use client';

import { useActionState, useState } from 'react';
import { registroAction } from './actions';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function RegistroPage() {
  const [state, action, pending] = useActionState(registroAction, null);
  const [showPassword, setShowPassword] = useState(false);

  if (state?.confirmacion) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center p-6 pt-24" style={{ backgroundColor: '#1D1D1B' }}>
        <div className="w-full max-w-sm bg-manso-cream/5 p-10 rounded-[40px] border border-manso-cream/10 shadow-2xl text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">
            Revisá tu email
          </h2>
          <p className="text-xs text-manso-cream/50 leading-relaxed mb-8">
            Te enviamos un link de confirmación. Hacé click en él para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block w-full p-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all text-center"
          >
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-6 pt-24" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="w-full max-w-sm bg-manso-cream/5 p-10 rounded-[40px] border border-manso-cream/10 shadow-2xl">
        <div className="text-center mb-8">
          <img src="/manso.png" alt="Manso Club" className="h-16 w-auto mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-manso-cream">
            Crear cuenta<span className="cursor-blink">_</span>
          </h1>
          <p className="text-[9px] font-bold text-manso-cream/40 uppercase tracking-[0.4em] mt-2">
            Comunidad Manso
          </p>
        </div>

        {state?.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium text-center">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-3">
          <input
            type="text"
            name="display_name"
            placeholder="NOMBRE"
            required
            className="w-full p-5 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
          />
          <input
            type="email"
            name="email"
            placeholder="EMAIL"
            required
            className="w-full p-5 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="CONTRASEÑA (mín. 8 caracteres)"
              required
              minLength={8}
              className="w-full p-5 bg-manso-cream/10 border border-manso-cream/20 rounded-2xl outline-none font-bold text-xs text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra transition-all pr-14"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-manso-cream/30 hover:text-manso-cream/60 text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              {showPassword ? 'OCULTAR' : 'VER'}
            </button>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {pending ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-manso-cream/10" />
          <span className="text-[9px] font-bold text-manso-cream/30 uppercase tracking-widest">o</span>
          <div className="flex-1 h-px bg-manso-cream/10" />
        </div>

        <GoogleSignInButton />

        <p className="text-center text-[9px] text-manso-cream/30 mt-5 uppercase tracking-widest">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-manso-terra hover:text-manso-cream transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
