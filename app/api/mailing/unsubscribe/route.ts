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
function emailDeLaUrl(request: Request): string | null {
  const email = new URL(request.url).searchParams.get("email")?.toLowerCase().trim();
  return email && email.includes("@") ? email : null;
}

async function darDeBaja(email: string, motivo: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("mailing_exclusiones")
    .upsert({ email, motivo }, { onConflict: "email", ignoreDuplicates: true });
}

export async function GET(request: Request) {
  const email = emailDeLaUrl(request);

  if (!email) {
    return new Response(pagina("Falta un email válido para procesar la baja."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await darDeBaja(email, "Baja desde el link del mail");

  return new Response(
    pagina(`${email} fue dado de baja de los mailings de Manso Club. No vas a recibir más campañas.`),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/**
 * Baja en un click (RFC 8058). Gmail y Yahoo no abren el link: hacen un POST
 * a esta misma URL con el cuerpo `List-Unsubscribe=One-Click`, sin cookies ni
 * sesión, y esperan un 2xx. Si respondiera 405 el botón de "Cancelar
 * suscripción" que dibuja Gmail fallaría en silencio y contaría en contra de
 * la reputación del dominio, que es justamente lo que el header viene a evitar.
 *
 * No se valida el cuerpo ni se pide confirmación a propósito: el estándar
 * exige que la baja sea inmediata y sin pantallas intermedias.
 */
export async function POST(request: Request) {
  const email = emailDeLaUrl(request);

  if (!email) {
    return new Response("Falta un email válido", { status: 400 });
  }

  await darDeBaja(email, "Baja en un click (List-Unsubscribe)");

  return new Response("OK", { status: 200 });
}
