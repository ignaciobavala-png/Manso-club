import { SITE_URL } from './constants';

/**
 * Identidad de BLUR para los mails (PDF "BLUR - paleta"). Los clientes de mail
 * no leen SVG ni WebP, así que logo y textura son PNG chicos de
 * `public/blurfestival/marca/`, pedidos por URL pública. Si el cliente bloquea las
 * imágenes se ve el texto alternativo "BLUR".
 */
export const MARCA_MAIL = {
  fondo: '#003009',
  texto: '#FFFCDC',
  acento: '#F65200',
  /** Letra sobre el botón naranja. */
  negro: '#1A1A1A',
  resalte: '#FFA7FE',
  logo: `${SITE_URL}/blurfestival/marca/logo-mail.png`,
  textura: `${SITE_URL}/blurfestival/marca/textura-mail.png`,
} as const;

const FUENTE = 'Helvetica,Arial,sans-serif';

/** La fila del logo, arriba de todos los mails. */
export const filaLogoMail = () =>
  `<tr><td style="padding:0 0 14px" align="center"><img src="${MARCA_MAIL.logo}" width="300" alt="BLUR" style="display:block;border:0;width:300px;max-width:100%;height:auto;font:700 32px ${FUENTE};letter-spacing:4px;color:${MARCA_MAIL.texto}"></td></tr>`;

/** La textura naranja, de remate al pie. */
export const filaTexturaMail = () =>
  `<tr><td style="padding:24px 0 0" align="center"><img src="${MARCA_MAIL.textura}" width="160" alt="" style="display:block;border:0;width:160px;height:auto"></td></tr>`;
