/**
 * Redes y monedas en las que se cobra el festival. Sin secretos: lo importa
 * también la pantalla de pago.
 *
 * Una sola moneda, USDT, en dos redes (pedido de Ana, para no marear): Ethereum
 * porque Bitso saca USDT solo por ERC20 (o TRC20), y BNB Smart Chain porque es
 * la barata y Lemon la tiene. Tron, Polygon, Base y USDC se sacaron el 07/10/2026.
 *
 * Los contratos se verificaron contra la cadena (`symbol()` y `decimals()` por
 * RPC): BSC el 06/10/2026, Ethereum el 07/10/2026. No editar de memoria: un
 * contrato mal escrito no rompe nada, simplemente nunca ve un pago.
 */

export type RedCripto = 'ethereum' | 'bsc';

export interface TokenCripto {
  simbolo: string;
  contrato: string;
  decimales: number;
}

export interface ConfigRed {
  id: RedCripto;
  nombre: string;
  /** Cómo la llaman Bitso, Lemon y Binance al elegir red de retiro. */
  estandar: string;
  tokens: TokenCripto[];
  explorador: (hash: string) => string;
}

export const REDES: Record<RedCripto, ConfigRed> = {
  bsc: {
    id: 'bsc',
    nombre: 'BNB Smart Chain',
    estandar: 'BEP20',
    tokens: [{ simbolo: 'USDT', contrato: '0x55d398326f99059fF775485246999027B3197955', decimales: 18 }],
    explorador: h => `https://bscscan.com/tx/${h}`,
  },
  ethereum: {
    id: 'ethereum',
    nombre: 'Ethereum',
    estandar: 'ERC20',
    tokens: [{ simbolo: 'USDT', contrato: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimales: 6 }],
    explorador: h => `https://etherscan.io/tx/${h}`,
  },
};

/** BEP20 primero: es la que conviene (la comisión de Ethereum es de varios USDT). */
export const ORDEN_REDES: RedCripto[] = ['bsc', 'ethereum'];

export const esRed = (v: unknown): v is RedCripto => typeof v === 'string' && v in REDES;

/** Lo que se puede mandar en esa red, para la pantalla. */
export const monedasDe = (red: RedCripto) => [...new Set(REDES[red].tokens.map(t => t.simbolo))].join(' o ');

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
