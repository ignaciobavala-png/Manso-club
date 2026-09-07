'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  EspacioConfig,
  EspacioSala,
  MAX_FOTOS_SALA,
  fotosDeSala,
} from '@/lib/types/espacio';
import { CompactImageUploader } from './CompactImageUploader';

const BUCKET = 'membresias-gallery';
const INPUT =
  'w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors';
const LABEL = 'text-[10px] font-black uppercase tracking-widest text-manso-cream/60 mb-2 block';
const CARD = 'bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4 space-y-4';
const BOTON_ICONO =
  'w-8 h-8 flex items-center justify-center rounded-lg text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-manso-cream/40';
const BOTON_GUARDAR =
  'flex items-center gap-2 px-4 py-2 rounded-xl bg-manso-terra/20 text-manso-terra text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/30 transition-colors disabled:opacity-40';

/**
 * Sección "Nuestro espacio": las salas que se ven en /nuestro-espacio.
 *
 * Las ocho salas vienen sembradas por la migración, así que el uso normal es
 * cargarles la foto —lo único que falta— y como mucho retocar el nombre o el
 * orden. Mismo criterio que Cultura: cada sala se guarda por separado, y la
 * foto se guarda sola al subirla para que no quede colgada si Ana se va sin
 * apretar Guardar.
 */
