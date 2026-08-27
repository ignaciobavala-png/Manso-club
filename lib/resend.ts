import { Resend } from "resend";

let client: Resend | null = null;

/**
 * El cliente se crea recién cuando alguien lo pide, no al importar el módulo.
 *
 * `new Resend(undefined)` tira "Missing API key" en el constructor, y Next lo
 * ejecuta al recolectar la data de las rutas durante el build. Con la
 * instancia a nivel de módulo, cualquier entorno sin `RESEND_API_KEY` —los
 * Preview de Vercel, por ejemplo— rompía el build entero en
 * `/api/mailing/webhook`, aunque nadie fuera a mandar un mail ahí.
 */
export function getResend(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Falta RESEND_API_KEY. Cargala en las variables de entorno del proyecto."
      );
    }
    client = new Resend(apiKey);
  }
  return client;
}

// Hasta verificar el dominio mansoclub.com.ar en Resend, usar el remitente
// sandbox de test. Cambiar a algo como "Manso Club <hola@mansoclub.com.ar>"
// una vez verificado el dominio (ver ENVIRONMENT_VARIABLES.md).
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Manso Club <onboarding@resend.dev>";
