// app/tienda/page.tsx
export const revalidate = 30;

import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { createSupabaseAnon } from '@/lib/supabase';
import { ProductCard } from '@/components/shop/ProductCard';

export default async function TiendaPage() {
  const supabase = createSupabaseAnon();
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdaptiveSectionLayout title="Tienda" subtitle="objetos curados / emprendedores locales">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 py-6 sm:py-10">
        {productos?.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </AdaptiveSectionLayout>
  );
}