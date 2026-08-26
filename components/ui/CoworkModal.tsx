'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CoworkForm, type CoworkFecha } from './CoworkForm';

interface CoworkModalProps {
  open: boolean;
  onClose: () => void;
  origen: 'membresia' | 'open_cowork';
  membresiaId?: string;
  membresiaNombre?: string;
}

const COWORK_INFO =
  'Un espacio de trabajo para bajar un cambio sin dejar de hacer, crear vínculos ' +
  'genuinos y rodearte de gente talentosa, creativa y con ideas.';

const OPEN_COWORK_INFO =
  'Abrimos el cowork para que vengan a conocer a otras personas de la comunidad, ' +
  'compartir ideas, proyectos, charlas.';

function formatearFecha(fecha: string, horario: string | null) {
  const d = new Date(`${fecha}T00:00:00`);
  const texto = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const capitalizado = texto.charAt(0).toUpperCase() + texto.slice(1);
  return horario ? `${capitalizado} · ${horario.slice(0, 5)}` : capitalizado;
}

export function CoworkModal({ open, onClose, origen, membresiaId, membresiaNombre }: CoworkModalProps) {
  const [fechas, setFechas] = useState<CoworkFecha[]>([]);
  const [fechaId, setFechaId] = useState<string | null>(null);
  const [acordeonAbierto, setAcordeonAbierto] = useState(true);

  // Bloquear el scroll del fondo mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || origen !== 'open_cowork') return;

    const fetchFechas = async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const [{ data: filas }, { data: cupos }] = await Promise.all([
        supabase
          .from('cowork_fechas')
          .select('id, fecha, horario, cupos_maximos')
          .eq('activo', true)
          .gte('fecha', hoy)
          .order('fecha', { ascending: true }),
        supabase.rpc('cowork_cupos'),
      ]);

      const ocupadosPorFecha = new Map<string, number>(
        (cupos ?? []).map((c: { fecha_id: string; ocupados: number | string }) => [
          c.fecha_id,
          Number(c.ocupados),
        ]),
      );

      setFechas(
        (filas ?? []).map(f => ({
          ...f,
          ocupados: ocupadosPorFecha.get(f.id) ?? 0,
        })),
      );
    };

    fetchFechas();
  }, [open, origen]);

  // El modal solo se abre por interacción del usuario, así que en el render del
  // servidor `open` es false y nunca se llega a tocar document.
  if (!open || typeof document === 'undefined') return null;

  const esOpenCowork = origen === 'open_cowork';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-xl my-0 sm:my-10 bg-manso-black border border-manso-cream/15 sm:rounded-3xl min-h-screen sm:min-h-0 p-6 sm:p-9"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Encabezado */}
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-4">
          {esOpenCowork ? 'Manso Club' : 'Inscripción'}
        </p>
        <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
          {esOpenCowork ? 'Open Cowork' : 'Cowork Manso Club'}
        </h2>

        {esOpenCowork ? (
          <>
            <p className="mt-5 text-manso-cream/55 text-sm font-light leading-relaxed">
              {OPEN_COWORK_INFO}
            </p>
            <p className="mt-3 text-manso-cream text-sm font-bold">20 cupos por encuentro.</p>

            {/* Acordeón de fechas */}
            <div className="mt-7 border border-manso-cream/15 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setAcordeonAbierto(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-manso-cream/5 transition-colors"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream">
                  Elegí tu fecha
                </span>
                <ChevronDown
                  size={14}
                  className={`text-manso-cream/40 transition-transform duration-200 ${acordeonAbierto ? 'rotate-180' : ''}`}
                />
              </button>

              {acordeonAbierto && (
                <div className="border-t border-manso-cream/10 p-2 space-y-1">
                  {fechas.length === 0 ? (
                    <p className="px-3 py-4 text-sm font-light text-manso-cream/35">
                      Todavía no hay fechas publicadas. Escribinos y te avisamos.
                    </p>
                  ) : (
                    fechas.map(f => {
                      const libres = f.cupos_maximos - f.ocupados;
                      const completo = libres <= 0;
                      const elegida = fechaId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          disabled={completo}
                          onClick={() => setFechaId(elegida ? null : f.id)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                            completo
                              ? 'opacity-35 cursor-not-allowed'
                              : elegida
                                ? 'bg-manso-terra/15 border border-manso-terra/50'
                                : 'border border-transparent hover:bg-manso-cream/5'
                          }`}
                        >
                          <span className="text-sm font-light text-manso-cream">
                            {formatearFecha(f.fecha, f.horario)}
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] uppercase tracking-widest text-manso-cream/40">
                              {completo ? 'Completo' : `${libres} de ${f.cupos_maximos}`}
                            </span>
                            {elegida && <Check size={14} className="text-manso-terra" />}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="mt-5 text-manso-cream/55 text-sm font-light leading-relaxed">
            {COWORK_INFO}
          </p>
        )}

        <div className="mt-8">
          <CoworkForm
            origen={origen}
            membresiaId={membresiaId}
            membresiaNombre={membresiaNombre}
            fechaId={fechaId}
            onSuccess={() => setFechaId(null)}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
