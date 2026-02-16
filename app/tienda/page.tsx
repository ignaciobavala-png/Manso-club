// app/tienda/page.tsx
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { createSupabaseAnon } from '@/lib/supabase-anon';
import { ProductCard } from '@/components/shop/ProductCard';

export default async function TiendaPage() {
  const supabase = createSupabaseAnon();
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .eq('active', true);

  return (
    <AdaptiveSectionLayout title="Tienda" subtitle="Objetos de culto_">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-10">
        {productos?.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </AdaptiveSectionLayout>
  );
}