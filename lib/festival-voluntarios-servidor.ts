import { cache } from 'react';
import { createSupabaseServer } from '@/lib/supabase';
import { EMAIL_FROM, getResend } from '@/lib/resend';
import { MARCA_MAIL, filaLogoMail } from '@/lib/festival-mail-marca';
import type { Idioma } from '@/lib/festival-idioma';
import {
  CONFIG_VOLUNTARIOS_POR_DEFECTO,
  type ConfigVoluntarios,
} from '@/lib/festival-voluntarios';
import { TEXTOS_VOLUNTARIOS, llenar } from '@/lib/festival-voluntarios-textos';

/**
 * Parámetros de la convocatoria, con el cliente con cookies (igual que
 * `leerConfig`): sin publicar, el RLS se la esconde a quien no sea admin. Si la
 * migración todavía no corrió, o no hay fila, vuelven los valores por defecto.
 */
export const leerConfigVoluntarios = cache(async (): Promise<ConfigVoluntarios> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from('festival_voluntarios_config').select('*').eq('id', 1).maybeSingle();
  return { ...CONFIG_VOLUNTARIOS_POR_DEFECTO, ...(data ?? {}) } as ConfigVoluntarios;
});

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Mail de "recibimos tu postulación". Misma pieza que los de las entradas:
 * tablas e inline, paleta y logo de BLUR. Función pura.
 */
export function mailConfirmacion(idioma: Idioma, nombre: string, areas: string[]) {
  const m = TEXTOS_VOLUNTARIOS[idioma].mail;
  const { fondo, texto } = MARCA_MAIL;
  const fuente = 'Helvetica,Arial,sans-serif';
  const lista = areas.join(', ');
  return {
    asunto: m.asunto,
    html: `<!doctype html><html lang="${idioma}"><body style="margin:0;background:${fondo}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${fondo}"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
${filaLogoMail()}
<tr><td style="padding:12px 0 18px;font:700 20px/1.3 ${fuente};color:${texto}">${escapar(llenar(m.saludo, { nombre }))}</td></tr>
<tr><td style="padding:0 0 28px;font:15px/1.55 ${fuente};color:${texto}">${escapar(llenar(m.cuerpo, { areas: lista }))}</td></tr>
<tr><td style="font:13px/1.5 ${fuente};color:${texto};opacity:.75;border-top:1px solid rgba(255,252,220,.2);padding:18px 0 0">${escapar(m.firma)}</td></tr>
</table></td></tr></table></body></html>`,
  };
}

/**
 * Manda la confirmación. Nunca tira: la postulación ya quedó guardada y no
 * puede depender de un mail (Resend sin clave en un preview, tope diario del
 * plan free). Devuelve si salió, para dejarlo anotado en la fila.
 */
export async function enviarConfirmacion(
  para: string,
  idioma: Idioma,
  nombre: string,
  areas: string[],
  responderA: string | null
): Promise<boolean> {
  try {
    const { asunto, html } = mailConfirmacion(idioma, nombre, areas);
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: para,
      subject: asunto,
      html,
      ...(responderA ? { replyTo: responderA } : {}),
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (e) {
    console.error('No se pudo mandar la confirmación de voluntariado:', e);
    return false;
  }
}
