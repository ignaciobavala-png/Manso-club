import { NextResponse } from 'next/server';

/**
 * Le avisa a Manso Gestión que una membresía se activó o se canceló.
 *
 * Gestión es la dueña de la llave del cowork: acá no se decide quién entra,
 * solo se informa qué se vendió. Esta ruta existe porque el panel es un
 * componente de cliente y el secreto compartido no puede viajar al navegador.
 *
 * Es el mismo puente que ya usaban /api/gestion/* para leer eventos, ahora en
 * la dirección contraria.
 *
 * Si falla, falla en silencio para el panel: que gestión esté caída no puede
 * impedir que Ana active una membresía. La membresía queda bien guardada acá y
 * la llave se recupera después resincronizando — por eso `ref` es el id de
 * user_membresias_activas y no un número de intento: reenviarlo corrige en
 * lugar de duplicar.
 */

interface Cuerpo {
  accion: 'emitir' | 'anular';
  ref: string;
  email?: string;
  nombre?: string;
  desde?: string;
  hasta?: string | null;
  plan?: string;
  precio?: number;
  pagina_user_id?: string;
  telefono?: string;
}

export async function POST(req: Request) {
  const base = process.env.GESTION_API_URL;
  const secreto = process.env.GESTION_CRM_SECRET;

  if (!base || !secreto) {
    return NextResponse.json({ error: 'Falta configurar el puente con gestión' }, { status: 500 });
  }

  let cuerpo: Cuerpo;
  try {
    cuerpo = await req.json() as Cuerpo;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (!cuerpo.ref) {
    return NextResponse.json({ error: 'Falta ref' }, { status: 400 });
  }

  try {
    const res = await fetch(`${base}/api/cowork/llave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-crm-secret': secreto,
      },
      body: JSON.stringify({ ...cuerpo, moneda: 'USD' }),
      cache: 'no-store',
    });

    const datos = await res.json().catch(() => ({}));
    return NextResponse.json(datos, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'No se pudo hablar con gestión' },
      { status: 502 }
    );
  }
}
