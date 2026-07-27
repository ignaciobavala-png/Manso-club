import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { procesarBloquesCanvas } from "@/lib/email-canvas";
import CampaniaGenerica, { type BloqueMailing } from "@/emails/campania-generica";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: role } = await supabase.rpc("get_user_role", { user_id: user.id });
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { campaniaId, destinatarios } = await request.json();
  if (!campaniaId || !Array.isArray(destinatarios) || destinatarios.length === 0) {
    return NextResponse.json({ error: "Faltan campaniaId o destinatarios" }, { status: 400 });
  }

  const { data: campania, error: campaniaError } = await supabase
    .from("mailing_campanias")
    .select("*")
    .eq("id", campaniaId)
    .single();

  if (campaniaError || !campania) {
    return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  }

  // Procesar bloques canvas (corta la imagen y sube rebanadas al storage)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  let bloques: BloqueMailing[];
  try {
    bloques = await procesarBloquesCanvas(admin, campania.id, campania.bloques as BloqueMailing[]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error procesando el canvas";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manso.club";

  try {
    const { data, error } = await resend.batch.send(
      destinatarios.map((email: string) => ({
        from: EMAIL_FROM,
        to: email,
        subject: `[PRUEBA] ${campania.asunto}`,
        react: CampaniaGenerica({
          asunto: `[PRUEBA] ${campania.asunto}`,
          bloques,
          unsubscribeUrl: `${siteUrl}/api/mailing/unsubscribe?email=${encodeURIComponent(email)}`,
        }),
      }))
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ enviados: data?.data.length ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar la prueba";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
