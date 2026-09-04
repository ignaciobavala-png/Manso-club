'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { EspacioSala } from '@/lib/types/espacio';

/** Solo lo que la página dibuja, para que la vista previa del panel pueda
 *  pasarle borradores sin fila completa. */
export type SalaVista = Pick<EspacioSala, 'id' | 'nombre' | 'descripcion' | 'imagen_url'>;

interface Props {
  titulo: string;
  intro?: string | null;
  salas: SalaVista[];
}

/**
 * /nuestro-espacio — las salas del cowork.
 *
 * La refe que pasó Ana (somoseito.io#tariff-section) apila los nombres a la
 * izquierda: el elegido en color pleno y el resto apagados, con la foto al
 * costado cambiando al hacer click. Acá va en la paleta de Manso —crema sobre
 * negro, el activo en terra— y con los nombres bastante más chicos que en la
 * refe, que era el pedido explícito.
 *
 * La foto se sostiene sola en desktop (`sticky`) para que se siga viendo
 * mientras la lista es larga; en mobile la lista va arriba y la foto abajo.
 */
export const EspacioPagina = ({ titulo, intro, salas }: Props) => {
  const [activaId, setActivaId] = useState<string | null>(salas[0]?.id ?? null);
  const activa = salas.find(s => s.id === activaId) ?? salas[0] ?? null;

  return (
    <main className="min-h-screen bg-manso-black text-manso-cream">
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-24 md:pb-32">
        <h1 className="font-montreal font-black tracking-[-0.04em] leading-[0.9] text-5xl sm:text-6xl md:text-7xl break-words">
          {titulo}
        </h1>

        {intro?.trim() && (
          <div className="mt-6 max-w-2xl space-y-4">
            {intro.trim().split(/\n\n+/).map((p, i) => (
              <p
                key={i}
                className="text-sm md:text-base leading-relaxed text-manso-cream/70 whitespace-pre-line"
              >
                {p}
              </p>
            ))}
          </div>
        )}

        {salas.length === 0 ? (
          <p className="mt-16 text-sm text-manso-cream/40">Todavía no hay salas cargadas.</p>
        ) : (
          <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            {/* Lista de salas */}
            <ul className="space-y-1 md:space-y-2">
              {salas.map(sala => {
                const esActiva = sala.id === activa?.id;
                return (
                  <li key={sala.id}>
                    <button
                      type="button"
                      onClick={() => setActivaId(sala.id)}
                      aria-current={esActiva}
                      className={`block w-full text-left font-montreal font-black tracking-[-0.02em] leading-[1.05] text-2xl sm:text-3xl md:text-4xl py-1 transition-colors duration-300 ${
                        esActiva
                          ? 'text-manso-terra'
                          : 'text-manso-cream/25 hover:text-manso-cream/60'
                      }`}
                    >
                      {sala.nombre}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Foto de la sala elegida */}
            <div className="md:sticky md:top-28">
              <div className="relative w-full aspect-[4/3] overflow-hidden border border-manso-cream/10 bg-manso-cream/5">
                {activa?.imagen_url ? (
                  // Sin next/image: son fotos que sube Ana a Storage y el alto
                  // es por aspect-ratio, no fijo.
                  <img
                    key={activa.id}
                    src={activa.imagen_url}
                    alt={activa.nombre}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-manso-cream/25">
                    <ImageIcon size={28} />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                      Foto en camino
                    </span>
                  </div>
                )}
              </div>

              {activa?.descripcion?.trim() && (
                <p className="mt-4 text-sm leading-relaxed text-manso-cream/60 whitespace-pre-line">
                  {activa.descripcion}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
