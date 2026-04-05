import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  manifiesto: ['/manifiesto'],
  membresias_config: ['/membresias'],
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: role } = await supabase.rpc('get_user_role', { user_id: user.id });
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let table: string | undefined;
  try {
    const body = await request.json();
    table = body?.table;
  } catch { /* no body */ }

  const paths = table && TABLE_PATHS[table]
    ? TABLE_PATHS[table]
    : [...new Set(Object.values(TABLE_PATHS).flat())];

  for (const path of paths) {
    revalidatePath(path, 'page');
  }

  return NextResponse.json({ revalidated: true, paths });
}
