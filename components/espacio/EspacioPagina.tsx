'use client';

import { KeyboardEvent, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { EspacioSala } from '@/lib/types/espacio';

/** Solo lo que la página dibuja, para que la vista previa del panel pueda
 *  pasarle borradores sin fila completa. */
export type SalaVista = Pick<EspacioSala, 'id' | 'nombre' | 'descripcion' | 'imagen_url'>;

interface Props {
  titulo: string;
  intro?: string | null;
  salas: SalaVista[];
}

const dosDigitos = (n: number) => String(n + 1).padStart(2, '0');

/**
 * /nuestro-espacio — las salas del cowork.
 *
 * La refe que pasó Ana (somoseito.io#tariff-section) apila los nombres a la
 * izquierda: el elegido en color pleno y el resto apagados, con la foto al
 * costado cambiando al hacer click. Acá va en la paleta de Manso —crema sobre
 * negro, el activo en terra— y con los nombres bastante más chicos que en la
 * refe, que era el pedido explícito.
 *
 * El movimiento es lo que evita que la foto quede como una lámina pegada:
 * entra con un fundido y un desplazamiento corto, y mientras está quieta hace
 * un zoom lentísimo que va y vuelve. Nada de esto corre si el sistema pide
 * menos animación.
 */
export const EspacioPagina = ({ titulo, intro, salas }: Props) => {
  const [activaId, setActivaId] = useState<string | null>(salas[0]?.id ?? null);
  const menosMovimiento = useReducedMotion();

  const indice = Math.max(0, salas.findIndex(s => s.id === activaId));
  const activa = salas[indice] ?? null;

  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  /** Elige una sala y le lleva el foco, para que la navegación con flechas y
   *  lo que se ve resaltado no se separen. Da la vuelta en los extremos. */
  const irA = (i: number) => {
    if (salas.length === 0) return;
    const destino = (i + salas.length) % salas.length;
    setActivaId(salas[destino].id);
    botones.current[destino]?.focus();
  };

  const alPresionarTecla = (e: KeyboardEvent<HTMLUListElement>) => {
    const salto: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };

    if (e.key in salto) {
      e.preventDefault(); // si no, la flecha scrollea la página
      irA(indice + salto[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      irA(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      irA(salas.length - 1);
    }
  };

  return (
    <main className="relative min-h-screen bg-manso-black text-manso-cream overflow-hidden">
      {/* Los puntos animados, como en /membresias. Siempre montado: no lo
          afecta el cambio de sala. */}
      <ParticleBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-24 md:pb-32">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-montreal font-black tracking-[-0.04em] leading-[0.9] text-5xl sm:text-6xl md:text-7xl break-words"
        >
          {titulo}
        </motion.h1>

        {intro?.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-2xl space-y-4"
          >
            {intro.trim().split(/\n\n+/).map((p, i) => (
              <p
                key={i}
                className="text-sm md:text-base leading-relaxed text-manso-cream/70 whitespace-pre-line"
              >
                {p}
              </p>
            ))}
          </motion.div>
        )}

        {salas.length === 0 ? (
          <p className="mt-16 text-sm text-manso-cream/40">Todavía no hay salas cargadas.</p>
        ) : (
          <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            {/* Lista de salas. Es un tablist: se entra con Tab una sola vez
                —el activo es el único que recibe foco— y adentro se recorre
                con las flechas, que es lo que espera cualquiera que llegue
                desde el teclado. */}
            <ul role="tablist" aria-label="Salas" onKeyDown={alPresionarTecla}>
              {salas.map((sala, i) => {
                const esActiva = i === indice;
                return (
                  <motion.li
                    key={sala.id}
                    role="presentation"
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15 + i * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <button
                      type="button"
                      role="tab"
                      id={`sala-${sala.id}`}
                      ref={el => {
                        botones.current[i] = el;
                      }}
                      onClick={() => setActivaId(sala.id)}
                      aria-selected={esActiva}
                      aria-controls="espacio-foto"
                      tabIndex={esActiva ? 0 : -1}
                      className="group relative flex w-full items-baseline gap-3 sm:gap-4 py-1 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-manso-terra/60"
                    >
                      {/* La barra del activo se desliza de un nombre a otro en
                          vez de aparecer y desaparecer: es el mismo elemento
                          movido por `layoutId`. */}
                      {esActiva && (
                        <motion.span
                          layoutId="espacio-marca"
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 h-[2px] w-2.5 sm:w-4 bg-manso-terra"
                        />
                      )}

                      <span
                        className={`shrink-0 text-[9px] font-black tracking-[0.2em] tabular-nums transition-colors duration-300 ${
                          esActiva ? 'text-manso-terra' : 'text-manso-cream/20'
                        }`}
                      >
                        {dosDigitos(i)}
                      </span>

                      <span
                        className={`font-montreal font-black tracking-[-0.02em] leading-[1.05] text-2xl sm:text-3xl md:text-4xl transition-all duration-300 group-hover:translate-x-1 ${
                          esActiva
                            ? 'text-manso-terra'
                            : 'text-manso-cream/25 group-hover:text-manso-cream/60'
                        }`}
                      >
                        {sala.nombre}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            {/* Foto de la sala elegida */}
            <div className="md:sticky md:top-28">
              <div
                id="espacio-foto"
                role="tabpanel"
                aria-labelledby={activa ? `sala-${activa.id}` : undefined}
                className="relative w-full aspect-[4/3] overflow-hidden border border-manso-cream/10 bg-manso-cream/5"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activa?.id ?? 'vacio'}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    {activa?.imagen_url ? (
                      <motion.img
                        // Sin next/image: son fotos que sube Ana a Storage y el
                        // alto es por aspect-ratio, no fijo.
                        src={activa.imagen_url}
                        alt={activa.nombre}
                        className="w-full h-full object-cover"
                        animate={menosMovimiento ? undefined : { scale: [1, 1.07] }}
                        transition={{
                          duration: 14,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'linear',
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-manso-cream/25">
                        <ImageIcon size={28} />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                          Foto en camino
                        </span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Nombre sobre la foto: en mobile la lista queda arriba y sin
                    esto no se sabe qué sala se está mirando. */}
                {activa && (
                  <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-4 bg-gradient-to-t from-manso-black/80 to-transparent pt-14">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={activa.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[10px] font-black uppercase tracking-[0.25em] text-manso-cream"
                      >
                        {activa.nombre}
                      </motion.span>
                    </AnimatePresence>
                    <span className="shrink-0 text-[10px] font-black tracking-[0.2em] tabular-nums text-manso-cream/40">
                      {dosDigitos(indice)} / {dosDigitos(salas.length - 1)}
                    </span>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {activa?.descripcion?.trim() && (
                  <motion.p
                    key={activa.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4 text-sm leading-relaxed text-manso-cream/60 whitespace-pre-line"
                  >
                    {activa.descripcion}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
