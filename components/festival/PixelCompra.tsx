'use client';

import { useEffect } from 'react';
import { pixelBlur } from '@/lib/pixel-blur';

/**
 * Purchase del píxel de BLUR. Se monta solo en una compra YA pagada
 * (`/blurfestival/compra/[id]`, estado "pagada").
 *
 * Una vez por orden: ese link llega por mail y se vuelve a abrir, y cada
 * apertura no puede sumar otra venta. Se recuerda en el navegador y, además,
 * el `eventID` es el id de la orden, para que Meta deduplique si se repite.
 * En transferencia el Purchase sale cuando la persona abre su link con el pago
 * ya confirmado (la acreditación es manual); en Mercado Pago, al volver del
 * checkout.
 */
export function PixelCompra({
  ordenId,
  valor,
  items,
}: {
  ordenId: string;
  /** Total de la orden en pesos. */
  valor: number;
  items: { entrada_id: string; cantidad: number; precio_ars: number }[];
}) {
  useEffect(() => {
    const clave = `blur-pixel-purchase:${ordenId}`;
    try {
      if (localStorage.getItem(clave)) return;
    } catch {
      /* sin storage: se confía en el eventID para deduplicar */
    }
    let cancelado = false;
    void pixelBlur(
      'Purchase',
      {
        value: valor,
        currency: 'ARS',
        content_type: 'product',
        content_ids: items.map(i => i.entrada_id),
        contents: items.map(i => ({ id: i.entrada_id, quantity: i.cantidad, item_price: i.precio_ars })),
        num_items: items.reduce((n, i) => n + i.cantidad, 0),
      },
      ordenId
    ).then(salio => {
      if (!salio || cancelado) return;
      try {
        localStorage.setItem(clave, '1');
      } catch {
        /* idem */
      }
    });
    return () => {
      cancelado = true;
    };
  }, [ordenId, valor, items]);

  return null;
}
