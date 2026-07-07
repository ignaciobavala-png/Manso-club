import { createClient } from "@supabase/supabase-js";

function pagina(mensaje: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manso Club</title></head>
<body style="margin:0;background:#1D1D1B;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;">
  <p style="color:#FFFCDC;font-size:16px;text-align:center;max-width:420px;">${mensaje}</p>
</body>
</html>`;
}

// Baja sin login: es una acción de opt-out (no expone ni modifica datos
// sensibles), así que no requiere token firmado — el peor caso posible es
// que alguien excluya un email ajeno del mailing, no una fuga de datos.
export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return new Response(pagina("Falta un email válido para procesar la baja."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("mailing_exclusiones")
    .upsert({ email, motivo: "Baja desde el link del mail" }, { onConflict: "email", ignoreDuplicates: true });

  return new Response(
    pagina(`${email} fue dado de baja de los mailings de Manso Club. No vas a recibir más campañas.`),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
