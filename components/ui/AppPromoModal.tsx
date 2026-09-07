'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const APP_URL = 'https://app.mansoclub.com.ar';

/** Milisegundos desde que se abre la página hasta que aparece el popup. */
const DEMORA_MS = 4000;

/**
 * Quien lo cierra no lo vuelve a ver por una semana. Guardamos el momento del
 * cierre y no un booleano para poder mover la ventana sin invalidar la clave.
 */
const STORAGE_KEY = 'manso_app_promo_cerrado';
const REAPARECE_MS = 7 * 24 * 60 * 60 * 1000;

function fueCerradoRecientemente() {
  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    if (!guardado) return false;
    return Date.now() - Number(guardado) < REAPARECE_MS;
  } catch {
    // Navegador con storage bloqueado: mostramos el popup igual.
    return false;
  }
}

export function AppPromoModal() {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (fueCerradoRecientemente()) return;
    const timer = setTimeout(() => setAbierto(true), DEMORA_MS);
    return () => clearTimeout(timer);
  }, []);

  const cerrar = () => {
    setAbierto(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Sin storage el popup vuelve en la próxima visita; no es motivo de error.
    }
  };

  useEffect(() => {
    if (!abierto) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [abierto]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {abierto && (
        // No bloqueamos el scroll del fondo: el popup entra solo, a los 4
        // segundos, y trabar la página de alguien que está leyendo sería peor
        // que la promo.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={cerrar} aria-hidden="true" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-promo-titulo"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-md bg-manso-black border border-manso-cream/15 rounded-3xl p-7 sm:p-9 text-center"
          >
            <button
              onClick={cerrar}
              aria-label="Cerrar"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors"
            >
              <X size={16} />
            </button>

            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-4">
              Manso Club
            </p>
            <h2
              id="app-promo-titulo"
              className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-cream"
            >
              Manso en tu celular
            </h2>
            <p className="mt-5 text-manso-cream/55 text-sm font-light leading-relaxed">
              Agenda, membresía, eventos y comunidad en un solo lugar.
            </p>

            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={cerrar}
              className="mt-8 inline-flex w-full items-center justify-center px-6 py-4 rounded-full bg-manso-cream text-manso-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-manso-terra hover:text-manso-cream transition-colors"
            >
              Abrir web app
            </a>

            <button
              onClick={cerrar}
              className="mt-4 text-[11px] uppercase tracking-[0.2em] text-manso-cream/35 hover:text-manso-cream/70 transition-colors"
            >
              Ahora no
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
