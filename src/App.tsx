import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
// Tipado oficial de Supabase para evitar el 'any'
import type { Session } from '@supabase/supabase-js';

// Iconos (Asegúrate de tener instalada lucide-react)
import { 
  Instagram, 
  MessageCircle, 
  Mail, 
} from 'lucide-react';

// Componentes
import { Navbar } from './components/Layout/Navbar';
import { Hero } from './components/Home/Hero';
import { Manifesto } from './components/Home/Manifesto';
import { EventList } from './components/Home/EventList'; 
import { SectionsGrid } from './components/Home/SectionsGrid';
import { Dashboard } from './components/admin/Dashboard';
import { Login } from './components/admin/Login';
import { WhatsAppButton } from './components/UI/WhatsAppButton'; // Importación del nuevo botón

function App() {
  // Tipado estricto para la sesión
  const [session, setSession] = useState<Session | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Vista de Administración
  if (session) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-white selection:bg-orange-100 selection:text-orange-900">
      <Navbar />
      
      <main>
        {/* Identidad de marca */}
        <Hero />
        <section id="manifesto" className="bg-black">
          <Manifesto />
        </section>

        {/* Layout Split-Screen: Agenda y Tienda */}
        <div className="flex flex-col lg:flex-row w-full border-t border-zinc-100">
          
          {/* Columna Agenda (40%) */}
          <section id="agenda" className="w-full lg:w-[40%] bg-white lg:border-r border-zinc-100">
            <div className="lg:sticky lg:top-20 p-8 md:p-12 lg:p-16">
              <header className="mb-12">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Agenda_</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2">Próximos Encuentros</p>
              </header>
              <div className="max-h-[70vh] lg:max-h-none overflow-y-auto no-scrollbar">
                <EventList />
              </div>
            </div>
          </section>

          {/* Columna Shop (60%) */}
          <section id="shop" className="w-full lg:w-[60%] bg-zinc-50/40">
            <div className="p-8 md:p-12 lg:p-16">
              <header className="mb-12">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Eventos</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2">Curaduría Manso Club</p>
              </header>
              <SectionsGrid />
            </div>
          </section>
        </div>
      </main>

      {/* Footer Final Organizado */}
      <footer className="w-full bg-white border-t border-zinc-100 pt-24 pb-12">
        <div className="px-8 md:px-12 lg:px-16">
          
          {/* Grilla de Información */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            
            {/* Social */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Social_</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="flex items-center gap-2 text-xs font-bold uppercase hover:text-orange-600 transition-colors">
                  <Instagram size={14} /> Instagram
                </a>
                <a href="#" className="flex items-center gap-2 text-xs font-bold uppercase hover:text-green-600 transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Contacto */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Contacto_</h4>
              <div className="flex flex-col gap-2">
                <a href="mailto:mansoclub@proton.me" className="flex items-center gap-2 text-xs font-bold uppercase hover:underline">
                  <Mail size={14} /> mansoclub@proton.me
                </a>
              
              </div>
            </div>

            {/* Acerca de */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Manso_Club_</h4>
            
            </div>
          </div>

          {/* Copyright y Acceso Admin */}
          <div className="pt-12 border-t border-zinc-50 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.5em]">
              © 2026 MANSO CLUB • TODOS LOS DERECHOS RESERVADOS
            </p>

            {!showAdminLogin ? (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="text-zinc-200 hover:text-orange-500 text-[9px] font-black uppercase tracking-[0.4em] transition-all"
              >
                — ACCESO RESTRINGIDO —
              </button>
            ) : (
              <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <Login />
                <button 
                  onClick={() => setShowAdminLogin(false)}
                  className="mt-6 text-[9px] font-bold text-zinc-400 uppercase underline block mx-auto"
                >
                  Cerrar Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp */}
      <WhatsAppButton /> 
    </div>
  );
}

export default App;