export function EspacioAdmin() {
  const [config, setConfig] = useState<EspacioConfig | null>(null);
  const [salas, setSalas] = useState<EspacioSala[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [c, s] = await Promise.all([
      supabase.from('espacio_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('espacio_salas').select('*').order('orden', { ascending: true }),
    ]);

    setConfig((c.data as EspacioConfig | null) ?? { id: 1, titulo: 'Nuestro espacio', intro: '' });
    setSalas((s.data as EspacioSala[] | null) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  /** Edición local: lo que se ve en el form hasta que se aprieta Guardar. */
  const editarSala = (id: string, campos: Partial<EspacioSala>) =>
    setSalas(prev => prev.map(s => (s.id === id ? { ...s, ...campos } : s)));

  const guardarSala = async (id: string, campos: Record<string, unknown>) => {
    setGuardando(id);
    const { error } = await supabase.from('espacio_salas').update(campos).eq('id', id);
    setGuardando(null);
    if (error) alert(error.message);
  };

  /**
   * Escribe una foto en un hueco de la sala (o la saca, con `url` en null).
   *
   * El array se compacta —nada de huecos en el medio— y `imagen_url` sigue
   * siendo la primera: es la portada que leía la página cuando había una sola
   * foto, y así lo viejo no se rompe. Se guarda en el acto, igual que antes,
   * para que no quede colgada si Ana se va sin apretar Guardar.
   */
  const cambiarFoto = (sala: EspacioSala, slot: number, url: string | null) => {
    const fotos = fotosDeSala(sala);
    if (url) fotos[slot] = url;
    else fotos.splice(slot, 1);

    const imagenes = fotos.filter(Boolean).slice(0, MAX_FOTOS_SALA);
    const campos = { imagenes, imagen_url: imagenes[0] ?? null };

    editarSala(sala.id, campos);
    guardarSala(sala.id, campos);
  };

  const borrarSala = async (id: string) => {
    if (!confirm('¿Borrar la sala? No se puede deshacer.')) return;
    const { error } = await supabase.from('espacio_salas').delete().eq('id', id);
    if (error) return alert(error.message);
    cargar();
  };

  /**
   * Mueve una sala intercambiándola con su vecina. Se reescribe la lista entera
   * renumerada de 0 en adelante para que no queden huecos ni empates.
   */
  const mover = async (indice: number, delta: number) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= salas.length) return;

    const reordenadas = [...salas];
    [reordenadas[indice], reordenadas[destino]] = [reordenadas[destino], reordenadas[indice]];

    setGuardando(salas[indice].id);
    await Promise.all(
      reordenadas.map((sala, i) =>
        supabase.from('espacio_salas').update({ orden: i }).eq('id', sala.id)
      )
    );
    setGuardando(null);
    cargar();
  };

  const agregarSala = async () => {
    const orden = salas.reduce((max, s) => Math.max(max, s.orden), -1) + 1;
    const { error } = await supabase
      .from('espacio_salas')
      .insert({ nombre: 'Sala nueva', orden, activo: false });
    if (error) return alert(error.message);
    cargar();
  };

  const guardarConfig = async () => {
    if (!config) return;
    setGuardando('config');
    const { error } = await supabase.from('espacio_config').upsert({
      id: 1,
      titulo: config.titulo,
      intro: config.intro,
      updated_at: new Date().toISOString(),
    });
    setGuardando(null);
    if (error) alert(error.message);
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-xs text-manso-cream/40 py-10">
        <Loader2 size={14} className="animate-spin" />
        Cargando…
      </div>
    );
  }

  const sinFoto = salas.filter(s => s.activo && !s.imagen_url).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-manso-cream/50">
          Las salas que se ven en la página de Nuestro espacio.
        </p>
        <a
          href="/nuestro-espacio"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors"
        >
          Ver la página
          <ExternalLink size={11} />
        </a>
      </div>

      {sinFoto > 0 && (
        <p className="text-[11px] text-manso-cream/40 leading-relaxed">
          {sinFoto === 1
            ? 'Queda 1 sala sin foto: en la página se ve un placeholder hasta que la subas.'
            : `Quedan ${sinFoto} salas sin foto: en la página se ve un placeholder hasta que las subas.`}
        </p>
      )}

      {/* ── Encabezado ──────────────────────────────────────────────── */}
      <section className={CARD}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream">
          Encabezado
        </h3>

        <div>
          <label className={LABEL}>Título</label>
          <input
            type="text"
            value={config?.titulo ?? ''}
            onChange={e => setConfig(c => (c ? { ...c, titulo: e.target.value } : c))}
            placeholder="Nuestro espacio"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Bajada</label>
          <textarea
            value={config?.intro ?? ''}
            onChange={e => setConfig(c => (c ? { ...c, intro: e.target.value } : c))}
            placeholder="Un párrafo corto debajo del título. Dejá una línea en blanco para separar párrafos."
            rows={4}
            className={`${INPUT} resize-none`}
          />
        </div>

        <button
          type="button"
          onClick={guardarConfig}
          disabled={guardando === 'config'}
          className={BOTON_GUARDAR}
        >
          {guardando === 'config' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Guardar
        </button>
      </section>

      {/* ── Salas ───────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream">
            Salas
          </h3>
          <p className="text-[11px] text-manso-cream/40 mt-1 leading-relaxed">
            En la página los nombres van en una lista y la foto de la sala elegida se muestra al
            costado. El orden de acá es el orden de la lista.
          </p>
        </div>

        {salas.length === 0 && <p className="text-xs text-manso-cream/40">Sin salas todavía.</p>}

        {salas.map((sala, i) => (
          <div key={sala.id} className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">
                {sala.nombre || `Sala ${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  className={BOTON_ICONO}
                  title="Subir"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === salas.length - 1}
                  className={BOTON_ICONO}
                  title="Bajar"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editarSala(sala.id, { activo: !sala.activo });
                    guardarSala(sala.id, { activo: !sala.activo });
                  }}
                  className={BOTON_ICONO}
                  title={sala.activo ? 'Ocultar' : 'Mostrar'}
                >
                  {sala.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => borrarSala(sala.id)}
                  className={`${BOTON_ICONO} hover:text-manso-terra`}
                  title="Borrar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {!sala.activo && (
              <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/30">
                Oculta — no se ve en la página
              </p>
            )}

            <div>
              <label className={`${LABEL} flex items-center gap-2`}>
                <ImageIcon size={14} />
                Fotos de la sala (hasta {MAX_FOTOS_SALA})
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: MAX_FOTOS_SALA }, (_, slot) => {
                  const fotos = fotosDeSala(sala);
                  const url = fotos[slot] ?? null;
                  // Solo se habilita el hueco siguiente al último cargado: así
                  // el array no queda con agujeros y el orden de la página es
                  // el mismo que se ve acá.
                  const habilitado = slot <= fotos.length;

                  return (
                    <div key={slot} className="relative">
                      {habilitado ? (
                        <CompactImageUploader
                          // La key fuerza el remonte al borrar o reemplazar:
                          // el preview del uploader es estado interno suyo.
                          key={url ?? `vacio-${slot}-${fotos.length}`}
                          bucket={BUCKET}
                          folder="espacio/salas"
                          maxWidth={1800}
                          height="h-20"
                          initialPreview={url}
                          onUpload={nueva => cambiarFoto(sala, slot, nueva)}
                        />
                      ) : (
                        <div className="w-full h-20 rounded-xl border-2 border-dashed border-manso-cream/10 bg-manso-cream/[0.02]" />
                      )}

                      {url && (
                        <button
                          type="button"
                          onClick={() => cambiarFoto(sala, slot, null)}
                          title="Quitar foto"
                          className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center rounded-md bg-manso-black/70 text-manso-cream/70 hover:text-manso-terra hover:bg-manso-black transition-colors"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-manso-cream/30 mt-2 leading-relaxed">
                En la página rotan solas dentro del mismo cuadro. Con una sola
                foto se ve como hasta ahora; las que faltan no dejan hueco.
              </p>
            </div>

            <div>
              <label className={LABEL}>Nombre</label>
              <input
                type="text"
                value={sala.nombre}
                onChange={e => editarSala(sala.id, { nombre: e.target.value })}
                placeholder="Ej: Sala Olleros"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Descripción (opcional)</label>
              <textarea
                value={sala.descripcion ?? ''}
                onChange={e => editarSala(sala.id, { descripcion: e.target.value })}
                placeholder="Un par de líneas que se ven debajo de la foto."
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                guardarSala(sala.id, { nombre: sala.nombre, descripcion: sala.descripcion })
              }
              disabled={guardando === sala.id}
              className={BOTON_GUARDAR}
            >
              {guardando === sala.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              Guardar
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={agregarSala}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-manso-terra/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-manso-terra/60 hover:text-manso-terra hover:border-manso-terra/60 hover:bg-manso-terra/5 transition-all"
        >
          <Plus size={12} />
          Agregar sala
        </button>
      </section>
    </div>
  );
}
