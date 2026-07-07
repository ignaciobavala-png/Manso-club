import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";

// Eventos que representan estado de entrega (dimensión lineal en mailing_envios.estado)
const ESTADO_POR_EVENTO: Record<string, "delivered" | "bounced" | "failed"> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "bounced",
  "email.failed": "failed",
};

export async function POST(request: Request) {
  const payload = await request.text();

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Faltan headers de firma" }, { status: 401 });
  }

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
    });
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // Resend anida los datos del email en data; click trae su propio objeto
  const data = event.data as {
    email_id?: string;
    click?: { link?: string; timestamp?: string; ipAddress?: string; userAgent?: string };
  };

  if (!data.email_id) {
    return NextResponse.json({ received: true, ignored: event.type });
  }
  const resendId = data.email_id;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Estado de entrega
  const nuevoEstado = ESTADO_POR_EVENTO[event.type];
  if (nuevoEstado) {
    await supabase
      .from("mailing_envios")
      .update({ estado: nuevoEstado })
      .eq("resend_id", resendId);
    return NextResponse.json({ received: true });
  }

  // 2) Interacciones (open / click) — no pisan el estado de entrega
  if (event.type !== "email.opened" && event.type !== "email.clicked") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const { data: envio } = await supabase
    .from("mailing_envios")
    .select("id")
    .eq("resend_id", resendId)
    .maybeSingle();

  const envioId = envio?.id ?? null;

  if (event.type === "email.opened") {
    // Marca opened_at solo en la primera apertura (para tasa de apertura)
    await supabase
      .from("mailing_envios")
      .update({ opened_at: new Date().toISOString() })
      .eq("resend_id", resendId)
      .is("opened_at", null);

    await supabase.from("mailing_interacciones").insert({
      envio_id: envioId,
      resend_id: resendId,
      tipo: "open",
    });

    return NextResponse.json({ received: true });
  }

  // email.clicked
  await supabase
    .from("mailing_envios")
    .update({ clicked_at: new Date().toISOString() })
    .eq("resend_id", resendId)
    .is("clicked_at", null);

  await supabase.from("mailing_interacciones").insert({
    envio_id: envioId,
    resend_id: resendId,
    tipo: "click",
    link: data.click?.link ?? null,
    ip: data.click?.ipAddress ?? null,
    user_agent: data.click?.userAgent ?? null,
  });

  return NextResponse.json({ received: true });
}
