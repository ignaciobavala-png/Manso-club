// app/tienda/page.tsx
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';

import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { createSupabaseAnon, createSupabaseServer } from '@/lib/supabase';
import { ProductCard } from '@/components/shop/ProductCard';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import Link from 'next/link';
import { Users, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tienda | Manso Club',
  description: 'Merchandising y productos de Manso Club. Indumentaria, accesorios y más.',
  openGraph: {
    title: 'Tienda | Manso Club',
    description: 'Merchandising y productos de Manso Club.',
    images: [{ url: '/og-image.png', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tienda | Manso Club',
    description: 'Merchandising y productos de Manso Club.',
    images: ['/og-image.png'],
  },
};

type Nivel = 'publico' | 'registrado' | 'miembro';

const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};

export default async function TiendaPage() {
  // Determinar nivel del usuario
  const supabaseServer = await createSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  let nivel: Nivel = 'publico';
  if (user) {
    const { data: profile } = await supabaseServer
      .from('user_profiles')
      .select('membresia_activa, membresia_hasta')
      .eq('id', user.id)
      .single();

    const activa = profile?.membresia_activa ?? false;
    const hasta  = profile?.membresia_hasta ?? null;
    nivel = activa && (!hasta || new Date(hasta) > new Date()) ? 'miembro' : 'registrado';
  }

  const nivelesVisibles = NIVELES_VISIBLES[nivel];

  const supabase = createSupabaseAnon();

  const [productosRes, todasVisibilidades] = await Promise.all([
    supabase
      .from('productos')
      .select('*')
      .in('visibilidad', nivelesVisibles)
      .order('created_at', { ascending: false }),
    nivel !== 'miembro'
      ? supabase.from('productos').select('visibilidad')
      : Promise.resolve({ data: [] }),
  ]);

  const productos = productosRes.data || [];
  const hayOcultos = nivel !== 'miembro' && (todasVisibilidades.data || []).some(
    (p: { visibilidad: string }) => !nivelesVisibles.includes(p.visibilidad)
  );

  return (
    <AdaptiveSectionLayout title="Tienda" subtitle="objetos curados / emprendedores locales">
      <div className="flex justify-start mb-6">
        <CurrencyToggle />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 py-6 sm:py-10">
        {productos.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>

      {hayOcultos && (
        <div className={`flex items-center gap-4 p-5 rounded-2xl border mt-4 ${
          nivel === 'publico'
            ? 'bg-manso-blue/10 border-manso-blue/30'
            : 'bg-manso-terra/10 border-manso-terra/30'
        }`}>
          {nivel === 'publico'
            ? <Users size={20} className="text-manso-blue shrink-0" />
            : <Lock size={20} className="text-manso-terra shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-manso-cream">
              {nivel === 'publico'
                ? 'Hay productos exclusivos para miembros registrados'
                : 'Hay productos exclusivos para miembros'}
            </p>
            <p className="text-xs text-manso-cream/50 mt-0.5">
              {nivel === 'publico'
                ? 'Creá tu cuenta gratis para acceder'
                : 'Activá tu membresía para desbloquearlos'}
            </p>
          </div>
          <Link
            href={nivel === 'publico' ? '/login' : '/membresias'}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              nivel === 'publico'
                ? 'bg-manso-blue text-manso-cream hover:bg-manso-blue/80'
                : 'bg-manso-terra text-manso-cream hover:bg-manso-terra/80'
            }`}
          >
            {nivel === 'publico' ? 'Registrarse' : 'Ver membresías'}
          </Link>
        </div>
      )}
    </AdaptiveSectionLayout>
  );
}