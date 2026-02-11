import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export  function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Error: " + error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-zinc-100">
        <h2 className="text-2xl font-bold mb-6 text-zinc-900">Manso Admin</h2>
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email" 
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <input 
            type="password" placeholder="Contraseña" 
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            value={password} onChange={e => setPassword(e.target.value)} required
          />
          <button 
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95"
          >
            {loading ? 'Validando...' : 'Entrar al Club'}
          </button>
        </div>
      </form>
    </div>
  );
}