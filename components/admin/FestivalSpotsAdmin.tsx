'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { FestivalSpot } from '@/lib/types/festival';
import { GaleriaFotosAdmin } from './GaleriaFotosAdmin';
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
 * Spots de /blur/spots: los lugares de la fiesta, cada uno con título,
 * descripción y fotos. Título y texto se guardan con el botón; las fotos, al
 * subirlas o moverlas, igual que las de Locación.
 */
export function FestivalSpotsAdmin() {
  const [spots, setSpots] = useState<FestivalSpot[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('festival_spots').select('*').order('orden', { ascending: true });
    setSpots((data as FestivalSpot[] | null) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const editar = (id: string, campos: Partial<FestivalSpot>) =>
    setSpots(prev => prev.map(s => (s.id === id ? { ...s, ...campos } : s)));

  const guardar = async (id: string, campos: Partial<FestivalSpot>) => {
    setGuardando(id);
    const { error } = await supabase.from('festival_spots').update(campos).eq('id', id);
    setGuardando(null);
    if (error) alert(error.message);
  };

  const agregar = async () => {
    const { error } = await supabase
      .from('festival_spots')
      .insert({ titulo: 'Spot nuevo', orden: siguienteOrden(spots) });
    if (error) return alert(error.message);
    cargar();
  };

  const borrar = async (spot: FestivalSpot) => {
    if (!confirm(`¿Borrar "${spot.titulo}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from('festival_spots').delete().eq('id', spot.id);
    if (error) return alert(error.message);
    cargar();
  };

  const mover = async (indice: number, delta: number) => {
    setGuardando(spots[indice].id);
    await moverFila('festival_spots', spots, indice, delta);
    setGuardando(null);
    cargar();
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className={TITULO}>Spots</h3>
        <p className={AYUDA}>
          Los lugares de la fiesta, en /blur/spots: un bloque por escenario o rincón, con su
          nombre, una descripción y fotos. Se muestran en este orden.
        </p>
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-xs text-manso-cream/40">
          <Loader2 size={14} className="animate-spin" />
          Cargando spots…
        </div>
      ) : (
        spots.length === 0 && <p className="text-xs text-manso-cream/40">Sin spots todavía.</p>
      )}

      {spots.map((spot, i) => (
        <div key={spot.id} className={CARD}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 truncate">
              {spot.titulo || `Spot ${i + 1}`}
              {!spot.activo && ' · oculto'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className={BOTON_ICONO} title="Subir">
                <ArrowUp size={13} />
              </button>
              <button type="button" onClick={() => mover(i, 1)} disabled={i === spots.length - 1} className={BOTON_ICONO} title="Bajar">
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  editar(spot.id, { activo: !spot.activo });
                  guardar(spot.id, { activo: !spot.activo });
                }}
                className={BOTON_ICONO}
                title={spot.activo ? 'Ocultar' : 'Mostrar'}
              >
                {spot.activo ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button type="button" onClick={() => borrar(spot)} className={`${BOTON_ICONO} hover:text-manso-terra`} title="Borrar">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL}>Nombre del escenario o lugar</label>
            <input
              type="text"
              value={spot.titulo}
              onChange={e => editar(spot.id, { titulo: e.target.value })}
              placeholder="Ej: Escenario Bosque"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Descripción</label>
            <textarea
              value={spot.descripcion}
              onChange={e => editar(spot.id, { descripcion: e.target.value })}
              placeholder="Cómo es, qué suena ahí, cómo se llega."
              rows={4}
              className={`${INPUT} resize-y`}
            />
          </div>
          <button
            type="button"
            onClick={() => guardar(spot.id, { titulo: spot.titulo.trim(), descripcion: spot.descripcion.trim() })}
            disabled={guardando === spot.id}
            className={BOTON_GUARDAR}
          >
            {guardando === spot.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Guardar
          </button>

          <div>
            <label className={LABEL}>Fotos ({spot.fotos.length})</label>
            <GaleriaFotosAdmin
              fotos={spot.fotos}
              folder="festival/spots"
              onChange={fotos => {
                editar(spot.id, { fotos });
                guardar(spot.id, { fotos });
              }}
            />
            <p className={AYUDA}>Podés elegir varias a la vez. Se guardan solas; arrastralas o usá las flechas para ordenarlas.</p>
          </div>
        </div>
      ))}

      <button type="button" onClick={agregar} className={BOTON_AGREGAR}>
        <Plus size={12} />
        Agregar spot
      </button>
    </section>
  );
}
