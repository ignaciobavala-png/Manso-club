import type { EstadoEntrada, MedioPago } from '@/lib/types/festival';

/**
 * Idioma de /blur (es | en). Sin dependencias ni `next/headers`, así lo
 * importan tanto los componentes de servidor como los de cliente. Para leer
 * cuál toca en una request: `leerIdioma` en `festival-idioma-servidor`.
 *
 * Esto traduce la interfaz. Lo que Ana escribe en el panel (visión, FAQ,
 * spots, bios) sale en el idioma en que lo cargó.
 */

export type Idioma = 'es' | 'en';

export const COOKIE_IDIOMA = 'fest-lang';

export const esIdioma = (v: unknown): v is Idioma => v === 'es' || v === 'en';

/** Quien no pide castellano en el navegador recibe inglés; sin dato, castellano. */
export const idiomaDeNavegador = (acceptLanguage: string | null): Idioma => {
  const primero = acceptLanguage?.split(',')[0]?.trim().toLowerCase();
  if (!primero || primero === '*') return 'es';
  return primero.startsWith('es') ? 'es' : 'en';
};

const es = {
  menu: {
    '/blur': 'Home',
    '/blur/vision': 'Visión',
    '/blur/locacion': 'Locación',
    '/blur/spots': 'Spots',
    '/blur/line-up': 'Line up',
    '/blur/tickets': 'Tickets',
    '/blur/info': 'Info & FAQ',
  },
  idiomaEtiqueta: 'Idioma',
  borrador: 'Borrador — sin publicar, solo lo ven los admins',
  contacto: 'Contacto',
  muyPronto: 'Muy pronto.',

  home: {
    locacion: 'Locación',
    verLocacion: 'Ver locación',
    vision: 'Visión',
    lineup: 'Line up',
    verLineup: 'Ver line up',
    fotosAlt: 'Fotos del festival',
  },
  vision: 'Visión',
  locacion: {
    titulo: 'Locación',
    donde: 'Dónde',
    cuando: 'Cuándo',
    horario: 'Horario',
    pronto: 'La locación se anuncia pronto.',
    alt: 'Locación del festival',
  },
  spots: { titulo: 'Spots', pronto: 'Los spots se anuncian pronto.' },
  lineup: {
    titulo: 'Line up',
    pronto: 'El line-up se anuncia pronto.',
    todo: '← Todo el line up',
    dia: 'Día',
    set: 'Set',
    anterior: '← Anterior',
    siguiente: 'Siguiente →',
    otros: 'Otros artistas',
    ampliar: (nombre: string) => `Ampliar la foto de ${nombre}`,
    youtube: (nombre: string) => `${nombre} en YouTube`,
  },
  info: { titulo: 'Info & FAQ', otraDuda: '¿Otra duda?' },

  galeria: {
    ver: (n: number, de: number) => `Ver foto ${n} de ${de}`,
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    cerrar: 'Cerrar',
  },

  tickets: {
    titulo: 'Tickets',
    pronto: 'Las entradas se anuncian pronto.',
    tipo: 'Tipo de ticket',
    valor: 'Valor',
    cantidad: 'Cantidad',
    incluye: (n: number) => `Incluye ${n} entradas`,
    menos: (nombre: string) => `Una ${nombre} menos`,
    mas: (nombre: string) => `Una ${nombre} más`,
    entrada: 'entrada',
    entradas: 'entradas',
    comprar: 'Comprar',
    ventaAbrePronto: 'La venta online abre pronto.',
    medioDePago: 'Medio de pago',
    nombre: 'Nombre y apellido',
    mail: 'Mail',
    preparando: 'Preparando…',
    errorCompra: 'No pudimos iniciar la compra.',
  },
  estados: {
    en_venta: 'En venta',
    proximamente: 'Próximamente',
    agotado: 'Agotado',
    finalizado: 'Finalizado',
  } satisfies Record<EstadoEntrada, string>,
  medios: {
    mercadopago: {
      nombre: 'Mercado Pago',
      boton: 'Pagar con Mercado Pago',
      detalle: 'Tarjeta, débito o dinero en cuenta. Las entradas llegan apenas se aprueba el pago.',
    },
    transferencia: {
      nombre: 'Transferencia',
      boton: 'Pagar por transferencia',
      detalle: 'Te mostramos los datos de la cuenta. Las entradas llegan cuando confirmamos la transferencia.',
    },
    cripto: {
      nombre: 'Cripto',
      boton: 'Pagar con cripto',
      detalle: 'USDT o USDC en la red que elijas, al dólar blue del momento.',
    },
  } satisfies Record<MedioPago, { nombre: string; boton: string; detalle: string }>,

  compra: {
    marco: 'Tu compra',
    aNombreDe: 'A nombre de',
    entradas: 'Entradas',
    total: 'Total',
    alBlue: (monto: string) => `(${monto} al blue)`,
    pagoConfirmado: 'Pago confirmado',
    qrIntro: (email: string) => `Cada QR es una entrada. Guardá este link: también te lo mandamos a ${email}.`,
    qrAlt: (codigo: string) => `QR de la entrada ${codigo}`,
    entradaN: (i: number, de: number) => `Entrada ${i} de ${de}`,
    usada: 'Usada',
    pagadoCon: (medio: string) => `Pagado con ${medio}`,
    pagadoConCripto: (monto: number, token: string, red: string) => `Pagado con ${monto} ${token} en ${red}`,
    verTransaccion: 'ver transacción',
    medioMP: 'Mercado Pago',
    medioTransferencia: 'transferencia',
  },
  transferencia: {
    titulo: 'Pagá por transferencia',
    texto: (monto: string) =>
      `Transferí exactamente ${monto} y mandanos el comprobante. Cuando lo confirmamos te llegan las entradas por mail, y también aparecen en esta página.`,
    wsp: (codigo: string, monto: string) =>
      `Hola! Te mando el comprobante de la compra ${codigo} del festival (${monto}).`,
    monto: 'Monto',
    copiar: 'Copiar',
    tuCodigo: 'Tu código',
    mandarComprobante: 'Mandar comprobante',
  },
  mp: {
    rechazadoTitulo: 'El pago no se aprobó',
    esperandoTitulo: 'Esperando a Mercado Pago',
    rechazadoTexto: 'Mercado Pago rechazó el pago. Podés intentar de nuevo con otro medio.',
    esperandoTexto:
      'Si ya pagaste, en unos segundos esta página muestra tus entradas y te llegan por mail. Si el pago quedó pendiente (por ejemplo, en efectivo), aparecen cuando se acredite.',
    reintentar: 'Intentar de nuevo',
    ir: 'Ir a pagar',
  },
  cripto: {
    vencidoTitulo: 'El plazo para pagar venció',
    titulo: 'Pagá con cripto',
    vencidoTexto:
      'No recibimos el pago a tiempo. Si ya lo mandaste, pegá el hash más abajo; si no, generá el pago de nuevo.',
    texto:
      'USDT, directo a la wallet de Manso. Las entradas aparecen acá y te llegan por mail apenas se confirma la transferencia.',
    elegiRedDeNuevo: 'Elegí la red para pagar de nuevo',
    elegiRed: 'Elegí la red',
    ayudaRed:
      'Desde Lemon o Binance: BNB Smart Chain, que cobra menos comisión. Desde Bitso: Ethereum (Bitso no saca USDT por BEP20). Elegí acá la misma red que vas a usar para retirar.',
    red: 'Red',
    cambiarRed: 'Cambiar de red',
    mandaExactamente: 'Mandá exactamente',
    copiarMonto: 'Copiar monto',
    centavos: (monto: string) =>
      `Los centavos identifican tu compra: con otro monto no la podemos reconocer sola. Si el exchange cobra comisión de retiro, sumala para que lleguen ${monto} justos.`,
    aEstaDireccion: (red: string) => `A esta dirección · ${red}`,
    copiarDireccion: 'Copiar dirección',
    soloEnRed: (monedas: string, red: string, estandar: string) =>
      `Solo ${monedas} en la red ${red} (${estandar}). Otra moneda u otra red no llega y no se puede recuperar.`,
    qrAlt: 'QR de la dirección de pago',
    esperando: 'Esperando el pago',
    plazoVencido: 'Plazo vencido: si ya pagaste, igual se acredita',
    tenes: (mmss: string) => `Tenés ${mmss} para mandarlo`,
    tarda: 'La confirmación tarda de unos segundos a un par de minutos según la red. No hace falta recargar.',
    yaPagaste: '¿Ya pagaste y no se acredita?',
    pegaHash: (red: string) =>
      `Pegá el hash (o el link) de la transacción en ${red}. Lo encontrás en el historial de tu wallet o, en Binance, en el detalle del retiro como "TxID".`,
    verificar: 'Verificar',
    buscando: 'Buscando…',
    copiado: 'Copiado',
    demoHash:
      'Vista de ejemplo: acá se buscaría esa transacción en la red y, si llegó lo pedido, se acreditaría.',
    errorPreparar: 'No pudimos preparar el pago.',
    errorVerificar: 'No pudimos verificar la transacción.',
  },
};

