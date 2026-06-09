import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  const type = searchParams.get('type');

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === 'recovery') {
        await supabase.rpc('set_password_reset_pending', { pending: true });
        return NextResponse.redirect(`${origin}/actualizar-contrasena?recovery=1`);
      }
      return NextResponse.redirect(`${origin}/mi-cuenta`);
    }
  }

  return NextResponse.redirect(`${origin}/recuperar-contrasena?error=link-invalido`);
}
