/**
 * Redes y monedas en las que se cobra el festival. Sin secretos: lo importa
 * también la pantalla de pago.
 *
 * Los contratos se verificaron contra la cadena el 06/10/2026 (`symbol()` y
 * `decimals()` por RPC) y el de Base contra la página de Circle. No editar de
 * memoria: un contrato mal escrito no rompe nada, simplemente nunca ve un pago.
 */

export type RedCripto = 'tron' | 'bsc' | 'polygon' | 'base';

export interface TokenCripto {
  simbolo: string;
  contrato: string;
  decimales: number;
}

export interface ConfigRed {
  id: RedCripto;
  nombre: string;
  /** Cómo la llaman Binance y Trust Wallet al elegir red de retiro. */
  estandar: string;
  tipo: 'tron' | 'evm';
  tokens: TokenCripto[];
  explorador: (hash: string) => string;
}

export const REDES: Record<RedCripto, ConfigRed> = {
  tron: {
    id: 'tron',
    nombre: 'Tron',
    estandar: 'TRC20',
    tipo: 'tron',
    // Circle dejó de emitir USDC en Tron: ahí solo USDT.
    tokens: [{ simbolo: 'USDT', contrato: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimales: 6 }],
    explorador: h => `https://tronscan.org/#/transaction/${h}`,
  },
  bsc: {
    id: 'bsc',
    nombre: 'BNB Smart Chain',
    estandar: 'BEP20',
    tipo: 'evm',
    tokens: [
      { simbolo: 'USDT', contrato: '0x55d398326f99059fF775485246999027B3197955', decimales: 18 },
      { simbolo: 'USDC', contrato: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimales: 18 },
    ],
    explorador: h => `https://bscscan.com/tx/${h}`,
  },
  polygon: {
    id: 'polygon',
    nombre: 'Polygon',
    estandar: 'Polygon POS',
    tipo: 'evm',
    tokens: [
      // En la cadena el símbolo ahora es "USDT0" (Tether migró el contrato).
      { simbolo: 'USDT', contrato: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimales: 6 },
      { simbolo: 'USDC', contrato: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimales: 6 },
      // USDC puenteado viejo: algunas wallets todavía mandan este.
      { simbolo: 'USDC.e', contrato: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimales: 6 },
    ],
    explorador: h => `https://polygonscan.com/tx/${h}`,
  },
  base: {
    id: 'base',
    nombre: 'Base',
    estandar: 'Base',
    tipo: 'evm',
    tokens: [{ simbolo: 'USDC', contrato: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimales: 6 }],
    explorador: h => `https://basescan.org/tx/${h}`,
  },
};

export const ORDEN_REDES: RedCripto[] = ['tron', 'bsc', 'polygon', 'base'];

export const esRed = (v: unknown): v is RedCripto => typeof v === 'string' && v in REDES;

/** "USDT", "USDT o USDC": lo que se puede mandar en esa red, para la pantalla. */
export const monedasDe = (red: RedCripto) =>
  [...new Set(REDES[red].tokens.map(t => t.simbolo.replace('.e', '')))].join(' o ');

/** Lo que la pantalla de pago sabe de una orden (sin mail ni datos internos). */
export interface EstadoPago {
  estado: 'pendiente' | 'pagada' | 'vencida';
  totalUsd: number;
  red: RedCripto | null;
  /** Monto exacto a mandar, con los centavos que identifican la orden. */
  monto: number | null;
  /** Wallet de Manso en la red elegida. */
  direccion: string | null;
  venceAt: string | null;
  observacion: string | null;
  /** Redes con wallet cargada, en el orden en que se ofrecen. */
  redes: RedCripto[];
}
