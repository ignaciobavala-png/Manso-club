import type { MetadataRoute } from 'next';
import { createSupabaseAnon } from '@/lib/supabase';
import { SITE_URL } from '@/lib/constants';

const BASE = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/artistas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/agenda`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/tienda`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/membresias`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/mansocultural`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/nuestro-espacio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/multimedia`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/manifiesto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/presenta-tu-proyecto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/trabaja-con-nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/calendario`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/foro`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
    { url: `${BASE}/streaming`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  const supabase = createSupabaseAnon();
  // Solo lo público: lo que es para registrados o miembros da 404 a Google.
  const [{ data: artistas }, { data: agenda }, { data: membresias }, { data: productos }] = await Promise.all([
    supabase.from('artistas').select('slug, updated_at').eq('active', true),
    supabase
      .from('agenda')
      .select('slug, updated_at')
      .eq('activo', true)
      .eq('visibilidad', 'publico')
      .not('slug', 'is', null),
    supabase.from('membresias').select('slug, updated_at').eq('activo', true).not('slug', 'is', null),
    supabase.from('productos').select('id, created_at').eq('active', true).eq('visibilidad', 'publico'),
  ]);

  const artistRoutes: MetadataRoute.Sitemap = (artistas ?? []).map((a) => ({
    url: `${BASE}/artistas/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const agendaRoutes: MetadataRoute.Sitemap = (agenda ?? []).map((a) => ({
    url: `${BASE}/agenda/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const membresiaRoutes: MetadataRoute.Sitemap = (membresias ?? []).map((m) => ({
    url: `${BASE}/membresias/${m.slug}`,
    lastModified: new Date(m.updated_at),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const productoRoutes: MetadataRoute.Sitemap = (productos ?? []).map((p) => ({
    url: `${BASE}/producto/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...agendaRoutes, ...membresiaRoutes, ...artistRoutes, ...productoRoutes];
}
