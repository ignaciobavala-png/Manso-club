'use client';

import { useState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const result = await loginAction(null, formData);

      // Si llegamos aquí, el login falló (el redirect exitoso no retorna)
      if (result?.error) {
        setMessage('❌ ' + result.error);
      }
    } catch {
      // redirect() puede lanzar en algunos casos, es comportamiento esperado
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-zinc-50 p-10 rounded-[40px] border border-zinc-100 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase" style={{color: '#1D1D1B'}}>Manso_</h1>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.4em] mt-2">Acceso Admin</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-xs">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="EMAIL" 
            className="w-full p-5 bg-white border border-zinc-200 rounded-2xl outline-none font-bold text-xs"
            style={{color: '#1D1D1B'}}
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="PASSWORD" 
            className="w-full p-5 bg-white border border-zinc-200 rounded-2xl outline-none font-bold text-xs"
            style={{color: '#1D1D1B'}}
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all disabled:opacity-50"
            style={{backgroundColor: '#1D1D1B', color: '#FFFCDC'}}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
