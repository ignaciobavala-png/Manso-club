import { createHmac } from 'node:crypto';
import { adminFestival, urlCompra } from '@/lib/festival-compra';
import { huellaIp } from '@/lib/festival-bot';
import { MARCA_MAIL, filaLogoMail, filaTexturaMail } from '@/lib/festival-mail-marca';
import { EMAIL_FROM, getResend } from '@/lib/resend';
import { TEXTOS, type Idioma } from '@/lib/festival-idioma';

/**
 * "Mis entradas": la persona pone su mail y recibe un mail con el link a cada
 * compra pagada. Es público y manda mails, así que el diseño apunta a que no
 * sirva para nada más que eso:
 *
 * - La respuesta es SIEMPRE la misma haya o no compra: no se puede usar para
 *   averiguar quién compró.
 * - El mail sale solo a la casilla de la compra, nunca a una que escriba la
 *   persona en otro lado.
 * - Lleva el link a /blurfestival/compra/[id] (la llave de cada orden), no los
 *   QR: la pantalla de la compra es donde el QR se ve bien.
 * - Tres frenos en la base (`festival_bot_permitir`): por IP, por casilla y
 *   general por día (el plan de Resend manda 100 mails por día).
 */

export const LIMITES_RECUPERAR = {
  porIp10Min: 5,
  porIpDia: 15,
  /** Mails a una misma casilla por día. */
  porMailDia: 3,
  /** Entre todos, por día: deja margen del tope de 100 de Resend para los mails de compra. */
  globalDia: 30,
} as const;

const DIA = 24 * 60 * 60;
const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const mailValido = (m: string) => m.length <= 254 && MAIL.test(m);

export type ResultadoRecuperar = 'ok' | 'limite' | 'caido';

/** La casilla va al freno como HMAC: la tabla de límites no guarda mails. */
const huellaMail = (mail: string) =>
  createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`mail|${mail}`).digest('hex').slice(0, 24);

async function permitir(clave: string, max: number, ventana: number): Promise<boolean | 'caido'> {
  const { data, error } = await adminFestival().rpc('festival_bot_permitir', { p_clave: clave, p_max: max, p_ventana_seg: ventana });
  if (error) {
    console.error('[festival/mis-entradas] freno:', error.message);
    return 'caido';
  }
  return data === true;
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

interface OrdenCorta {
  id: string;
  nombre: string;
  cantidad_entradas: number;
  pagada_at: string | null;
  created_at: string;
}

export async function recuperarEntradas(mailCrudo: string, ip: string, idioma: Idioma): Promise<ResultadoRecuperar> {
  const mail = mailCrudo.trim().toLowerCase();
  const huella = huellaIp(ip);

  // 1. Frenos que no dependen de si el mail existe: así no filtran nada.
  for (const [clave, max, ventana] of [
    [`rec:ip:${huella}:10m`, LIMITES_RECUPERAR.porIp10Min, 10 * 60],
    [`rec:ip:${huella}:dia`, LIMITES_RECUPERAR.porIpDia, DIA],
  ] as const) {
    const r = await permitir(clave, max, ventana);
    if (r === 'caido') return 'caido';
    if (!r) return 'limite';
  }

  // 2. Las compras pagadas de esa casilla. `ilike` sin comodines: _ y % son
  // comunes en un mail (y `_` es un comodín).
  const patron = mail.replace(/[\\%_]/g, '\\$&');
  const { data, error } = await adminFestival()
    .from('festival_ordenes')
    .select('id, nombre, cantidad_entradas, pagada_at, created_at')
    .eq('estado', 'pagada')
    .ilike('email', patron)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) {
    console.error('[festival/mis-entradas] lectura:', error.message);
    return 'caido';
  }
  const ordenes = (data ?? []) as OrdenCorta[];
  // Sin compra: misma respuesta que con compra, sin mandar nada.
  if (ordenes.length === 0) return 'ok';

  // 3. Frenos del envío. Si se pasa, también responde "ok": no se distingue.
  for (const [clave, max, ventana] of [
    [`rec:mail:${huellaMail(mail)}:dia`, LIMITES_RECUPERAR.porMailDia, DIA],
    ['rec:global:dia', LIMITES_RECUPERAR.globalDia, DIA],
  ] as const) {
    const r = await permitir(clave, max, ventana);
    if (r === 'caido') return 'caido';
    if (!r) return 'ok';
  }

  try {
    const { error: errorEnvio } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: mail,
      subject: TEXTOS[idioma].misEntradas.mailAsunto,
      html: htmlMailRecuperar(ordenes, idioma),
      text: textoMailRecuperar(ordenes, idioma),
    });
    if (errorEnvio) throw new Error(errorEnvio.message);
  } catch (e) {
    console.error('[festival/mis-entradas] envío:', e);
    return 'caido';
  }
  return 'ok';
}

const fechaCorta = (iso: string, idioma: Idioma) =>
  new Date(iso).toLocaleDateString(idioma === 'en' ? 'en-GB' : 'es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' });

function textoMailRecuperar(ordenes: OrdenCorta[], idioma: Idioma) {
  const L = TEXTOS[idioma].misEntradas;
  return [
    L.mailSaludo(ordenes[0].nombre),
    '',
    ...ordenes.map(o => `${L.mailCompra(o.cantidad_entradas, fechaCorta(o.pagada_at ?? o.created_at, idioma))}\n${urlCompra(o.id)}`),
    '',
    L.mailPie,
  ].join('\n');
}

export function htmlMailRecuperar(ordenes: OrdenCorta[], idioma: Idioma) {
  const { fondo, texto, acento, negro } = MARCA_MAIL;
  const L = TEXTOS[idioma].misEntradas;
  const bloques = ordenes
    .map(
      o => `<tr><td align="center" style="padding:0 0 28px">
  <p style="margin:0 0 12px;font:14px/1.4 Helvetica,Arial,sans-serif;color:${texto}">${escapar(L.mailCompra(o.cantidad_entradas, fechaCorta(o.pagada_at ?? o.created_at, idioma)))}</p>
  <a href="${urlCompra(o.id)}" style="display:inline-block;background:${acento};color:${negro};font:700 17px Helvetica,Arial,sans-serif;text-decoration:none;padding:16px 36px">${escapar(L.mailBoton)}</a>
</td></tr>`
    )
    .join('');
  return `<!doctype html><html><body style="margin:0;background:${fondo}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${fondo}"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
${filaLogoMail()}
<tr><td align="center" style="padding:0 0 28px;font:15px/1.5 Helvetica,Arial,sans-serif;color:${texto}">${escapar(L.mailSaludo(ordenes[0].nombre))}</td></tr>
${bloques}
<tr><td align="center" style="padding:0 0 8px;font:12px/1.5 Helvetica,Arial,sans-serif;color:${texto};opacity:.7">${escapar(L.mailPie)}</td></tr>
${filaTexturaMail()}
</table></td></tr></table></body></html>`;
}
