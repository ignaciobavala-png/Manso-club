import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resend, EMAIL_FROM } from "@/lib/resend";
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

  const template = CampaniaGenerica({
    asunto: `[PRUEBA] ${campania.asunto}`,
    bloques: campania.bloques as BloqueMailing[],
  });

  const { data, error } = await resend.batch.send(
    destinatarios.map((email: string) => ({
      from: EMAIL_FROM,
      to: email,
      subject: `[PRUEBA] ${campania.asunto}`,
      react: template,
    }))
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ enviados: data?.data.length ?? 0 });
}
