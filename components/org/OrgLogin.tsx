'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function OrgLogin({ cerrada }: { cerrada: boolean }) {
  const router = useRouter();
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/org/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'No se pudo entrar.');
    } catch {
      setError('Sin conexión. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="org org-login">
      <form onSubmit={entrar} className="org-login-caja">
        <h1>Blur <span>·</span> Organización</h1>
        {cerrada ? (
          <p className="org-login-msg">Esta sección todavía no está habilitada.</p>
        ) : (
          <>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              autoFocus
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Clave"
              aria-label="Clave"
            />
            <button type="submit" disabled={enviando || !clave}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
            {error && <p className="org-login-msg" role="alert">{error}</p>}
          </>
        )}
      </form>
    </main>
  );
}
