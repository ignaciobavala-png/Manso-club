import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { render } from "react-email";
import CampaniaGenerica, { type BloqueMailing } from "@/emails/campania-generica";

/**
 * Devuelve el HTML del mail tal como se vería, para la vista previa del editor.
 *
 * A diferencia de /send y /send-test, NO procesa los bloques canvas: no corta
 * la imagen con sharp ni sube rebanadas al storage. El template ya contempla
 * este caso y dibuja el canvas como una imagen entera (sin zonas clickeables),
 * que es exactamente lo que se quiere para previsualizar. Por eso responde en
 * milisegundos y se puede llamar en cada cambio del formulario.
 */
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: role } = await supabase.rpc("get_user_role", { user_id: user.id });
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let cuerpo: {
    asunto?: string;
    preheader?: string;
    bloques?: BloqueMailing[];
    colorFondo?: string;
  };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!Array.isArray(cuerpo.bloques)) {
    return NextResponse.json({ error: "Faltan los bloques" }, { status: 400 });
  }

  try {
    const html = await render(
      CampaniaGenerica({
        asunto: cuerpo.asunto?.trim() || "(sin asunto)",
        bloques: cuerpo.bloques,
        // En la previa el link de baja no lleva a ningún lado: el mail todavía
        // no existe y no hay destinatario al que dar de baja.
        unsubscribeUrl: "#",
        colorFondo: cuerpo.colorFondo,
        preheader: cuerpo.preheader?.trim() || undefined,
      })
    );
    return NextResponse.json({ html });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar la vista previa";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
