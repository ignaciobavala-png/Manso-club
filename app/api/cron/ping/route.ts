import { NextResponse } from 'next/server';
import { createSupabaseAnon } from '@/lib/supabase';

export async function GET(request: Request) {
  // Verificar que es una llamada autorizada de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAnon();
    // Query liviana — solo trae 1 registro
    const { error } = await supabase
      .from('site_config')
      .select('key')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      message: 'Supabase ping exitoso'
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
