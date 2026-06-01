import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('newsletter_suscriptores')
    .insert({ email: email.toLowerCase().trim() });

  if (error) {
    if (error.code === '23505') {
      // Ya suscripto — devolvemos éxito igual para no revelar si el mail existe
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Error al suscribirse' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
