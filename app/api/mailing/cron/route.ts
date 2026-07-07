import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarCampania, reclamarCampania } from "@/lib/mailing-send";

export const maxDuration = 300;

/**
 * Cron de campañas programadas: dispara las que tienen scheduled_at vencido.
 * Cada campaña se "reclama" pasándola a estado 'enviada' condicionado a que
 * siga 'programada' — así una corrida solapada o un envío manual simultáneo
 * no la duplican. Si el envío falla, vuelve a 'borrador' para revisión.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: vencidas, error } = await supabase
    .from("mailing_campanias")
    .select("*")
    .eq("estado", "programada")
    .lte("scheduled_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resultados: { id: string; asunto: string; ok: boolean; detalle: string }[] = [];

  for (const campania of vencidas ?? []) {
    // Reclamo atómico compartido con el envío manual: solo un disparador
    // (cron o botón "Enviar ya") se queda con la campaña
    const reclamada = await reclamarCampania(supabase, campania.id);
    if (!reclamada) continue; // otra corrida (o un envío manual) ya la tomó

    try {
      const { enviados, fallidos } = await enviarCampania(supabase, reclamada);
      resultados.push({
        id: campania.id,
        asunto: campania.asunto,
        ok: true,
        detalle: `${enviados} enviados${fallidos ? `, ${fallidos} fallidos` : ""}`,
      });
    } catch (err) {
      // Devolver a borrador para que el admin la revise y reintente
      await supabase
        .from("mailing_campanias")
        .update({ estado: "borrador", scheduled_at: null })
        .eq("id", campania.id);
      const message = err instanceof Error ? err.message : "Error desconocido";
      resultados.push({ id: campania.id, asunto: campania.asunto, ok: false, detalle: message });
    }
  }

  return NextResponse.json({ ok: true, procesadas: resultados.length, resultados });
}
