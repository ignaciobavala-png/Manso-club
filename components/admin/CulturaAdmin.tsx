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
} from 'lucide-react';
import { CulturaBanner, CulturaBloque, CulturaConfig } from '@/lib/types/cultura';
import { ImageUploader } from './ImageUploader';

const BUCKET = 'membresias-gallery';
const INPUT =
  'w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors';
const LABEL = 'text-[10px] font-black uppercase tracking-widest text-manso-cream/60 mb-2 block';
const CARD = 'bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4 space-y-4';
const BOTON_ICONO =
  'w-8 h-8 flex items-center justify-center rounded-lg text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-manso-cream/40';

/**
 * Sección Cultura: edita todo lo que se ve en /mansocultural — el encabezado,
 * las bandas horizontales y las frases con fotos.
 *
 * Cada ítem se guarda por separado (su propio botón Guardar) en vez de tener un
 * "guardar todo" al pie: son bloques independientes y Ana suele tocar uno solo.
 * El orden se mueve con las flechas, que intercambian el `orden` con el vecino.
 */
export function CulturaAdmin() {
  const [config, setConfig] = useState<CulturaConfig | null>(null);
  const [banners, setBanners] = useState<CulturaBanner[]>([]);
  const [bloques, setBloques] = useState<CulturaBloque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [c, b, q] = await Promise.all([
      supabase.from('cultura_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('cultura_banners').select('*').order('orden', { ascending: true }),
      supabase.from('cultura_bloques').select('*').order('orden', { ascending: true }),
    ]);

    setConfig((c.data as CulturaConfig | null) ?? { id: 1, titulo: 'Cultural Manso', intro: '' });
    setBanners((b.data as CulturaBanner[] | null) ?? []);
    setBloques((q.data as CulturaBloque[] | null) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  /** Edición local: lo que se ve en el form hasta que se aprieta Guardar. */
  const editarBanner = (id: string, campos: Partial<CulturaBanner>) =>
    setBanners(prev => prev.map(b => (b.id === id ? { ...b, ...campos } : b)));

  const editarBloque = (id: string, campos: Partial<CulturaBloque>) =>
    setBloques(prev => prev.map(b => (b.id === id ? { ...b, ...campos } : b)));

  const guardarFila = async (tabla: string, id: string, campos: Record<string, unknown>) => {
    setGuardando(id);
    const { error } = await supabase.from(tabla).update(campos).eq('id', id);
    setGuardando(null);
    if (error) alert(error.message);
  };

  const borrarFila = async (tabla: string, id: string) => {
    if (!confirm('¿Borrar? No se puede deshacer.')) return;
    const { error } = await supabase.from(tabla).delete().eq('id', id);
    if (error) return alert(error.message);
    cargar();
  };

  /**
   * Mueve un ítem intercambiando el `orden` con su vecino. Se escribe la lista
   * entera renumerada de 0 en adelante para que no queden huecos ni empates si
   * algo se cargó a mano en la base.
   */
  const mover = async (
    tabla: string,
    items: { id: string; orden: number }[],
    indice: number,
    delta: number
  ) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= items.length) return;

    const reordenados = [...items];
    [reordenados[indice], reordenados[destino]] = [reordenados[destino], reordenados[indice]];

    setGuardando(items[indice].id);
    await Promise.all(
      reordenados.map((item, i) => supabase.from(tabla).update({ orden: i }).eq('id', item.id))
    );
    setGuardando(null);
    cargar();
  };

  const siguienteOrden = (items: { orden: number }[]) =>
    items.reduce((max, item) => Math.max(max, item.orden), -1) + 1;

  const agregarBanner = async () => {
    const { error } = await supabase.from('cultura_banners').insert({
      imagen_url: '',
      titulo: '',
      subtitulo: '',
      orden: siguienteOrden(banners),
      activo: false,
    });
    if (error) return alert(error.message);
    cargar();
  };

  const agregarBloque = async () => {
    const { error } = await supabase.from('cultura_bloques').insert({
      texto: '',
      orden: siguienteOrden(bloques),
      activo: false,
    });
    if (error) return alert(error.message);
    cargar();
  };

  const guardarConfig = async () => {
    if (!config) return;
    setGuardando('config');
    const { error } = await supabase
      .from('cultura_config')
      .upsert({ id: 1, titulo: config.titulo, intro: config.intro, updated_at: new Date().toISOString() });
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

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-manso-cream/50">
          Todo lo que se ve en la página de Cultura.
        </p>
        <a
          href="/mansocultural"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors"
        >
          Ver la página
          <ExternalLink size={11} />
        </a>
      </div>

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
            placeholder="Cultural Manso"
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-manso-terra/20 text-manso-terra text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/30 transition-colors disabled:opacity-40"
        >
          {guardando === 'config' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Guardar
        </button>
      </section>

      {/* ── Bandas horizontales ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream">
            Bandas horizontales
          </h3>
          <p className="text-[11px] text-manso-cream/40 mt-1 leading-relaxed">
            Las franjas de foto con texto encima. La segunda se ve más alta que las otras, y el
            patrón se repite cada tres.
          </p>
        </div>

        {banners.length === 0 && (
          <p className="text-xs text-manso-cream/40">Sin bandas todavía.</p>
        )}

        {banners.map((banner, i) => (
          <div key={banner.id} className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">
                Banda {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mover('cultura_banners', banners, i, -1)}
                  disabled={i === 0}
                  className={BOTON_ICONO}
                  title="Subir"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => mover('cultura_banners', banners, i, 1)}
                  disabled={i === banners.length - 1}
                  className={BOTON_ICONO}
                  title="Bajar"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editarBanner(banner.id, { activo: !banner.activo });
                    guardarFila('cultura_banners', banner.id, { activo: !banner.activo });
                  }}
                  className={BOTON_ICONO}
                  title={banner.activo ? 'Ocultar' : 'Mostrar'}
                >
                  {banner.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => borrarFila('cultura_banners', banner.id)}
                  className={`${BOTON_ICONO} hover:text-manso-terra`}
                  title="Borrar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {!banner.activo && (
              <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/30">
                Oculta — no se ve en la página
              </p>
            )}

            <div>
              <label className={`${LABEL} flex items-center gap-2`}>
                <ImageIcon size={14} />
                Foto de fondo
              </label>
              <ImageUploader
                bucket={BUCKET}
                folder="cultura/banners"
                maxWidth={2400}
                initialPreview={banner.imagen_url || null}
                onUpload={url => {
                  editarBanner(banner.id, { imagen_url: url });
                  guardarFila('cultura_banners', banner.id, { imagen_url: url });
                }}
              />
            </div>

            <div>
              <label className={LABEL}>Título</label>
              <input
                type="text"
                value={banner.titulo ?? ''}
                onChange={e => editarBanner(banner.id, { titulo: e.target.value })}
                placeholder="Ej: Club creativo"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Bajada</label>
              <textarea
                value={banner.subtitulo ?? ''}
                onChange={e => editarBanner(banner.id, { subtitulo: e.target.value })}
                placeholder="Dos o tres líneas cortas. Cada Enter es un renglón nuevo en la web."
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                guardarFila('cultura_banners', banner.id, {
                  titulo: banner.titulo,
                  subtitulo: banner.subtitulo,
                })
              }
              disabled={guardando === banner.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-manso-terra/20 text-manso-terra text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/30 transition-colors disabled:opacity-40"
            >
              {guardando === banner.id ? (
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
          onClick={agregarBanner}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-manso-terra/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-manso-terra/60 hover:text-manso-terra hover:border-manso-terra/60 hover:bg-manso-terra/5 transition-all"
        >
          <Plus size={12} />
          Agregar banda
        </button>
      </section>

      {/* ── Frases con fotos ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream">
            Frases con fotos
          </h3>
          <p className="text-[11px] text-manso-cream/40 mt-1 leading-relaxed">
            Cada frase va centrada, con una foto a cada lado. Los tamaños y las alturas los acomoda
            la web sola para que queden desparramadas.
          </p>
        </div>

        {bloques.length === 0 && (
          <p className="text-xs text-manso-cream/40">Sin frases todavía.</p>
        )}

        {bloques.map((bloque, i) => (
          <div key={bloque.id} className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">
                Frase {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mover('cultura_bloques', bloques, i, -1)}
                  disabled={i === 0}
                  className={BOTON_ICONO}
                  title="Subir"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => mover('cultura_bloques', bloques, i, 1)}
                  disabled={i === bloques.length - 1}
                  className={BOTON_ICONO}
                  title="Bajar"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editarBloque(bloque.id, { activo: !bloque.activo });
                    guardarFila('cultura_bloques', bloque.id, { activo: !bloque.activo });
                  }}
                  className={BOTON_ICONO}
                  title={bloque.activo ? 'Ocultar' : 'Mostrar'}
                >
                  {bloque.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => borrarFila('cultura_bloques', bloque.id)}
                  className={`${BOTON_ICONO} hover:text-manso-terra`}
                  title="Borrar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {!bloque.activo && (
              <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/30">
                Oculta — no se ve en la página
              </p>
            )}

            <div>
              <label className={LABEL}>Frase</label>
              <textarea
                value={bloque.texto}
                onChange={e => editarBloque(bloque.id, { texto: e.target.value })}
                placeholder="Ej: donde las amistades crecen alrededor de una mesa"
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Foto izquierda</label>
                <ImageUploader
                  bucket={BUCKET}
                  folder="cultura/frases"
                  maxWidth={1400}
                  initialPreview={bloque.foto_izquierda_url}
                  onUpload={url => {
                    editarBloque(bloque.id, { foto_izquierda_url: url });
                    guardarFila('cultura_bloques', bloque.id, { foto_izquierda_url: url });
                  }}
                />
              </div>
              <div>
                <label className={LABEL}>Foto derecha</label>
                <ImageUploader
                  bucket={BUCKET}
                  folder="cultura/frases"
                  maxWidth={1400}
                  initialPreview={bloque.foto_derecha_url}
                  onUpload={url => {
                    editarBloque(bloque.id, { foto_derecha_url: url });
                    guardarFila('cultura_bloques', bloque.id, { foto_derecha_url: url });
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => guardarFila('cultura_bloques', bloque.id, { texto: bloque.texto })}
              disabled={guardando === bloque.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-manso-terra/20 text-manso-terra text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/30 transition-colors disabled:opacity-40"
            >
              {guardando === bloque.id ? (
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
          onClick={agregarBloque}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-manso-terra/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-manso-terra/60 hover:text-manso-terra hover:border-manso-terra/60 hover:bg-manso-terra/5 transition-all"
        >
          <Plus size={12} />
          Agregar frase
        </button>
      </section>
    </div>
  );
}
