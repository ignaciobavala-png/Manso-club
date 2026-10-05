import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createSupabaseAnon } from '@/lib/supabase';
import { og, OG_IMAGE, descripcion } from '@/lib/seo';
import { SITE_URL } from '@/lib/constants';
import { JsonLd } from '@/components/SEO/JsonLd';

interface Props {
  params: Promise<{ id: string }>;
}

// La metadata y el layout piden el mismo producto: `cache` hace una sola consulta.
const getProducto = cache(async (id: string) => {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('productos')
    .select('nombre, descripcion, imagenes_urls, precio, moneda, stock, visibilidad')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const producto = await getProducto(id);

  if (!producto) {
    return { title: 'Producto | Manso Club' };
  }

  const desc = descripcion(producto.descripcion) ?? `${producto.nombre} — Merchandising de Manso Club.`;

  return {
    title: `${producto.nombre} | Manso Club`,
    description: desc,
    openGraph: og({
      title: `${producto.nombre} | Manso Club`,
      description: desc,
      images: producto.imagenes_urls?.length
        ? [{ url: producto.imagenes_urls[0] }]
        : [OG_IMAGE],
    }),
    twitter: {
      card: 'summary_large_image',
      title: `${producto.nombre} | Manso Club`,
      description: desc,
      images: producto.imagenes_urls?.length
        ? [producto.imagenes_urls[0]]
        : ['/og-image.png'],
    },
  };
}

/**
 * La ficha es un client component que busca el producto en el navegador, así
 * que sin este chequeo un id inexistente respondía 200 con la página vacía y
 * Google la indexaba. Acá se resuelve en el servidor: 404 de verdad.
 */
export default async function ProductoLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { id } = await params;
  const producto = await getProducto(id);
  if (!producto) notFound();

  return (
    <>
      {producto.visibilidad === 'publico' && (
        <JsonLd
          data={{
            '@type': 'Product',
            name: producto.nombre,
            url: `${SITE_URL}/producto/${id}`,
            ...(producto.descripcion && { description: descripcion(producto.descripcion, 500) }),
            ...(producto.imagenes_urls?.length && { image: producto.imagenes_urls }),
            brand: { '@type': 'Brand', name: 'Manso Club' },
            offers: {
              '@type': 'Offer',
              price: producto.precio,
              priceCurrency: producto.moneda === 'ARS' ? 'ARS' : 'USD',
              availability:
                producto.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
              url: `${SITE_URL}/producto/${id}`,
            },
          }}
        />
      )}
      {children}
    </>
  );
}
