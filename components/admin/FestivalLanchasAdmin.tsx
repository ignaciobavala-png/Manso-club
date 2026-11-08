'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { FestivalLancha } from '@/lib/types/festival';
import {
  AYUDA,
  BOTON_AGREGAR,
  BOTON_GUARDAR,
  BOTON_ICONO,
  CARD,
  INPUT,
  LABEL,
  TITULO,
  moverFila,
  siguienteOrden,
} from './festivalComun';

/**
 * Transporte: los viajes en lancha. Cada tarjeta es un viaje con su hora de
 * salida y de regreso (24 h). Se pueden dejar vacías hasta tener el dato; si el
 * regreso es menor que la salida se entiende que es pasada la medianoche.
 */
export function FestivalLanchasAdmin() {
  const [lanchas, setLanchas] = useState<FestivalLancha[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('festival_lanchas').select('*').order('orden', { ascending: true });
    setLanchas((data as FestivalLancha[] | null) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const editar = (id: string, campos: Partial<FestivalLancha>) =>
    setLanchas(prev => prev.map(l => (l.id === id ? { ...l, ...campos } : l)));

  const guardar = async (id: string, campos: Partial<FestivalLancha>) => {
    setGuardando(id);
    const { error } = await supabase.from('festival_lanchas').update(campos).eq('id', id);
    setGuardando(null);
    if (error) alert(error.message);
  };

  const agregar = async () => {
    const { error } = await supabase
      .from('festival_lanchas')
      .insert({ nombre: `Lancha ${lanchas.length + 1}`, orden: siguienteOrden(lanchas) });
    if (error) return alert(error.message);
    cargar();
  };

  const borrar = async (lancha: FestivalLancha) => {
    if (!confirm(`¿Borrar "${lancha.nombre}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from('festival_lanchas').delete().eq('id', lancha.id);
    if (error) return alert(error.message);
    cargar();
  };

  const mover = async (indice: number, delta: number) => {
    setGuardando(lanchas[indice].id);
    await moverFila('festival_lanchas', lanchas, indice, delta);
    setGuardando(null);
    cargar();
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className={TITULO}>Transporte</h3>
        <p className={AYUDA}>
          Los viajes en lancha: a qué hora sale cada una y a qué hora vuelve. Las horas van en formato
          de 24 h; si el regreso es de madrugada (por ejemplo salida 18:00 y regreso 02:30) se entiende
          que es después de medianoche. Podés dejar una hora vacía hasta confirmarla.
        </p>
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-[13px] text-manso-cream/62">
          <Loader2 size={14} className="animate-spin" />
          Cargando transporte…
        </div>
      ) : (
        lanchas.length === 0 && <p className="text-[13px] text-manso-cream/62">Sin viajes todavía.</p>
      )}

      {lanchas.map((lancha, i) => (
        <div key={lancha.id} className={CARD}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-black uppercase tracking-widest text-manso-cream/62 truncate">
              {lancha.nombre || `Viaje ${i + 1}`}
              {!lancha.activo && ' · oculto'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className={BOTON_ICONO} title="Subir">
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === lanchas.length - 1}
                className={BOTON_ICONO}
                title="Bajar"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  editar(lancha.id, { activo: !lancha.activo });
                  guardar(lancha.id, { activo: !lancha.activo });
                }}
                className={BOTON_ICONO}
                title={lancha.activo ? 'Ocultar' : 'Mostrar'}
              >
                {lancha.activo ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button type="button" onClick={() => borrar(lancha)} className={`${BOTON_ICONO} hover:text-manso-terra`} title="Borrar">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL}>Nombre del viaje</label>
            <input
              type="text"
              value={lancha.nombre}
              onChange={e => editar(lancha.id, { nombre: e.target.value })}
              placeholder="Ej: Lancha 1"
              className={INPUT}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Salida</label>
              <input
                type="time"
                value={lancha.salida ?? ''}
                onChange={e => editar(lancha.id, { salida: e.target.value || null })}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Regreso</label>
              <input
                type="time"
                value={lancha.regreso ?? ''}
                onChange={e => editar(lancha.id, { regreso: e.target.value || null })}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Nota (opcional)</label>
            <input
              type="text"
              value={lancha.nota}
              onChange={e => editar(lancha.id, { nota: e.target.value })}
              placeholder="Ej: último viaje, punto de encuentro…"
              className={INPUT}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              guardar(lancha.id, {
                nombre: lancha.nombre.trim(),
                salida: lancha.salida || null,
                regreso: lancha.regreso || null,
                nota: lancha.nota.trim(),
              })
            }
            disabled={guardando === lancha.id}
            className={BOTON_GUARDAR}
          >
            {guardando === lancha.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Guardar
          </button>
        </div>
      ))}

      <button type="button" onClick={agregar} className={BOTON_AGREGAR}>
        <Plus size={12} />
        Agregar viaje
      </button>
    </section>
  );
}
