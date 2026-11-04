import type { SupabaseClient } from '@supabase/supabase-js';
import { EMAIL_FROM, getResend } from './resend';
import { REDES, monedasDe, type RedCripto } from './cripto-redes';
import { MARCA_MAIL, filaLogoMail } from './festival-mail-marca';

/**
 * Mail de "tu pago está pendiente" para las compras en cripto.
 *
 * Se manda una sola vez por orden, la primera vez que la persona elige red
 * (ahí ya hay monto y dirección). Sirve para volver: quien paga desde el
 * celular sale a Lemon o Binance y puede perder la pestaña. Lleva el monto
 * exacto, la dirección y el link a `/blur/compra/[id]`.
 *
 * Misma pieza que el mail de entradas (tablas e inline, paleta y logo de BLUR). El
 * HTML es una función pura para poder renderizarla sin servidor.
 */

export interface DatosMailPendiente {
  nombre: string;
  red: RedCripto;
  /** USDT a mandar, con los centavos propios de la orden. */
  monto: number;
  direccion: string;
  /** ISO; el plazo para mandarlo (el pago exacto que llegue después igual se acredita). */
  venceAt: string | null;
  link: string;
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });

export const asuntoMailPendiente = 'Tu pago de BLUR está pendiente';

export function htmlMailPagoPendiente({ nombre, red, monto, direccion, venceAt, link }: DatosMailPendiente): string {
  const { fondo, texto, acento, resalte, negro } = MARCA_MAIL;
  const fuente = 'Helvetica,Arial,sans-serif';
  const mono = "'Courier New',monospace";
  const cfg = REDES[red];
  const importe = monto.toFixed(2);
  const moneda = monedasDe(red);

  const caja = (contenido: string) =>
    `<tr><td style="padding:0 0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,252,220,.3)"><tr><td style="padding:16px 18px">${contenido}</td></tr></table></td></tr>`;
  const rotulo = (t: string) =>
    `<p style="margin:0 0 8px;font:11px ${mono};letter-spacing:3px;text-transform:uppercase;color:${texto};opacity:.6">${t}</p>`;

  return `<!doctype html><html lang="es"><body style="margin:0;background:${fondo}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${fondo}"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
${filaLogoMail()}
<tr><td style="padding:0 0 28px;font:15px/1.5 ${fuente};color:${texto}" align="center">
  <span style="font-weight:700;font-size:20px">${escapar(nombre)}</span><br>Tu pago está pendiente
</td></tr>
<tr><td style="padding:0 0 24px;font:15px/1.5 ${fuente};color:${texto}">
  Todavía no recibimos tu pago. Te dejamos todo para completarlo cuando vuelvas del exchange.
</td></tr>
${caja(`${rotulo('Mandá exactamente')}
  <p style="margin:0;font:700 36px/1 ${fuente};color:${texto}">${importe} <span style="font-size:20px">${escapar(moneda)}</span></p>
  <p style="margin:10px 0 0;font:13px/1.4 ${fuente};color:${texto};opacity:.75">Los centavos identifican tu compra: con otro monto no la podemos reconocer sola.</p>`)}
${caja(`${rotulo(`A esta dirección · ${escapar(cfg.nombre)} (${cfg.estandar})`)}
  <p style="margin:0;font:14px/1.4 ${mono};color:${texto};word-break:break-all">${escapar(direccion)}</p>
  <p style="margin:10px 0 0;font:13px/1.4 ${fuente};color:${texto};opacity:.75">Solo ${escapar(moneda)} en la red ${escapar(cfg.nombre)}. Otra moneda u otra red no llega y no se puede recuperar.</p>`)}
<tr><td style="padding:0 0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${resalte}"><tr><td style="padding:14px 18px;font:14px/1.45 ${fuente};color:${texto}">
  <span style="font-weight:700;color:${resalte}">Ojo con la comisión de retiro.</span>
  Antes de confirmar, fijate cuánto "recibe" la dirección: tiene que decir ${importe} ${escapar(moneda)}. Si dice menos, subí el monto a enviar.
</td></tr></table></td></tr>
<tr><td align="center" style="padding:0 0 12px"><a href="${link}" style="display:inline-block;background:${acento};color:${negro};font:700 16px ${fuente};text-decoration:none;padding:14px 32px">Volver a mi pago</a></td></tr>
<tr><td align="center" style="padding:0 0 28px;font:13px/1.5 ${fuente};color:${texto};opacity:.7">
  ${venceAt ? `Tenés hasta las ${hora(venceAt)} para mandarlo. Si lo mandás después, igual se acredita.<br>` : ''}Cuando llegue el pago te mandamos las entradas por mail.
</td></tr>
<tr><td style="font:13px/1.5 ${fuente};color:${texto};opacity:.7;border-top:1px solid rgba(255,252,220,.2);padding:20px 0 0">
  ¿No tenés USDT? En el link de arriba hay una guía paso a paso para pasar de pesos a USDT.
</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Manda el mail una sola vez por orden. Se reclama `mail_pendiente_enviado`
 * antes de mandar; si Resend falla se libera. Nunca tira: el pago no puede
 * depender de un mail.
 */
export async function enviarMailPagoPendiente(
  supabase: SupabaseClient,
  orden: { id: string; email: string } & Omit<DatosMailPendiente, 'link'>,
  link: string
) {
  try {
    const { data: reclamada } = await supabase
      .from('festival_ordenes')
      .update({ mail_pendiente_enviado: true })
      .eq('id', orden.id)
      .eq('mail_pendiente_enviado', false)
      .select('id')
      .maybeSingle();
    if (!reclamada) return;

    try {
      const { error } = await getResend().emails.send({
        from: EMAIL_FROM,
        to: orden.email,
        subject: asuntoMailPendiente,
        html: htmlMailPagoPendiente({ ...orden, link }),
      });
      if (error) throw new Error(error.message);
    } catch (e) {
      await supabase.from('festival_ordenes').update({ mail_pendiente_enviado: false }).eq('id', orden.id);
      throw e;
    }
  } catch (e) {
    console.error(`No se pudo mandar el mail de pago pendiente de la orden ${orden.id}:`, e);
  }
}
