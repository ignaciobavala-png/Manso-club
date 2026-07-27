import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { resolverAudiencia, type Audiencia } from "@/lib/mailing-audiencias";
import { procesarBloquesCanvas } from "@/lib/email-canvas";
import CampaniaGenerica, { type BloqueMailing } from "@/emails/campania-generica";

export interface CampaniaRow {
  id: string;
  asunto: string;
  audiencia: string;
  bloques: BloqueMailing[];
  estado: string;
  destinatarios_especificos?: string[] | null;
  color_fondo?: string | null;
}

const BATCH_SIZE = 100;

/**
 * Reclamo atómico: pasa la campaña a 'enviada' solo si sigue en
 * 'borrador' o 'programada'. Si dos disparadores compiten por la misma
 * campaña (cron + "Enviar ya", o dos clicks seguidos), solo uno se queda
 * con la fila devuelta — el resto recibe null y no debe enviar nada.
 * Reemplaza al chequeo "leer estado, después decidir" que permitía
 * duplicar el envío entre el cron y el botón manual.
 */
export async function reclamarCampania(
  supabase: SupabaseClient,
  campaniaId: string
): Promise<CampaniaRow | null> {
  const { data } = await supabase
    .from("mailing_campanias")
    .update({ estado: "enviada" })
    .eq("id", campaniaId)
    .in("estado", ["borrador", "programada"])
    .select("*")
    .maybeSingle();
  return data;
}

/**
 * Envío completo de una campaña: resuelve la audiencia, procesa los bloques
 * canvas (corta imágenes y sube rebanadas), envía por lotes y registra los
 * envíos. Compartido entre el envío manual (/api/mailing/send) y el cron.
 *
 * La campaña debe llegar ya reclamada (ver reclamarCampania) — esta función
 * no toca `estado`, solo marca `sent_at` al terminar.
 *
 * `supabase` debe ser un cliente con permisos de escritura sobre
 * mailing_envios / mailing_campanias y el bucket "emails" (service role
 * o sesión de admin).
 */
export async function enviarCampania(
  supabase: SupabaseClient,
  campania: CampaniaRow
): Promise<{ enviados: number; fallidos: number }> {
  const destinatarios = await resolverAudiencia(
    supabase,
    campania.audiencia as Audiencia,
    campania.destinatarios_especificos
  );
  if (destinatarios.length === 0) {
    throw new Error("La audiencia seleccionada no tiene destinatarios");
  }

  const bloques = await procesarBloquesCanvas(supabase, campania.id, campania.bloques);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manso.club";
  const unsubscribeUrl = (email: string) =>
    `${siteUrl}/api/mailing/unsubscribe?email=${encodeURIComponent(email)}`;

  const envios: { destinatario: string; estado: string; resend_id: string | null }[] = [];

  for (let i = 0; i < destinatarios.length; i += BATCH_SIZE) {
    const lote = destinatarios.slice(i, i + BATCH_SIZE);
    // Segunda capa de seguridad además del reclamo atómico: si por lo que
    // sea este lote se reintentara (timeout de red, bug futuro), Resend
    // reconoce la misma idempotencyKey dentro de 24hs y no reenvía.
    const { data, error } = await resend.batch.send(
      lote.map((email) => ({
        from: EMAIL_FROM,
        to: email,
        subject: campania.asunto,
        react: CampaniaGenerica({
          asunto: campania.asunto,
          bloques,
          unsubscribeUrl: unsubscribeUrl(email),
          colorFondo: campania.color_fondo ?? undefined,
        }),
      })),
      { idempotencyKey: `mailing-${campania.id}-batch-${i}` }
    );

    const loteEnvios = error
      ? lote.map((email) => ({ destinatario: email, estado: "failed", resend_id: null }))
      : (data?.data ?? []).map((r, idx) => ({ destinatario: lote[idx], estado: "enviado", resend_id: r.id }));

    // Insertar cada lote apenas se manda, no acumular hasta el final: el
    // webhook de Resend puede llegar (delivered/bounced) mientras todavía
    // se están mandando los lotes siguientes, y si la fila de mailing_envios
    // no existe todavía, el update por resend_id no encuentra nada y la
    // auto-exclusión de rebotados se pierde en silencio.
    await supabase.from("mailing_envios").insert(
      loteEnvios.map((e) => ({
        campania_id: campania.id,
        destinatario: e.destinatario,
        estado: e.estado,
        resend_id: e.resend_id,
      }))
    );

    envios.push(...loteEnvios);
  }

  await supabase
    .from("mailing_campanias")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", campania.id);

  return {
    enviados: envios.filter((e) => e.estado === "enviado").length,
    fallidos: envios.filter((e) => e.estado === "failed").length,
  };
}
