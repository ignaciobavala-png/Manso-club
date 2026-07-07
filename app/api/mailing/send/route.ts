import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { enviarCampania } from "@/lib/mailing-send";

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

  // Service role: el envío escribe en storage (rebanadas del canvas) y en
  // mailing_envios; mantiene el mismo camino que el cron.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: campania, error: campaniaError } = await admin
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

  try {
    const resultado = await enviarCampania(admin, campania);
    return NextResponse.json(resultado);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar la campaña";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
