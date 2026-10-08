'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toSlug } from '@/lib/slug';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { FestivalArtista, FestivalEscenario } from '@/lib/types/festival';
import { CompactImageUploader } from './CompactImageUploader';
import {
  AYUDA,
  BOTON_AGREGAR,
  BOTON_GUARDAR,
  BOTON_ICONO,
  CARD,
  INPUT,
  LABEL,
  TITULO,
  TablaFestival,
  moverFila,
  siguienteOrden,
} from './festivalComun';

/**
 * Line-up de Subreal: escenarios y, adentro de cada uno, sus artistas. Cada
 * artista tiene página propia en /blur/line-up/[slug]; en el listado se
 * muestra en el orden de acá, y "B2B con el de arriba" lo pega al anterior.
 *
 * Las fichas de artista arrancan cerradas: con diez artistas y doce campos
 * cada uno, abiertas serían imposibles de recorrer.
 */
export function FestivalLineupAdmin() {
  const [escenarios, setEscenarios] = useState<FestivalEscenario[]>([]);
  const [artistas, setArtistas] = useState<FestivalArtista[]>([]);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  const cargar = useCallback(async () => {
    const [esc, art, conf] = await Promise.all([
      supabase.from('festival_escenarios').select('id, nombre, orden, activo').order('orden'),
      supabase.from('festival_artistas').select('*').order('orden'),
      supabase.from('festival_config').select('lineup_visible').eq('id', 1).maybeSingle(),
    ]);
    setEscenarios((esc.data as FestivalEscenario[] | null) ?? []);
    setArtistas((art.data as FestivalArtista[] | null) ?? []);
    setVisible(conf.data?.lineup_visible ?? true);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const guardarFila = async (tabla: TablaFestival, id: string, campos: Record<string, unknown>) => {
    setGuardando(id);
    const { error } = await supabase.from(tabla).update(campos).eq('id', id);
    setGuardando(null);
    if (error?.code === '23505') return alert('Ya hay otro artista con esa dirección. Cambiala por otra.');
    if (error) alert(error.message);
  };

  /** El interruptor general: se guarda al tocarlo. */
  const alternarVisible = async () => {
    const nuevo = !visible;
    setVisible(nuevo);
    setGuardando('lineup_visible');
    const { error } = await supabase.from('festival_config').update({ lineup_visible: nuevo }).eq('id', 1);
    setGuardando(null);
    if (error) {
      setVisible(!nuevo);
      alert(error.message);
    }
  };

  const borrarFila = async (tabla: TablaFestival, id: string, que: string) => {
    if (!confirm(`¿Borrar ${que}? No se puede deshacer.`)) return;
    const { error } = await supabase.from(tabla).delete().eq('id', id);
    if (error) return alert(error.message);
    cargar();
  };

  const mover = async (tabla: TablaFestival, filas: { id: string }[], indice: number, delta: number) => {
    setGuardando(filas[indice].id);
    await moverFila(tabla, filas, indice, delta);
    setGuardando(null);
    cargar();
  };

  const agregarEscenario = async () => {
    const { error } = await supabase
      .from('festival_escenarios')
      .insert({ nombre: 'Escenario nuevo', orden: siguienteOrden(escenarios) });
    if (error) return alert(error.message);
    cargar();
  };

  const agregarArtista = async (escenarioId: string) => {
    const delEscenario = artistas.filter(a => a.escenario_id === escenarioId);
    // Sufijo al azar: el slug es único y "artista-nuevo" chocaría con el segundo.
    const slug = `artista-nuevo-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from('festival_artistas')
      .insert({ nombre: 'Artista nuevo', slug, escenario_id: escenarioId, orden: siguienteOrden(delEscenario) })
      .select('id')
      .single();
    if (error) return alert(error.message);
    setAbiertos(prev => new Set(prev).add(data.id));
    cargar();
  };

  const editarEscenario = (id: string, campos: Partial<FestivalEscenario>) =>
    setEscenarios(prev => prev.map(e => (e.id === id ? { ...e, ...campos } : e)));

  const editarArtista = (id: string, campos: Partial<FestivalArtista>) =>
    setArtistas(prev => prev.map(a => (a.id === id ? { ...a, ...campos } : a)));

  const alternarAbierto = (id: string) =>
    setAbiertos(prev => {
      const sig = new Set(prev);
      if (sig.has(id)) sig.delete(id);
      else sig.add(id);
      return sig;
    });

  const guardarArtista = (a: FestivalArtista) => {
    const slug = toSlug(a.slug) || toSlug(a.nombre);
    editarArtista(a.id, { slug });
    const texto = (v: string | null) => v?.trim() || null;
    guardarFila('festival_artistas', a.id, {
      nombre: a.nombre.trim(),
      slug,
      b2b: a.b2b,
      pais: texto(a.pais)?.toUpperCase() ?? null,
      origen: texto(a.origen),
      bio: texto(a.bio),
      dia: texto(a.dia),
      horario: texto(a.horario),
      instagram: texto(a.instagram),
      soundcloud: texto(a.soundcloud),
      resident_advisor: texto(a.resident_advisor),
      youtube_url: texto(a.youtube_url),
    });
  };

  /** Pasa el artista a otro escenario, al final de la lista. */
  const cambiarEscenario = async (a: FestivalArtista, escenarioId: string) => {
    const destino = artistas.filter(x => x.escenario_id === escenarioId);
    await guardarFila('festival_artistas', a.id, {
      escenario_id: escenarioId,
      orden: siguienteOrden(destino),
      b2b: false,
    });
    cargar();
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-xs text-manso-cream/40 py-4">
        <Loader2 size={14} className="animate-spin" />
        Cargando line-up…
      </div>
    );
  }

  const iconoGuardar = (clave: string) =>
    guardando === clave ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />;

  // Los que quedaron sin escenario (se borró el suyo) no aparecen en la página.
  const sueltos = artistas.filter(a => !escenarios.some(e => e.id === a.escenario_id));

  const fichaArtista = (a: FestivalArtista, i: number, lista: FestivalArtista[]) => {
    const abierto = abiertos.has(a.id);
    return (
      <div key={a.id} className="border border-manso-cream/10 rounded-xl">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => alternarAbierto(a.id)}
            className="flex items-center gap-2 min-w-0 text-left text-xs font-bold text-manso-cream"
          >
            <ChevronDown size={13} className={`shrink-0 transition-transform ${abierto ? '' : '-rotate-90'}`} />
            <span className="truncate">{a.nombre || 'Sin nombre'}</span>
            {!a.activo && <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30">oculto</span>}
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {/* B2B a la vista y guardado al tocarlo: dentro de la ficha costaba encontrarlo. */}
            <button
              type="button"
              onClick={() => {
                editarArtista(a.id, { b2b: !a.b2b });
                guardarFila('festival_artistas', a.id, { b2b: !a.b2b });
              }}
              disabled={i === 0}
              title={i === 0 ? 'El primero no puede ser B2B: no tiene a nadie arriba' : a.b2b ? 'Separar del de arriba' : 'Hacer B2B con el de arriba'}
              className={`px-2 h-7 rounded-lg text-[9px] font-black tracking-widest transition-colors disabled:opacity-20 ${
                a.b2b ? 'bg-manso-olive text-manso-black' : 'text-manso-cream/40 border border-manso-cream/15 hover:text-manso-cream'
              }`}
            >
              B2B
            </button>
            <button type="button" onClick={() => mover('festival_artistas', lista, i, -1)} disabled={i === 0} className={BOTON_ICONO} title="Subir">
              <ArrowUp size={13} />
            </button>
            <button type="button" onClick={() => mover('festival_artistas', lista, i, 1)} disabled={i === lista.length - 1} className={BOTON_ICONO} title="Bajar">
              <ArrowDown size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                editarArtista(a.id, { activo: !a.activo });
                guardarFila('festival_artistas', a.id, { activo: !a.activo });
              }}
              className={BOTON_ICONO}
              title={a.activo ? 'Ocultar de la página' : 'Mostrar en la página'}
            >
              {a.activo ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
            <button type="button" onClick={() => borrarFila('festival_artistas', a.id, `a ${a.nombre}`)} className={`${BOTON_ICONO} hover:text-manso-terra`} title="Borrar">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {abierto && (
          <div className="px-3 pb-4 pt-2 space-y-4 border-t border-manso-cream/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Nombre</label>
                <input type="text" value={a.nombre} onChange={e => editarArtista(a.id, { nombre: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Dirección de su página</label>
                <input
                  type="text"
                  value={a.slug}
                  onChange={e => editarArtista(a.id, { slug: e.target.value })}
                  placeholder={toSlug(a.nombre)}
                  className={`${INPUT} font-mono`}
                />
                <p className={AYUDA}>/blur/line-up/{toSlug(a.slug) || toSlug(a.nombre)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={LABEL}>País</label>
                <input type="text" value={a.pais ?? ''} onChange={e => editarArtista(a.id, { pais: e.target.value })} placeholder="AR" maxLength={3} className={`${INPUT} uppercase`} />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <label className={LABEL}>Origen y género</label>
                <input type="text" value={a.origen ?? ''} onChange={e => editarArtista(a.id, { origen: e.target.value })} placeholder="Berlín — Techno / Dub" className={INPUT} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Día</label>
                <input type="text" value={a.dia ?? ''} onChange={e => editarArtista(a.id, { dia: e.target.value })} placeholder="Sáb 12.12" className={INPUT} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Horario del set</label>
                <input type="text" value={a.horario ?? ''} onChange={e => editarArtista(a.id, { horario: e.target.value })} placeholder="02:00 — 04:00" className={INPUT} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
              <div>
                <label className={`${LABEL} flex items-center gap-2`}>
                  <ImageIcon size={14} />
                  Foto
                </label>
                <CompactImageUploader
                  key={a.foto_url ?? `sin-foto-${a.id}`}
                  bucket="flyers"
                  folder="festival/artistas"
                  maxLado={1200}
                  height="h-40"
                  initialPreview={a.foto_url}
                  onUpload={url => {
                    editarArtista(a.id, { foto_url: url });
                    guardarFila('festival_artistas', a.id, { foto_url: url });
                  }}
                />
                <p className={AYUDA}>Cuadrada. Se guarda al subirla.</p>
                {a.foto_url && (
                  <button
                    type="button"
                    onClick={() => {
                      editarArtista(a.id, { foto_url: null });
                      guardarFila('festival_artistas', a.id, { foto_url: null });
                    }}
                    className="mt-2 text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-terra transition-colors"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <div>
                <label className={LABEL}>Bio</label>
                <textarea value={a.bio ?? ''} onChange={e => editarArtista(a.id, { bio: e.target.value })} rows={7} className={`${INPUT} resize-y`} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Instagram</label>
                <input type="text" value={a.instagram ?? ''} onChange={e => editarArtista(a.id, { instagram: e.target.value })} placeholder="@usuario o link" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>SoundCloud</label>
                <input type="text" value={a.soundcloud ?? ''} onChange={e => editarArtista(a.id, { soundcloud: e.target.value })} placeholder="usuario o link" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Resident Advisor</label>
                <input type="text" value={a.resident_advisor ?? ''} onChange={e => editarArtista(a.id, { resident_advisor: e.target.value })} placeholder="link" className={INPUT} />
              </div>
            </div>

            <div>
              <label className={LABEL}>Video de YouTube</label>
              <input type="text" value={a.youtube_url ?? ''} onChange={e => editarArtista(a.id, { youtube_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" className={INPUT} />
              <p className={AYUDA}>Un set o un tema. Se ve embebido en su página, debajo de la bio.</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => guardarArtista(a)} disabled={guardando === a.id} className={BOTON_GUARDAR}>
                  {iconoGuardar(a.id)}
                  Guardar
                </button>
                <a
                  href={`/blur/line-up/${a.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-cream transition-colors"
                >
                  Ver página <ExternalLink size={11} />
                </a>
              </div>
              {escenarios.length > 1 && (
                <select
                  value={a.escenario_id ?? ''}
                  onChange={e => cambiarEscenario(a, e.target.value)}
                  className="bg-transparent border border-manso-cream/10 rounded-lg px-2 py-1.5 text-[11px] text-manso-cream/60 [color-scheme:dark]"
                  title="Pasar a otro escenario"
                >
                  {escenarios.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className={TITULO}>Line-up</h3>
        <p className={AYUDA}>
          Los artistas aparecen en este orden, en escalera, y cada nombre lleva a su página. Para un
          B2B, cargá a los dos por separado, uno debajo del otro, y tocá{' '}
          <b className="text-manso-cream/70">B2B</b> en el segundo: se muestran juntos en el mismo
          renglón. El ojito oculta a un artista solo.
        </p>
      </div>

      <div
        className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 ${
          visible ? 'bg-manso-olive/15 border-manso-olive/40' : 'bg-manso-cream/5 border-manso-cream/10'
        }`}
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream">
            {visible ? 'Line-up visible en la página' : 'Line-up oculto'}
          </p>
          <p className="text-[11px] text-manso-cream/50 leading-relaxed max-w-md">
            {visible
              ? 'Se ven los escenarios y artistas no ocultos. Apagalo mientras el line-up no esté cerrado.'
              : 'La página dice "El line-up se anuncia pronto". Podés seguir cargando y ordenando acá sin que se vea.'}
          </p>
        </div>
        <button
          type="button"
          onClick={alternarVisible}
          disabled={guardando === 'lineup_visible'}
          className="px-4 py-2 rounded-xl border border-manso-cream/20 text-[9px] font-black uppercase tracking-widest text-manso-cream hover:bg-manso-cream/10 transition-colors disabled:opacity-40"
        >
          {visible ? 'Ocultar line-up' : 'Mostrar line-up'}
        </button>
      </div>

      {escenarios.length === 0 && <p className="text-xs text-manso-cream/40">Sin escenarios todavía.</p>}

      {escenarios.map((esc, i) => {
        const delEscenario = artistas.filter(a => a.escenario_id === esc.id);
        return (
          <div key={esc.id} className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 truncate">
                Escenario {i + 1} · {delEscenario.length} artistas
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => mover('festival_escenarios', escenarios, i, -1)} disabled={i === 0} className={BOTON_ICONO} title="Subir">
                  <ArrowUp size={13} />
                </button>
                <button type="button" onClick={() => mover('festival_escenarios', escenarios, i, 1)} disabled={i === escenarios.length - 1} className={BOTON_ICONO} title="Bajar">
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editarEscenario(esc.id, { activo: !esc.activo });
                    guardarFila('festival_escenarios', esc.id, { activo: !esc.activo });
                  }}
                  className={BOTON_ICONO}
                  title={esc.activo ? 'Ocultar' : 'Mostrar'}
                >
                  {esc.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    borrarFila(
                      'festival_escenarios',
                      esc.id,
                      delEscenario.length > 0
                        ? 'el escenario (sus artistas quedan sin escenario y dejan de verse)'
                        : 'el escenario'
                    )
                  }
                  className={`${BOTON_ICONO} hover:text-manso-terra`}
                  title="Borrar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {!esc.activo && (
              <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/30">
                Oculto — no se ve en la página
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={esc.nombre}
                onChange={e => editarEscenario(esc.id, { nombre: e.target.value })}
                placeholder="Ej: Main Stage"
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => guardarFila('festival_escenarios', esc.id, { nombre: esc.nombre })}
                disabled={guardando === esc.id}
                className={BOTON_GUARDAR}
              >
                {iconoGuardar(esc.id)}
              </button>
            </div>

            <div className="space-y-2">{delEscenario.map((a, k) => fichaArtista(a, k, delEscenario))}</div>

            <button type="button" onClick={() => agregarArtista(esc.id)} className={BOTON_AGREGAR}>
              <Plus size={12} />
              Agregar artista
            </button>
          </div>
        );
      })}

      {sueltos.length > 0 && (
        <div className={CARD}>
          <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">
            Sin escenario — no se ven en la página
          </p>
          {sueltos.map(a => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-xs text-manso-cream/70">
              <span className="truncate">{a.nombre}</span>
              <div className="flex items-center gap-2 shrink-0">
                {escenarios.length > 0 && (
                  <select
                    value=""
                    onChange={e => cambiarEscenario(a, e.target.value)}
                    className="bg-transparent border border-manso-cream/10 rounded-lg px-2 py-1.5 text-[11px] [color-scheme:dark]"
                  >
                    <option value="" disabled>
                      Pasar a…
                    </option>
                    {escenarios.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                )}
                <button type="button" onClick={() => borrarFila('festival_artistas', a.id, `a ${a.nombre}`)} className={`${BOTON_ICONO} hover:text-manso-terra`} title="Borrar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={agregarEscenario} className={BOTON_AGREGAR}>
        <Plus size={12} />
        Agregar escenario
      </button>
    </section>
  );
}
