'use client';

import { useState } from 'react';
import { useCurrency } from '@/store/useCurrency';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { CoworkModal } from '@/components/ui/CoworkModal';

interface Props {
  membresiaId: string;
  membresiaNombre: string;
  precio: number;
  periodo: string;
}

/**
 * Pie de la página de detalle: precio a la derecha y botón pill a todo el ancho,
 * como el "COMPRAR BONO" de la refe. Va aparte del resto de la página porque el
 * precio depende del toggle de moneda y el botón abre el formulario — las dos
 * cosas son de cliente, y el detalle en sí se renderiza en el servidor.
 */
export const MembresiaDetalleCTA = ({ membresiaId, membresiaNombre, precio, periodo }: Props) => {
  const [formAbierto, setFormAbierto] = useState(false);
  const { currency, rate } = useCurrency();

  const monto =
    currency === 'ARS' && rate
      ? Math.round(precio * rate).toLocaleString('es-AR')
      : precio.toLocaleString('es-AR');

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <CurrencyToggle />
        <span className="text-lg font-bold text-manso-cream">
          {currency} {monto}{' '}
          <span className="text-xs font-normal text-manso-cream/70">/ {periodo}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFormAbierto(true)}
        className="flex items-center justify-center w-full px-6 min-h-[48px] rounded-full bg-manso-cream text-manso-black text-[11px] font-black uppercase tracking-[0.25em] transition-opacity duration-200 hover:opacity-85 active:scale-[0.99]"
      >
        Seleccionar
      </button>

      <CoworkModal
        open={formAbierto}
        onClose={() => setFormAbierto(false)}
        origen="membresia"
        membresiaId={membresiaId}
        membresiaNombre={membresiaNombre}
      />
    </div>
  );
};
