import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

let client: MercadoPagoConfig | null = null;

export function getMPClient() {
  if (client) return client;

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN no configurado');
  }

  client = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 },
  });

  return client;
}

export function getMPPreferenceClient() {
  return new Preference(getMPClient());
}

export function getMPPaymentClient() {
  return new Payment(getMPClient());
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://manso.club')
  );
}
