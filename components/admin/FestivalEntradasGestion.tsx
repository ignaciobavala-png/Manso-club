'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatArs } from '@/lib/precios';
import { etiquetaEstado } from '@/lib/types/festival';
import type { TipoGestion } from '@/lib/gestion-entradas';
import { AYUDA, CARD, TITULO } from './festivalComun';

type Estado =
  | { cargando: true }
  | { cargando: false; conectado: false }
  | { cargando: false; conectado: true; tipos?: TipoGestion[]; error?: string };

/**
 * La sección Entradas del panel. Con la venta conectada a Manso Gestión los
 * tipos, precios y cupos se cargan allá, así que acá se muestran sin editar,
 * con lo que queda de cada uno. Sin conectar, muestra el editor de siempre
 * (`children`).
 */
export function FestivalEntradasGestion({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ cargando: true });

  useEffect(() => {
    fetch('/api/festival/gestion')
      .then(r => r.json())
      .then(data => setEstado({ cargando: false, ...data }))
      .catch(() => setEstado({ cargando: false, conectado: false }));
  }, []);

  if (estado.cargando) return <Loader2 size={16} className="animate-spin text-manso-cream/40" />;
  if (!estado.conectado) return <>{children}</>;

  return (
    <section className={CARD}>
      <div>
        <h3 className={TITULO}>Entradas</h3>
        <p className={AYUDA}>
          La venta está conectada a Manso Gestión: los tipos, precios, cupos y estados se cargan allá, en el evento del
          festival, y la web los toma de ahí. El stock es uno solo para la web y la app.
        </p>
      </div>

      {estado.error ? (
        <p className="text-[11px] text-manso-terra">{estado.error}</p>
      ) : (estado.tipos ?? []).length === 0 ? (
        <p className="text-[11px] text-manso-cream/40">El evento no tiene tipos de entrada cargados en Gestión.</p>
      ) : (
        <ul className="divide-y divide-manso-cream/10">
          {(estado.tipos ?? []).map(t => (
            <li key={t.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-manso-cream truncate">{t.nombre}</p>
                <p className="text-[11px] text-manso-cream/40">
                  {etiquetaEstado(t.estado_efectivo)}
                  {t.entradas_por_unidad > 1 && ` · ${t.entradas_por_unidad} entradas por unidad`}
                  {' · '}
                  {t.disponibles_entradas === null ? 'sin tope' : `quedan ${t.disponibles_entradas} entradas`}
                </p>
              </div>
              <span className="text-sm font-mono text-manso-cream tabular-nums">{formatArs(t.precio)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
