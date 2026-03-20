import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// Mapa de tabla → rutas a revalidar
const TABLE_PATHS: Record<string, string[]> = {
  artistas: ['/artistas', '/artistas/[slug]', '/'],
  artistas_tracks: ['/artistas', '/artistas/[slug]'],
  artista_fotos: ['/artistas', '/artistas/[slug]'],
  eventos: ['/agenda', '/'],
  agenda: ['/agenda', '/'],
  productos: ['/tienda', '/'],
  gallery: ['/'],
  about_us: ['/about'],
  membresias: ['/membresias', '/'],
};

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let paths: string[] = [];

  try {
    const body = await request.json();
    const table: string | undefined = body?.table;

    if (table && TABLE_PATHS[table]) {
      paths = TABLE_PATHS[table];
    } else {
      // Revalidar todo
      paths = [...new Set(Object.values(TABLE_PATHS).flat())];
    }
  } catch {
    paths = [...new Set(Object.values(TABLE_PATHS).flat())];
  }

  for (const path of paths) {
    revalidatePath(path, 'page');
  }

  return NextResponse.json({ revalidated: true, paths, timestamp: new Date().toISOString() });
}
