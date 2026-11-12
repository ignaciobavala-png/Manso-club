import type { EstadoEntrada, MedioPago } from '@/lib/types/festival';

/**
 * Idioma de /blurfestival (es | en). Sin dependencias ni `next/headers`, así lo
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

/**
 * Para los textos del panel: en inglés, cada campo con su `<campo>_en` cargado
 * lo reemplaza; vacío o ausente, queda el castellano.
 */
export function enIdioma<T extends object>(fila: T, idioma: Idioma, campos: (keyof T & string)[]): T {
  if (idioma !== 'en') return fila;
  const r = { ...fila } as Record<string, unknown>;
  for (const c of campos) {
    const v = r[`${c}_en`];
    if (typeof v === 'string' && v.trim()) r[c] = v;
  }
  return r as T;
}

const es = {
  menu: {
    '/blurfestival': 'Home',
    '/blurfestival/vision': 'Visión',
    '/blurfestival/locacion': 'Locación',
    '/blurfestival/spots': 'Spots',
    '/blurfestival/line-up': 'Line up',
    '/blurfestival/tickets': 'Tickets',
    '/blurfestival/info': 'Info & FAQ',
    '/blurfestival/voluntarios': 'Voluntarios',
  },
  idiomaEtiqueta: 'Idioma',
  borrador: 'Borrador — sin publicar, solo lo ven los admins',
  contacto: 'Contacto',
  muyPronto: 'Muy pronto.',

  bot: {
    abrir: 'Abrir el chat de BLUR',
    cerrar: 'Cerrar el chat',
    titulo: 'Preguntale a BLUR',
    sugerencias: ['¿Cuándo y dónde es?', '¿Cómo llego?', '¿A qué hora toca cada artista?', '¿Cómo consigo entrada?'],
    placeholder: 'Escribí tu pregunta…',
    enviar: 'Enviar',
    escribiendo: 'Escribiendo',
    aviso: 'Respuestas automáticas: pueden contener errores. Ante la duda, escribinos.',
    errores: {
      limite: 'Alcanzaste el límite de mensajes por ahora. Volvé a intentarlo en un rato.',
      'no-disponible': 'El chat no está disponible en este momento. Probá de nuevo en un rato.',
      invalido: 'No pude leer ese mensaje. Probá con una pregunta más corta.',
    },
  },

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
    menos: (nombre: string) => `Una ${nombre} menos`,
    mas: (nombre: string) => `Una ${nombre} más`,
    entrada: 'entrada',
    entradas: 'entradas',
    comprar: 'Comprar',
    ventaAbrePronto: 'La venta online abre pronto.',
    equivale: (usdt: string) => `≈ ${usdt} USDT al dólar blue de hoy. El monto exacto lo ves en el siguiente paso.`,
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
      detalle: 'Te llevamos a Manso Gestión para pagar. Ahí mismo ves tu QR cuando se confirma la transferencia.',
    },
    cripto: {
      nombre: 'Cripto',
      boton: 'Pagar con cripto',
      detalle: 'USDT en la red que elijas, al dólar blue del momento. Si nunca usaste cripto, en el próximo paso te explicamos cómo conseguir USDT.',
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
    paso1: 'Paso 1 · Transferí',
    paso2: 'Paso 2 · Subí el comprobante',
    paso3: 'Paso 3 · Avisanos',
    subirTexto: 'Captura o foto de la transferencia. JPG, PNG o PDF, hasta 4 MB.',
    subir: 'Subir comprobante',
    subiendo: 'Subiendo…',
    oPorWsp: 'o mandalo por WhatsApp con tu código',
    comprobanteListo: 'Comprobante subido',
    reemplazar: 'Reemplazar comprobante',
    yaTransferi: 'Ya transferí',
    avisando: 'Avisando…',
    avisoAdvertencia: 'Tocá el botón solo si ya hiciste la transferencia. Si el dinero no llega, la entrada se anula.',
    avisadoTitulo: 'Listo, avisamos que transferiste',
    avisadoTexto: 'Revisamos que el dinero haya entrado y, cuando lo confirmemos, te llega el mail con tus entradas. Puede demorar un poco.',
    vencidoTitulo: 'La reserva venció',
    vencidoTexto: 'Pasaron más de 48 horas sin avisar el pago y liberamos tus lugares. Si ya transferiste, escribinos por WhatsApp con tu código. Si no, podés volver a comprar.',
    errorAviso: 'No pudimos registrar el aviso. Probá de nuevo.',
    errorTipo: 'El comprobante tiene que ser una imagen o un PDF.',
    errorPeso: 'El PDF pesa demasiado (máximo 4 MB).',
    errorSubida: 'No pudimos subir el comprobante. Probá de nuevo o mandalo por WhatsApp.',
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
    ayudaRedTitulo: '¿Qué red elijo?',
    ayudaRedLemon: 'Lemon o Binance → BNB Smart Chain (cobra menos comisión).',
    ayudaRedBitso: 'Bitso → Ethereum (Bitso no retira USDT por BEP20).',
    ayudaRedNota: 'Elegí acá la misma red que vas a usar al retirar. Con otra red el dinero se pierde.',
    red: 'Red',
    cambiarRed: 'Cambiar de red',
    mandaExactamente: 'Mandá exactamente',
    copiarMonto: 'Copiar monto',
    centavos: 'Los centavos identifican tu compra: con otro monto no la podemos reconocer sola.',
    comisionTitulo: 'Ojo con la comisión de retiro',
    comision: (monto: string) =>
      `Los exchanges descuentan una comisión al retirar. Antes de confirmar, fijate cuánto "recibe" la dirección: tiene que decir ${monto}. Si dice menos, subí el monto a enviar hasta que llegue justo.`,
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
    guia: {
      abrir: '¿No tenés USDT? Te explicamos cómo conseguirlo',
      cerrar: 'Cerrar la guía',
      titulo: 'De pesos a USDT, paso a paso',
      intro:
        'USDT es un dólar digital: 1 USDT vale 1 dólar. Si nunca usaste cripto, necesitás una cuenta en un exchange argentino. Los nombres de los botones cambian según la app: buscá "Retirar" o "Enviar".',
      pasos: [
        {
          titulo: 'Abrí una cuenta y verificá tu identidad',
          texto:
            'Lemon, Belo, Bitso o Binance. Te piden DNI y una selfie. Puede tardar desde minutos hasta un día: hacelo cuanto antes, es lo que más demora.',
        },
        {
          titulo: 'Cargá pesos',
          texto:
            'Transferí desde tu banco o billetera a la cuenta del exchange. Cargá un poco más que el total de las entradas: el retiro tiene una comisión.',
        },
        {
          titulo: 'Comprá USDT',
          texto: 'Dentro del exchange, cambiá esos pesos por USDT. Es una compra directa, como cambiar de moneda.',
        },
        {
          titulo: 'Retirá los USDT a esta página',
          texto:
            'Elegí "Retirar" o "Enviar" USDT. Pegá la dirección de abajo, elegí la misma red que marcaste acá y poné el monto exacto. Revisá la comisión antes de confirmar.',
        },
        {
          titulo: 'Esperá, no hace falta hacer nada más',
          texto: 'Esta página detecta el pago sola, en general en un par de minutos. Después te llegan las entradas por mail.',
        },
      ],
      consejo:
        'Mejor probá con tiempo: la verificación de identidad y el primer retiro son lo que más tarda. Si algo no te cierra, escribinos antes de enviar dinero.',
    },
  },
};

