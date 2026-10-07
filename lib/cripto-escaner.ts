import { REDES, type RedCripto } from '@/lib/cripto-redes';

/**
 * Lee las transferencias de USDT que entraron a la wallet de Manso, sin
 * librerías: JSON-RPC (`eth_getLogs`).
 *
 * Variables:
 *   FESTIVAL_WALLET_EVM    dirección 0x… de Manso; la misma sirve en Ethereum y BSC
 *   CRIPTO_RPC_ETHEREUM / CRIPTO_RPC_BSC   opcionales, por si el nodo público por
 *     defecto (publicnode) se pone lento
 *
 * Solo direcciones públicas: ninguna clave privada pasa por acá.
 */

export interface Transferencia {
  red: RedCripto;
  token: string;
  contrato: string;
  tx_hash: string;
  log_index: number;
  desde: string;
  /** Decimal con hasta 6 decimales, como string para no perder precisión. */
  monto: string;
  /** Número de bloque. */
  bloque: number;
}

const RPC_DEFECTO: Record<RedCripto, string> = {
  ethereum: 'https://ethereum-rpc.publicnode.com',
  bsc: 'https://bsc-rpc.publicnode.com',
};

/** Bloques de espera antes de dar una transferencia por firme. */
const CONFIRMACIONES: Record<RedCripto, number> = { ethereum: 12, bsc: 15 };

/** Los nodos públicos aceptan 5000 bloques por consulta (probado el 06/10/2026 en BSC y el 07/10 en Ethereum). */
const BLOQUES_POR_CONSULTA = 5000;
const CONSULTAS_POR_PASADA = 20;

const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export function walletDe(red: RedCripto): string | null {
  const w = process.env.FESTIVAL_WALLET_EVM;
  return w && /^0x[0-9a-fA-F]{40}$/.test(w) ? w : null;
}

/** Redes que se pueden ofrecer: las que tienen wallet cargada. */
export const redesActivas = (): RedCripto[] => (Object.keys(REDES) as RedCripto[]).filter(r => walletDe(r));

/** `value` entero del token → decimal con 6 decimales, truncado. */
function aDecimal(valor: bigint, decimales: number): string {
  const escala = BigInt(10) ** BigInt(decimales);
  const entero = valor / escala;
  let resto = (valor % escala).toString().padStart(decimales, '0').slice(0, 6);
  resto = resto.padEnd(6, '0');
  return `${entero}.${resto}`;
}

async function rpc<T>(red: RedCripto, method: string, params: unknown[]): Promise<T> {
  const url = process.env[`CRIPTO_RPC_${red.toUpperCase()}`] || RPC_DEFECTO[red];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json();
  if (json.error || !res.ok) throw new Error(`RPC ${red} ${method}: ${JSON.stringify(json.error ?? res.status)}`);
  return json.result as T;
}

/**
 * Dónde arranca a mirar una orden que acaba de elegir red. Con un margen hacia
 * atrás por si el comprador ya tenía todo listo y mandó apenas vio la dirección.
 */
export async function puntoDePartida(red: RedCripto): Promise<number> {
  const ultimo = parseInt(await rpc<string>(red, 'eth_blockNumber', []), 16);
  return ultimo - 30;
}

/**
 * Trae las transferencias a la wallet desde el bloque `desde` hasta lo
 * confirmado. Devuelve también hasta dónde llegó, para guardar el cursor.
 */
export async function leerTransferencias(
  red: RedCripto,
  desde: number
): Promise<{ transferencias: Transferencia[]; hasta: number }> {
  const wallet = walletDe(red);
  if (!wallet) return { transferencias: [], hasta: desde };
  return leerEvm(red, wallet, desde);
}

async function leerEvm(
  red: RedCripto,
  wallet: string,
  desde: number
): Promise<{ transferencias: Transferencia[]; hasta: number }> {
  const tokens = REDES[red].tokens;
  const firme = parseInt(await rpc<string>(red, 'eth_blockNumber', []), 16) - CONFIRMACIONES[red];
  const destino = '0x' + wallet.slice(2).toLowerCase().padStart(64, '0');

  const transferencias: Transferencia[] = [];
  let hasta = desde - 1;
  for (let i = 0; i < CONSULTAS_POR_PASADA && hasta < firme; i++) {
    const inicio = hasta + 1;
    const fin = Math.min(inicio + BLOQUES_POR_CONSULTA - 1, firme);
    const logs = await rpc<
      { address: string; topics: string[]; data: string; transactionHash: string; logIndex: string; blockNumber: string }[]
    >(red, 'eth_getLogs', [
      {
        fromBlock: '0x' + inicio.toString(16),
        toBlock: '0x' + fin.toString(16),
        address: tokens.map(t => t.contrato),
        topics: [TOPIC_TRANSFER, null, destino],
      },
    ]);

    for (const log of logs) {
      const token = tokens.find(t => t.contrato.toLowerCase() === log.address.toLowerCase());
      if (!token || log.topics[2]?.toLowerCase() !== destino) continue;
      transferencias.push({
        red,
        token: token.simbolo,
        contrato: token.contrato,
        tx_hash: log.transactionHash.toLowerCase(),
        log_index: parseInt(log.logIndex, 16),
        desde: '0x' + log.topics[1].slice(26),
        monto: aDecimal(BigInt(log.data === '0x' ? 0 : log.data), token.decimales),
        bloque: parseInt(log.blockNumber, 16),
      });
    }
    hasta = fin;
  }
  return { transferencias, hasta: Math.max(hasta, desde - 1) };
}

/** Normaliza lo que pega el comprador (el hash o el link del explorador): `0x` + 64 hex. */
export function normalizarHash(valor: string): string | null {
  const v = valor.trim().toLowerCase().replace(/^.*\/tx\//, '');
  return /^0x[0-9a-f]{64}$/.test(v) ? v : null;
}
