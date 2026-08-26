'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Users } from 'lucide-react';
import { CoworkSolicitudCard } from './CoworkSolicitudCard';
import {
  fechaLarga,
  esPasada,
  ocupaCupo,
  type Estado,
  type Fecha,
  type Solicitud,
} from './CoworkTypes';

interface Props {
  fechas: Fecha[];
  solicitudes: Solicitud[];
  onRefetch: () => void;
  onEstado: (id: string, estado: Estado) => void;
  onBorrar: (id: string) => void;
}

type Ventana = 'proximas' | 'mes' | 'dos_meses' | 'todas';

/** Corre la fecha de hoy N meses hacia atrás. */
function haceMeses(meses: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - meses);
  return d;
}

const VENTANAS: { id: Ventana; label: string; desde: () => Date | null }[] = [
  { id: 'proximas',  label: 'Próximas',      desde: () => null },
  { id: 'mes',       label: 'Último mes',    desde: () => haceMeses(1) },
  { id: 'dos_meses', label: 'Últimos 2 meses', desde: () => haceMeses(2) },
  { id: 'todas',     label: 'Todas',         desde: () => null },
];

const inputCls =
  'w-full p-2.5 bg-manso-cream/10 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream text-sm';

/**
 * Open Cowork se organiza por fecha, no por estado: lo que Ana necesita saber
 * es quiénes vienen el lunes. Cada fecha es un bloque con sus cupos y sus
 * anotados adentro.
 */