export type Textos = typeof es;

const en: Textos = {
  menu: {
    '/blurfestival': 'Home',
    '/blurfestival/vision': 'Vision',
    '/blurfestival/locacion': 'Location',
    '/blurfestival/spots': 'Spots',
    '/blurfestival/line-up': 'Line up',
    '/blurfestival/tickets': 'Tickets',
    '/blurfestival/info': 'Info & FAQ',
    '/blurfestival/voluntarios': 'Volunteers',
  },
  idiomaEtiqueta: 'Language',
  borrador: 'Draft — unpublished, only admins can see it',
  contacto: 'Contact',
  muyPronto: 'Coming soon.',

  bot: {
    abrir: 'Open the BLUR chat',
    cerrar: 'Close the chat',
    titulo: 'Ask BLUR',
    sugerencias: ['When and where is it?', 'How do I get there?', 'What time does each artist play?', 'How do I get a ticket?'],
    placeholder: 'Type your question…',
    enviar: 'Send',
    escribiendo: 'Typing',
    aviso: 'Automatic answers may contain errors. If in doubt, contact us.',
    errores: {
      limite: "You've reached the message limit for now. Please try again in a while.",
      'no-disponible': 'The chat is not available right now. Please try again in a while.',
      invalido: "I couldn't read that message. Please try a shorter question.",
    },
  },

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
    menos: nombre => `One less ${nombre}`,
    mas: nombre => `One more ${nombre}`,
    entrada: 'ticket',
    entradas: 'tickets',
    comprar: 'Buy',
    ventaAbrePronto: 'Online sales open soon.',
    equivale: usdt => `≈ ${usdt} USDT at today's blue dollar rate. You'll see the exact amount on the next step.`,
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
      detalle: 'We take you to Manso Gestión to pay. Your QR shows up there once the transfer is confirmed.',
    },
    cripto: {
      nombre: 'Crypto',
      boton: 'Pay with crypto',
      detalle: 'USDT on the network of your choice, at the current blue dollar rate. New to crypto? The next step explains how to get USDT.',
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
    paso1: 'Step 1 · Transfer',
    paso2: 'Step 2 · Upload the receipt',
    paso3: 'Step 3 · Let us know',
    subirTexto: 'A screenshot or photo of the transfer. JPG, PNG or PDF, up to 4 MB.',
    subir: 'Upload receipt',
    subiendo: 'Uploading…',
    oPorWsp: 'or send it on WhatsApp with your code',
    comprobanteListo: 'Receipt uploaded',
    reemplazar: 'Replace receipt',
    yaTransferi: "I've transferred",
    avisando: 'Letting you know…',
    avisoAdvertencia: "Tap the button only if you've already made the transfer. If the money does not arrive, the ticket is cancelled.",
    avisadoTitulo: 'Done, we know you transferred',
    avisadoTexto: 'We check that the money arrived and, once confirmed, your tickets are emailed to you. It may take a little while.',
    vencidoTitulo: 'The reservation expired',
    vencidoTexto: 'More than 48 hours passed without a payment notice, so we released your spots. If you already transferred, write to us on WhatsApp with your code. Otherwise you can buy again.',
    errorAviso: 'We could not register the notice. Please try again.',
    errorTipo: 'The receipt has to be an image or a PDF.',
    errorPeso: 'The PDF is too large (4 MB at most).',
    errorSubida: 'We could not upload the receipt. Try again or send it on WhatsApp.',
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
    ayudaRedTitulo: 'Which network do I pick?',
    ayudaRedLemon: 'Lemon or Binance → BNB Smart Chain (lower fees).',
    ayudaRedBitso: "Bitso → Ethereum (Bitso doesn't withdraw USDT over BEP20).",
    ayudaRedNota: "Pick here the same network you'll use to withdraw. On a different network the funds are lost.",
    red: 'Network',
    cambiarRed: 'Change network',
    mandaExactamente: 'Send exactly',
    copiarMonto: 'Copy amount',
    centavos: "The cents identify your purchase: with any other amount we can't match it automatically.",
    comisionTitulo: 'Watch the withdrawal fee',
    comision: monto =>
      `Exchanges deduct a fee when you withdraw. Before confirming, check how much the address will "receive": it must say ${monto}. If it says less, raise the amount you send until exactly that arrives.`,
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
    guia: {
      abrir: "Don't have USDT? Here's how to get it",
      cerrar: 'Close the guide',
      titulo: 'From pesos to USDT, step by step',
      intro:
        'USDT is a digital dollar: 1 USDT is worth 1 dollar. If you have never used crypto, you need an account at an Argentine exchange. Button names vary by app: look for "Withdraw" or "Send".',
      pasos: [
        {
          titulo: 'Open an account and verify your identity',
          texto:
            'Lemon, Belo, Bitso or Binance. They ask for your ID and a selfie. It can take from minutes to a day: do it early, it is the slowest part.',
        },
        {
          titulo: 'Add pesos',
          texto:
            'Transfer from your bank or wallet to the exchange account. Add a bit more than the ticket total: withdrawing has a fee.',
        },
        {
          titulo: 'Buy USDT',
          texto: 'Inside the exchange, swap those pesos for USDT. It is a direct purchase, like changing currency.',
        },
        {
          titulo: 'Withdraw the USDT to this page',
          texto:
            'Choose "Withdraw" or "Send" USDT. Paste the address below, pick the same network you chose here and enter the exact amount. Check the fee before confirming.',
        },
        {
          titulo: 'Wait, nothing else to do',
          texto: 'This page detects the payment by itself, usually within a couple of minutes. Your tickets then arrive by email.',
        },
      ],
      consejo:
        'Try it ahead of time: identity verification and the first withdrawal are the slowest parts. If something is unclear, write to us before sending money.',
    },
  },
};

export const TEXTOS: Record<Idioma, Textos> = { es, en };
