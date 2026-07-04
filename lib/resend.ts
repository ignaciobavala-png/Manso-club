import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Hasta verificar el dominio mansoclub.com.ar en Resend, usar el remitente
// sandbox de test. Cambiar a algo como "Manso Club <hola@mansoclub.com.ar>"
// una vez verificado el dominio (ver ENVIRONMENT_VARIABLES.md).
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Manso Club <onboarding@resend.dev>";
