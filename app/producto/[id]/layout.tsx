import type { Metadata } from 'next';
import { createSupabaseAnon } from '@/lib/supabase';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const supabase = createSupabaseAnon();
  const { data: producto } = await supabase
    .from('productos')
    .select('nombre, descripcion, imagenes_urls')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (!producto) {
    return { title: 'Producto | Manso Club' };
  }

  return {
    title: `${producto.nombre} | Manso Club`,
    description: producto.descripcion || `${producto.nombre} — Merchandising de Manso Club.`,
    openGraph: {
      title: `${producto.nombre} | Manso Club`,
      description: producto.descripcion || `${producto.nombre} — Merchandising de Manso Club.`,
      images: producto.imagenes_urls?.length
        ? [{ url: producto.imagenes_urls[0], width: 800, height: 800 }]
        : [{ url: '/manso-logo-black.png', width: 800, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${producto.nombre} | Manso Club`,
      description: producto.descripcion || `${producto.nombre} — Merchandising de Manso Club.`,
      images: producto.imagenes_urls?.length
        ? [producto.imagenes_urls[0]]
        : ['/manso-logo-black.png'],
    },
  };
}

export default function ProductoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
