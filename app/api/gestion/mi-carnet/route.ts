import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';

/**
 * Devuelve el carnet del cowork del usuario logueado.
 *
 * El id sale de la sesion y nunca de un parametro: quien pega acá solo puede
 * recibir su propio token, que es su identidad en la puerta. Aceptar un id
 * por query o body seria regalarle el carnet de cualquiera a cualquiera.
 */

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const base = process.env.GESTION_API_URL;
  const secreto = process.env.GESTION_CRM_SECRET;

  if (!base || !secreto) {
    return NextResponse.json({ error: 'Falta configurar el puente con gestión' }, { status: 500 });
  }

  try {
    const res = await fetch(`${base}/api/cowork/carnet-de-usuario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-crm-secret': secreto,
      },
      body: JSON.stringify({ pagina_user_id: user.id }),
      cache: 'no-store',
    });

    // Se devuelve tal cual lo que dijo gestión, incluido el 200 con
    // `carnet: null`: para la pantalla, "no tenés carnet" no es un error.
    const datos = await res.json().catch(() => ({}));
    return NextResponse.json(datos, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'No se pudo hablar con gestión' },
      { status: 502 }
    );
  }
}