export function CoworkOpenCowork({ fechas, solicitudes, onRefetch, onEstado, onBorrar }: Props) {
  const [nueva, setNueva] = useState({ fecha: '', horario: '', cupos_maximos: '20' });
  const [ventana, setVentana] = useState<Ventana>('proximas');

  const agregarFecha = async () => {
    if (!nueva.fecha) return;
    await supabase.from('cowork_fechas').insert({
      fecha: nueva.fecha,
      horario: nueva.horario || null,
      cupos_maximos: Number(nueva.cupos_maximos) || 20,
    });
    setNueva({ fecha: '', horario: '', cupos_maximos: '20' });
    onRefetch();
  };

  const toggleFecha = async (f: Fecha) => {
    await supabase.from('cowork_fechas').update({ activo: !f.activo }).eq('id', f.id);
    onRefetch();
  };

  const anotados = (fechaId: string) => solicitudes.filter(s => s.fecha_id === fechaId);

  /**
   * Solo se borran fechas vacías. Con anotados el borrado dejaría sus
   * solicitudes sin fecha (la FK es SET NULL): no se pierde a la persona, pero
   * sí el dato de para qué día se había anotado, y eso no se recupera. Para
   * sacarla de la web está "Ocultar", que no toca a nadie.
   */
  const borrarFecha = async (f: Fecha) => {
    if (anotados(f.id).length > 0) return;
    await supabase.from('cowork_fechas').delete().eq('id', f.id);
    onRefetch();
  };

  // Con 20 cupos por encuentro la lista de fechas se acumula rápido, así que
  // por defecto solo se ven las próximas y el archivo se abre por ventanas.
  const desdeVentana = VENTANAS.find(v => v.id === ventana)!.desde();
  const visibles = fechas
    .filter(f => {
      if (ventana === 'proximas') return !esPasada(f.fecha);
      if (!desdeVentana) return true;
      return new Date(`${f.fecha}T00:00:00`) >= desdeVentana;
    })
    // Las próximas van de la más cercana en adelante; el archivo, de la más
    // reciente hacia atrás.
    .sort((a, b) =>
      ventana === 'proximas' ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha),
    );

  const contarEn = (v: Ventana) => {
    const desde = VENTANAS.find(x => x.id === v)!.desde();
    return fechas.filter(f => {
      if (v === 'proximas') return !esPasada(f.fecha);
      if (!desde) return true;
      return new Date(`${f.fecha}T00:00:00`) >= desde;
    }).length;
  };

  // Anotados que quedaron sin fecha (la fecha se borró después de anotarse).
  const huerfanas = solicitudes.filter(s => !s.fecha_id);


  return (
    <div className="space-y-8">
      {/* Alta de fecha */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/50 mb-3">
          Sumar una fecha
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="date"
            className={`${inputCls} w-auto flex-1 min-w-[140px]`}
            value={nueva.fecha}
            onChange={e => setNueva(p => ({ ...p, fecha: e.target.value }))}
          />
          <input
            type="time"
            className={`${inputCls} w-auto`}
            value={nueva.horario}
            onChange={e => setNueva(p => ({ ...p, horario: e.target.value }))}
          />
          <input
            type="number"
            min="1"
            title="Cupos"
            className={`${inputCls} w-20`}
            value={nueva.cupos_maximos}
            onChange={e => setNueva(p => ({ ...p, cupos_maximos: e.target.value }))}
          />
          <button
            onClick={agregarFecha}
            disabled={!nueva.fecha}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-manso-terra/30 text-[9px] font-black uppercase tracking-widest text-manso-terra/60 hover:text-manso-terra hover:border-manso-terra/60 hover:bg-manso-terra/5 transition-all disabled:opacity-25"
          >
            <Plus size={12} />
            Sumar fecha
          </button>
        </div>
      </div>

      {/* Ventana temporal: el archivo crece rápido y Ana necesita acotarlo */}
      <div className="flex flex-wrap gap-2">
        {VENTANAS.map(v => (
          <button
            key={v.id}
            onClick={() => setVentana(v.id)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
              ventana === v.id
                ? 'bg-manso-terra text-manso-cream border-manso-terra'
                : 'text-manso-cream/40 border-manso-cream/15 hover:text-manso-cream/70 hover:border-manso-cream/30'
            }`}
          >
            {v.label} ({contarEn(v.id)})
          </button>
        ))}
      </div>

      {/* Fechas con sus anotados */}
      {visibles.length === 0 ? (
        <p className="text-xs text-manso-cream/30 font-light py-6 text-center">
          {fechas.length === 0
            ? 'Sin fechas cargadas. El acordeón de la web aparece vacío hasta que sumes una.'
            : 'No hay encuentros en este período.'}
        </p>
      ) : (
        <div className="space-y-5">
          {visibles.map(f => {
            const gente = anotados(f.id);
            const ocupados = gente.filter(ocupaCupo).length;
            const lleno = ocupados >= f.cupos_maximos;
            const pasada = esPasada(f.fecha);
            // Cuenta a todos los atados a la fecha, incluso rechazados: borrarla
            // les rompería el registro igual.
            const tieneGente = gente.length > 0;

            return (
              <div
                key={f.id}
                className={`border rounded-2xl overflow-hidden ${
                  pasada || !f.activo
                    ? 'border-manso-cream/5 opacity-50'
                    : 'border-manso-cream/15'
                }`}
              >
                {/* Cabecera de la fecha */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-manso-cream/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-manso-cream font-medium">
                      {fechaLarga(f.fecha, f.horario)}
                    </span>
                    {pasada && (
                      <span className="text-[9px] uppercase tracking-widest text-manso-cream/30">
                        Ya pasó
                      </span>
                    )}
                    {!f.activo && !pasada && (
                      <span className="text-[9px] uppercase tracking-widest text-manso-cream/30">
                        Oculta en la web
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${
                        lleno ? 'text-manso-terra' : 'text-manso-cream/50'
                      }`}
                    >
                      <Users size={12} />
                      {ocupados} / {f.cupos_maximos}
                    </span>
                    <button
                      onClick={() => toggleFecha(f)}
                      className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                        tieneGente && f.activo
                          ? 'text-manso-terra hover:text-manso-cream'
                          : 'text-manso-cream/40 hover:text-manso-cream'
                      }`}
                      title={
                        tieneGente && f.activo
                          ? 'Saca la fecha de la web sin tocar a los anotados'
                          : undefined
                      }
                    >
                      {f.activo ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button
                      onClick={() => borrarFecha(f)}
                      disabled={tieneGente}
                      title={
                        tieneGente
                          ? `No se puede borrar: hay ${gente.length} ${gente.length === 1 ? 'persona anotada' : 'personas anotadas'}. Usá "Ocultar".`
                          : 'Borrar esta fecha'
                      }
                      className="text-manso-cream/25 hover:text-red-400 transition-colors disabled:text-manso-cream/10 disabled:cursor-not-allowed disabled:hover:text-manso-cream/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Anotados */}
                <div className="p-3 space-y-3">
                  {gente.length === 0 ? (
                    <p className="text-xs text-manso-cream/25 font-light py-3 text-center">
                      Nadie anotado todavía.
                    </p>
                  ) : (
                    gente.map(s => (
                      <CoworkSolicitudCard
                        key={s.id}
                        solicitud={s}
                        onEstado={onEstado}
                        onBorrar={onBorrar}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {huerfanas.length > 0 && (
        <div className="border-t border-manso-cream/10 pt-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/50">
            Sin fecha asignada
          </p>
          {huerfanas.map(s => (
            <CoworkSolicitudCard
              key={s.id}
              solicitud={s}
              onEstado={onEstado}
              onBorrar={onBorrar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
