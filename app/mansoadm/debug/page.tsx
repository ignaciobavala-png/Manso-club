'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [report, setReport] = useState<any>({
    env: 'Cargando...',
    connection: 'Pendiente',
    session: 'Verificando...',
    cookies: 'Iniciando...'
  });

  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDev) return;

    async function runCheck() {
      const results: any = {};

      results.env = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ CARGADA" : "❌ VACÍA",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ CARGADA" : "❌ VACÍA"
      };

      try {
        const { data, error } = await supabase.from('eventos').select('*').limit(1);
        results.connection = error ? `❌ ERROR: ${error.message}` : "✅ CONECTADO (Tablas accesibles)";
      } catch (e: any) {
        results.connection = `❌ FALLO CRÍTICO: ${e.message}`;
      }

      const { data: { session } } = await supabase.auth.getSession();
      results.session = session 
        ? `✅ LOGUEADO como: ${session.user.email}` 
        : "❌ NO HAY SESIÓN (Usuario no autenticado)";

      results.cookies = document.cookie.includes('sb-') 
        ? "✅ COOKIES DE SUPABASE DETECTADAS" 
        : "⚠️ NO SE ENCONTRARON COOKIES DE AUTH";

      setReport(results);
    }
    runCheck();
  }, [isDev]);

  if (!isDev) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-mono">
        <p>DEBUG DESHABILITADO EN PRODUCCIÓN</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 p-10 font-mono text-xs">
      <h1 className="text-xl font-bold mb-6 border-b border-green-500 pb-2">MANSO_DEBUGGER_V1.0</h1>
      
      <div className="space-y-6">
        <section>
          <p className="text-zinc-500 mb-2">// 01. ENTORNO (.env.local)</p>
          <pre className="bg-zinc-900 p-4 rounded border border-zinc-800">
            {JSON.stringify(report.env, null, 2)}
          </pre>
        </section>

        <section>
          <p className="text-zinc-500 mb-2">// 02. ESTADO DE AUTENTICACIÓN</p>
          <div className="bg-zinc-900 p-4 rounded border border-zinc-800 space-y-2">
            <p>SESIÓN: <span className={report.session?.includes('✅') ? 'text-green-400' : 'text-red-400'}>{report.session}</span></p>
            <p>COOKIES: {report.cookies}</p>
          </div>
        </section>

        <section>
          <p className="text-zinc-500 mb-2">// 03. CONEXIÓN A BASE DE DATOS</p>
          <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
            {report.connection}
          </div>
        </section>

        <button 
          onClick={() => window.location.reload()}
          className="bg-green-600 text-black px-4 py-2 font-bold hover:bg-green-400 mt-4"
        >
          RE-ESCANEAR SISTEMA
        </button>
      </div>
    </div>
  );
}
