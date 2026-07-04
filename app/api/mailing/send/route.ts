import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { resolverAudiencia, type Audiencia } from "@/lib/mailing-audiencias";
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

  const { campaniaId } = await request.json();
  if (!campaniaId) {
    return NextResponse.json({ error: "Falta campaniaId" }, { status: 400 });
  }

  const { data: campania, error: campaniaError } = await supabase
    .from("mailing_campanias")
    .select("*")
    .eq("id", campaniaId)
    .single();

  if (campaniaError || !campania) {
    return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  }

  if (campania.estado === "enviada") {
    return NextResponse.json({ error: "Esta campaña ya fue enviada" }, { status: 400 });
  }

  const destinatarios = await resolverAudiencia(supabase, campania.audiencia as Audiencia);

  if (destinatarios.length === 0) {
    return NextResponse.json({ error: "La audiencia seleccionada no tiene destinatarios" }, { status: 400 });
  }

  const template = CampaniaGenerica({
    asunto: campania.asunto,
    bloques: campania.bloques as BloqueMailing[],
  });

  const BATCH_SIZE = 100;
  const envios: { destinatario: string; estado: string; resend_id: string | null }[] = [];

  for (let i = 0; i < destinatarios.length; i += BATCH_SIZE) {
    const lote = destinatarios.slice(i, i + BATCH_SIZE);
    const { data, error } = await resend.batch.send(
      lote.map((email) => ({
        from: EMAIL_FROM,
        to: email,
        subject: campania.asunto,
        react: template,
      }))
    );

    if (error) {
      lote.forEach((email) => envios.push({ destinatario: email, estado: "failed", resend_id: null }));
      continue;
    }

    (data?.data ?? []).forEach((r, idx) => {
      envios.push({ destinatario: lote[idx], estado: "enviado", resend_id: r.id });
    });
  }

  await supabase.from("mailing_envios").insert(
    envios.map((e) => ({ campania_id: campaniaId, destinatario: e.destinatario, estado: e.estado, resend_id: e.resend_id }))
  );

  await supabase
    .from("mailing_campanias")
    .update({ estado: "enviada", sent_at: new Date().toISOString() })
    .eq("id", campaniaId);

  return NextResponse.json({ enviados: envios.filter((e) => e.estado === "enviado").length, fallidos: envios.filter((e) => e.estado === "failed").length });
}
