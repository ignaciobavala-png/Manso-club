import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";

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

  const nuevoEstado = ESTADO_POR_EVENTO[event.type];
  if (!nuevoEstado || !("email_id" in event.data)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("mailing_envios")
    .update({ estado: nuevoEstado })
    .eq("resend_id", event.data.email_id);

  return NextResponse.json({ received: true });
}