export type Textos = typeof es;

const en: Textos = {
  menu: {
    '/blur': 'Home',
    '/blur/vision': 'Vision',
    '/blur/locacion': 'Location',
    '/blur/spots': 'Spots',
    '/blur/line-up': 'Line up',
    '/blur/tickets': 'Tickets',
    '/blur/info': 'Info & FAQ',
  },
  idiomaEtiqueta: 'Language',
  borrador: 'Draft — unpublished, only admins can see it',
  contacto: 'Contact',
  muyPronto: 'Coming soon.',

  home: {
    locacion: 'Location',
    verLocacion: 'See location',
    vision: 'Vision',
    lineup: 'Line up',
    verLineup: 'See line up',
    fotosAlt: 'Festival photos',
  },
  vision: 'Vision',
  locacion: {
    titulo: 'Location',
    donde: 'Where',
    cuando: 'When',
    horario: 'Time',
    pronto: 'The location will be announced soon.',
    alt: 'Festival location',
  },
  spots: { titulo: 'Spots', pronto: 'The spots will be announced soon.' },
  lineup: {
    titulo: 'Line up',
    pronto: 'The line-up will be announced soon.',
    todo: '← Full line up',
    dia: 'Day',
    set: 'Set',
    anterior: '← Previous',
    siguiente: 'Next →',
    otros: 'Other artists',
    ampliar: nombre => `Enlarge photo of ${nombre}`,
    youtube: nombre => `${nombre} on YouTube`,
  },
  info: { titulo: 'Info & FAQ', otraDuda: 'Any other questions?' },

  galeria: {
    ver: (n, de) => `View photo ${n} of ${de}`,
    anterior: 'Previous',
    siguiente: 'Next',
    cerrar: 'Close',
  },

  tickets: {
    titulo: 'Tickets',
    pronto: 'Tickets will be announced soon.',
    tipo: 'Ticket type',
    valor: 'Price',
    cantidad: 'Quantity',
    incluye: n => `Includes ${n} tickets`,
    menos: nombre => `One less ${nombre}`,
    mas: nombre => `One more ${nombre}`,
    entrada: 'ticket',
    entradas: 'tickets',
    comprar: 'Buy',
    ventaAbrePronto: 'Online sales open soon.',
    medioDePago: 'Payment method',
    nombre: 'Full name',
    mail: 'Email',
    preparando: 'Preparing…',
    errorCompra: 'We could not start the purchase.',
  },
  estados: {
    en_venta: 'On sale',
    proximamente: 'Coming soon',
    agotado: 'Sold out',
    finalizado: 'Ended',
  },
  medios: {
    mercadopago: {
      nombre: 'Mercado Pago',
      boton: 'Pay with Mercado Pago',
      detalle: 'Credit or debit card, or account balance. Tickets arrive as soon as the payment is approved.',
    },
    transferencia: {
      nombre: 'Bank transfer',
      boton: 'Pay by bank transfer',
      detalle: 'We show you the account details. Tickets arrive once we confirm the transfer.',
    },
    cripto: {
      nombre: 'Crypto',
      boton: 'Pay with crypto',
      detalle: 'USDT on the network of your choice, at the current blue dollar rate.',
    },
  },

  compra: {
    marco: 'Your purchase',
    aNombreDe: 'Name',
    entradas: 'Tickets',
    total: 'Total',
    alBlue: monto => `(${monto} at the blue rate)`,
    pagoConfirmado: 'Payment confirmed',
    qrIntro: email => `Each QR is one ticket. Keep this link: we also sent it to ${email}.`,
    qrAlt: codigo => `QR code for ticket ${codigo}`,
    entradaN: (i, de) => `Ticket ${i} of ${de}`,
    usada: 'Used',
    pagadoCon: medio => `Paid with ${medio}`,
    pagadoConCripto: (monto, token, red) => `Paid with ${monto} ${token} on ${red}`,
    verTransaccion: 'view transaction',
    medioMP: 'Mercado Pago',
    medioTransferencia: 'bank transfer',
  },
  transferencia: {
    titulo: 'Pay by bank transfer',
    texto: monto =>
      `Transfer exactly ${monto} and send us the receipt. Once we confirm it, your tickets are emailed to you and also show up on this page.`,
    wsp: (codigo, monto) => `Hi! I'm sending the receipt for festival purchase ${codigo} (${monto}).`,
    monto: 'Amount',
    copiar: 'Copy',
    tuCodigo: 'Your code',
    mandarComprobante: 'Send receipt',
  },
  mp: {
    rechazadoTitulo: 'The payment was not approved',
    esperandoTitulo: 'Waiting for Mercado Pago',
    rechazadoTexto: 'Mercado Pago rejected the payment. You can try again with another method.',
    esperandoTexto:
      'If you already paid, this page will show your tickets in a few seconds and we will email them to you. If the payment is pending (for example, cash), they appear once it clears.',
    reintentar: 'Try again',
    ir: 'Go to payment',
  },
  cripto: {
    vencidoTitulo: 'The payment window has expired',
    titulo: 'Pay with crypto',
    vencidoTexto:
      'We did not receive the payment in time. If you already sent it, paste the hash below; otherwise, generate the payment again.',
    texto:
      "USDT, straight to Manso's wallet. Your tickets show up here and are emailed to you as soon as the transfer is confirmed.",
    elegiRedDeNuevo: 'Choose the network to pay again',
    elegiRed: 'Choose the network',
    ayudaRed:
      "From Lemon or Binance: BNB Smart Chain, which has lower fees. From Bitso: Ethereum (Bitso doesn't withdraw USDT over BEP20). Pick here the same network you'll use to withdraw.",
    red: 'Network',
    cambiarRed: 'Change network',
    mandaExactamente: 'Send exactly',
    copiarMonto: 'Copy amount',
    centavos: monto =>
      `The cents identify your purchase: with any other amount we can't match it automatically. If your exchange charges a withdrawal fee, add it so that exactly ${monto} arrives.`,
    aEstaDireccion: red => `To this address · ${red}`,
    copiarDireccion: 'Copy address',
    soloEnRed: (monedas, red, estandar) =>
      `Only ${monedas} on the ${red} network (${estandar}). Any other coin or network will not arrive and cannot be recovered.`,
    qrAlt: 'QR code of the payment address',
    esperando: 'Waiting for payment',
    plazoVencido: 'Window expired: if you already paid, it will still be credited',
    tenes: mmss => `You have ${mmss} to send it`,
    tarda: "Confirmation takes from a few seconds to a couple of minutes depending on the network. You don't need to reload.",
    yaPagaste: 'Already paid and it is not showing up?',
    pegaHash: red =>
      `Paste the transaction hash (or link) on ${red}. You can find it in your wallet history or, on Binance, in the withdrawal details as "TxID".`,
    verificar: 'Verify',
    buscando: 'Searching…',
    copiado: 'Copied',
    demoHash:
      'Example view: here the transaction would be looked up on the network and, if the requested amount arrived, credited.',
    errorPreparar: 'We could not prepare the payment.',
    errorVerificar: 'We could not verify the transaction.',
  },
};

export const TEXTOS: Record<Idioma, Textos> = { es, en };
