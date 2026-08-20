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
  preheader?: string | null;
}

const BATCH_SIZE = 100;

// Higiene contra el rate limit de Resend (10 req/s por equipo): espaciar los
// lotes cuesta ~3s extra en una campaña de mil y saca al envío del borde.
//
// OJO — esto NO fue lo que rompió la campaña del 2026-07-29 (920 destinatarios,
// 620 sin recibir). Esa falló por la CUOTA DIARIA del plan free de Resend:
// 100 mails/día. Confirmado por el header `x-resend-daily-quota`, que la API
// solo devuelve a cuentas free. Ningún throttle arregla una cuota — se arregla
// pasando la cuenta a un plan pago. Si vuelven a perderse envíos en masa,
// chequear la cuota ANTES de tocar este código:
//   curl -s -D - -X POST https://api.resend.com/emails/batch -H "Authorization: Bearer $KEY" \
//     -H "Content-Type: application/json" \
//     -d '[{"from":"...","to":["delivered@resend.dev"],"subject":"t","html":"<p>t</p>"}]' \
//     | grep -i 'quota\|ratelimit'
const DELAY_ENTRE_LOTES_MS = 350;
const MAX_INTENTOS = 3;

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
): Promise<{ enviados: number; fallidos: number; errorDetalle: string | null }> {
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

  const envios: {
    destinatario: string;
    estado: string;
    resend_id: string | null;
    error_detalle: string | null;
  }[] = [];

  for (let i = 0; i < destinatarios.length; i += BATCH_SIZE) {
    if (i > 0) await dormir(DELAY_ENTRE_LOTES_MS);

    const lote = destinatarios.slice(i, i + BATCH_SIZE);
    const payload = lote.map((email) => ({
      from: EMAIL_FROM,
      to: email,
      subject: campania.asunto,
      // Baja en un click (RFC 8058). Desde 2024 Gmail y Yahoo exigen estos dos
      // headers a cualquiera que mande en volumen: sin ellos empujan a spam sin
      // avisar. El link del pie no los reemplaza — es esto lo que hace que Gmail
      // dibuje su propio botón "Cancelar suscripción" al lado del remitente.
      // El endpoint responde también por POST, que es como lo llaman ellos.
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl(email)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      react: CampaniaGenerica({
        asunto: campania.asunto,
        bloques,
        unsubscribeUrl: unsubscribeUrl(email),
        colorFondo: campania.color_fondo ?? undefined,
        preheader: campania.preheader ?? undefined,
      }),
    }));

    // Segunda capa de seguridad además del reclamo atómico: si por lo que
    // sea este lote se reintentara (timeout de red, rate limit, bug futuro),
    // Resend reconoce la misma idempotencyKey dentro de 24hs y no reenvía.
    // Por eso reintentar el mismo lote es seguro: nadie recibe dos veces.
    const idempotencyKey = `mailing-${campania.id}-batch-${i}`;

    let data: { data: { id: string }[] } | null = null;
    let error: { name: string; message: string } | null = null;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      ({ data, error } = await resend.batch.send(payload, { idempotencyKey }));
      if (!error) break;
      console.error(
        `[mailing] campaña ${campania.id} lote ${i} intento ${intento}/${MAX_INTENTOS}: ${error.name} — ${error.message}`
      );
      // Backoff exponencial: 0.5s, 1s. Suficiente para atravesar una ráfaga
      // de rate limit sin estirar el envío más allá del maxDuration de 300s.
      if (intento < MAX_INTENTOS) await dormir(500 * 2 ** (intento - 1));
    }

    const loteEnvios = error
      ? lote.map((email) => ({
          // 'no_enviado', no 'failed': Resend nunca aceptó este mail, así que
          // esta persona no recibió nada y se le puede reenviar sin duplicar.
          destinatario: email,
          estado: "no_enviado",
          resend_id: null,
          error_detalle: `${error.name}: ${error.message}`,
        }))
      : (data?.data ?? []).map((r, idx) => ({
          destinatario: lote[idx],
          estado: "enviado",
          resend_id: r.id,
          error_detalle: null,
        }));

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
        error_detalle: e.error_detalle,
      }))
    );

    envios.push(...loteEnvios);
  }

  await supabase
    .from("mailing_campanias")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", campania.id);

  const noEnviados = envios.filter((e) => e.estado === "no_enviado");

  return {
    enviados: envios.filter((e) => e.estado === "enviado").length,
    fallidos: noEnviados.length,
    // El motivo del primer lote caído, para que el admin vea qué pasó sin
    // tener que abrir los logs de Vercel. Antes el error se descartaba y una
    // campaña podía perder 620 destinatarios sin dejar rastro.
    errorDetalle: noEnviados[0]?.error_detalle ?? null,
  };
}
