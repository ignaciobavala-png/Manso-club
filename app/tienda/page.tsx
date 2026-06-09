// app/tienda/page.tsx
import type { Metadata } from 'next';
export const revalidate = 30;

import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { createSupabaseAnon } from '@/lib/supabase';
import { ProductCard } from '@/components/shop/ProductCard';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';

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

export default async function TiendaPage() {
  const supabase = createSupabaseAnon();
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdaptiveSectionLayout title="Tienda" subtitle="objetos curados / emprendedores locales">
      <div className="flex justify-start mb-6">
        <CurrencyToggle />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 py-6 sm:py-10">
        {productos?.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </AdaptiveSectionLayout>
  );
}