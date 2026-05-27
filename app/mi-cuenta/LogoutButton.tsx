'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full p-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-manso-cream/20 text-manso-cream/50 hover:border-manso-terra hover:text-manso-terra transition-all active:scale-95"
    >
      Cerrar sesión
    </button>
  );
}
