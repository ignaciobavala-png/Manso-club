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
import {
  CONFIG_FESTIVAL_VACIA,
  ESTADOS_ENTRADA,
  EstadoEntrada,
  FestivalConfig,
  FestivalEntrada,
  FestivalFaq,
} from '@/lib/types/festival';
import { formatArs } from '@/lib/precios';
import { CompactImageUploader } from './CompactImageUploader';
import { FestivalLineupAdmin } from './FestivalLineupAdmin';
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
 * Sección "Festival": Subreal, el sitio chico de /festival (hero, visión,
 * locación, line-up con página por artista, tickets e info).
 *
 * Tiene identidad propia —sin navbar de Manso— y mientras no se publique solo
 * la ven los admins (el RLS tampoco deja leer nada a un anónimo). Mismo
 * criterio que Espacio: cada bloque se guarda por separado.
 */
export function FestivalAdmin() {
  const [config, setConfig] = useState<FestivalConfig>(CONFIG_FESTIVAL_VACIA);
  const [faq, setFaq] = useState<FestivalFaq[]>([]);
  const [entradas, setEntradas] = useState<FestivalEntrada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [c, ent, preg] = await Promise.all([
      supabase.from('festival_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('festival_entradas').select('*').order('orden', { ascending: true }),
      supabase.from('festival_faq').select('*').order('orden', { ascending: true }),
    ]);

    setConfig({ ...CONFIG_FESTIVAL_VACIA, ...((c.data as FestivalConfig | null) ?? {}) });
    setFaq((preg.data as FestivalFaq[] | null) ?? []);
    setEntradas(
      ((ent.data as FestivalEntrada[] | null) ?? []).map(e => ({ ...e, precio: Number(e.precio) }))
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  // ── Config ─────────────────────────────────────────────────────────────

  const editarConfig = (campos: Partial<FestivalConfig>) => setConfig(c => ({ ...c, ...campos }));

  const guardarConfig = async (campos: Partial<FestivalConfig>, clave = 'config') => {
    setGuardando(clave);
    const { error } = await supabase
      .from('festival_config')
      .upsert({ id: 1, ...campos, updated_at: new Date().toISOString() });
    setGuardando(null);
    if (error) alert(error.message);
  };

  const guardarDatos = () => {
    const { nombre, bajada, fecha, horario, lugar, direccion, aviso, lema, instagram, email } = config;
    guardarConfig({
      nombre,
      bajada,
      fecha: fecha || null,
      horario,
      lugar,
      direccion,
      aviso,
      lema,
      instagram: instagram?.trim().replace(/^@/, '') || null,
      email: email?.trim() || null,
    });
  };

  const guardarTextos = () => {
    const { vision, locacion } = config;
    guardarConfig({ vision: vision?.trim() || null, locacion: locacion?.trim() || null }, 'textos');
  };

  const guardarColores = () => {
    const { color_fondo, color_texto, color_acento, color_resalte } = config;
    guardarConfig({ color_fondo, color_texto, color_acento, color_resalte }, 'colores');
  };

  const alternarPublicado = () => {
    const publicado = !config.publicado;
    if (
      publicado &&
      !confirm('¿Publicar el festival? La página /festival pasa a verse para cualquiera que tenga el link.')
    ) {
      return;
    }
    editarConfig({ publicado });
    guardarConfig({ publicado }, 'publicado');
  };

  // ── Filas (entradas y preguntas) ───────────────────────────────────────

  const guardarFila = async (tabla: TablaFestival, id: string, campos: Record<string, unknown>) => {
    setGuardando(id);
    const { error } = await supabase.from(tabla).update(campos).eq('id', id);
    setGuardando(null);
    if (error) alert(error.message);
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

  const agregarPregunta = async () => {
    const { error } = await supabase
      .from('festival_faq')
      .insert({ titulo: 'Pregunta nueva', orden: siguienteOrden(faq) });
    if (error) return alert(error.message);
    cargar();
  };

  const agregarEntrada = async () => {
    const { error } = await supabase.from('festival_entradas').insert({
      nombre: 'Entrada nueva',
      estado: 'proximamente',
      orden: siguienteOrden(entradas),
      activo: false,
    });
    if (error) return alert(error.message);
    cargar();
  };

  const editarPregunta = (id: string, campos: Partial<FestivalFaq>) =>
    setFaq(prev => prev.map(p => (p.id === id ? { ...p, ...campos } : p)));

  const editarEntrada = (id: string, campos: Partial<FestivalEntrada>) =>
    setEntradas(prev => prev.map(e => (e.id === id ? { ...e, ...campos } : e)));

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-xs text-manso-cream/40 py-10">
        <Loader2 size={14} className="animate-spin" />
        Cargando…
      </div>
    );
  }

  const iconoGuardar = (clave: string) =>
    guardando === clave ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />;

  return (
    <div className="space-y-10 max-w-3xl">
      {/* ── Estado ──────────────────────────────────────────────────── */}
      <section
        className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 ${
          config.publicado
            ? 'bg-manso-olive/15 border-manso-olive/40'
            : 'bg-manso-cream/5 border-manso-cream/10'
        }`}
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream">
            {config.publicado ? 'Publicado' : 'Borrador — no publicado'}
          </p>
          <p className="text-[11px] text-manso-cream/50 leading-relaxed max-w-md">
            {config.publicado
              ? 'Cualquiera con el link ve /festival. No está enlazado desde el sitio de Manso.'
              : 'Solo los admins pueden ver /festival. Para el resto la página no existe.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/festival"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors"
          >
            Ver la página
            <ExternalLink size={11} />
          </a>
          <button
            type="button"
            onClick={alternarPublicado}
            disabled={guardando === 'publicado'}
            className="px-4 py-2 rounded-xl border border-manso-cream/20 text-[9px] font-black uppercase tracking-widest text-manso-cream hover:bg-manso-cream/10 transition-colors disabled:opacity-40"
          >
            {config.publicado ? 'Despublicar' : 'Publicar'}
          </button>
        </div>
      </section>

      <p className="text-[11px] text-manso-cream/40 leading-relaxed">
        La compra online todavía no está conectada: la página muestra la tabla de entradas y
        deja elegir cantidades, pero el botón de comprar no cobra.
      </p>

      {/* ── Datos ───────────────────────────────────────────────────── */}
      <section className={CARD}>
        <h3 className={TITULO}>Datos del festival</h3>

        <div>
          <label className={`${LABEL} flex items-center gap-2`}>
            <ImageIcon size={14} />
            Flyer
          </label>
          <div className="max-w-xs">
            <CompactImageUploader
              key={config.flyer_url ?? 'sin-flyer'}
              bucket="flyers"
              folder="festival"
              maxWidth={2000}
              height="h-40"
              initialPreview={config.flyer_url}
              onUpload={url => {
                // Se guarda en el acto, igual que las fotos de Espacio, para
                // que no quede colgado si se sale sin apretar Guardar.
                editarConfig({ flyer_url: url });
                guardarConfig({ flyer_url: url }, 'flyer');
              }}
            />
          </div>
          {config.flyer_url && (
            <button
              type="button"
              onClick={() => {
                editarConfig({ flyer_url: null });
                guardarConfig({ flyer_url: null }, 'flyer');
              }}
              className="mt-2 text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-terra transition-colors"
            >
              Quitar flyer
            </button>
          )}
        </div>

        <div>
          <label className={LABEL}>Nombre</label>
          <input
            type="text"
            value={config.nombre}
            onChange={e => editarConfig({ nombre: e.target.value })}
            placeholder="Subreal"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Bajada (opcional)</label>
          <textarea
            value={config.bajada ?? ''}
            onChange={e => editarConfig({ bajada: e.target.value })}
            placeholder="Un párrafo corto debajo del nombre."
            rows={3}
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Fecha</label>
            <input
              type="date"
              value={config.fecha ?? ''}
              onChange={e => editarConfig({ fecha: e.target.value || null })}
              className={`${INPUT} [color-scheme:dark]`}
            />
          </div>
          <div>
            <label className={LABEL}>Horario</label>
            <input
              type="text"
              value={config.horario ?? ''}
              onChange={e => editarConfig({ horario: e.target.value })}
              placeholder="Ej: 16 a 06 hs"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Lugar</label>
            <input
              type="text"
              value={config.lugar ?? ''}
              onChange={e => editarConfig({ lugar: e.target.value })}
              placeholder="Ej: Club Ciudad"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Dirección</label>
            <input
              type="text"
              value={config.direccion ?? ''}
              onChange={e => editarConfig({ direccion: e.target.value })}
              placeholder="Ej: Av. Libertador 7501, CABA"
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>Aviso (debajo de la tabla)</label>
          <input
            type="text"
            value={config.aviso ?? ''}
            onChange={e => editarConfig({ aviso: e.target.value })}
            placeholder="Evento solo para mayores de 18 años."
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Segunda línea del hero (opcional)</label>
          <input
            type="text"
            value={config.lema ?? ''}
            onChange={e => editarConfig({ lema: e.target.value })}
            placeholder="Ej: Hecho en Argentina"
            className={INPUT}
          />
          <p className={AYUDA}>Va en una cajita debajo de la fecha, en la portada.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Instagram del festival</label>
            <input
              type="text"
              value={config.instagram ?? ''}
              onChange={e => editarConfig({ instagram: e.target.value })}
              placeholder="@subreal"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Mail de contacto</label>
            <input
              type="email"
              value={config.email ?? ''}
              onChange={e => editarConfig({ email: e.target.value })}
              placeholder="festival@mansoclub.com.ar"
              className={INPUT}
            />
          </div>
        </div>
        <p className={AYUDA}>Instagram y mail aparecen en el pie de todas las páginas; sin cargar, no se muestran.</p>

        <button type="button" onClick={guardarDatos} disabled={guardando === 'config'} className={BOTON_GUARDAR}>
          {iconoGuardar('config')}
          Guardar
        </button>
      </section>

      {/* ── Textos ──────────────────────────────────────────────────── */}
      <section className={CARD}>
        <div>
          <h3 className={TITULO}>Visión y Locación</h3>
          <p className={AYUDA}>
            Un renglón en blanco separa párrafos. Para pintar palabras, como en Basilar:{' '}
            <code className="text-manso-cream/70">*así*</code> va en el color de resalte y{' '}
            <code className="text-manso-cream/70">**así**</code> en el de acento.
          </p>
        </div>

        <div>
          <label className={LABEL}>Visión</label>
          <textarea
            value={config.vision ?? ''}
            onChange={e => editarConfig({ vision: e.target.value })}
            placeholder={'Subreal es un encuentro *chico y cuidado*, pensado para una comunidad que viene a **escuchar música**.'}
            rows={8}
            className={`${INPUT} resize-y`}
          />
        </div>

        <div>
          <label className={LABEL}>Locación</label>
          <textarea
            value={config.locacion ?? ''}
            onChange={e => editarConfig({ locacion: e.target.value })}
            placeholder={'A una hora de la ciudad, entre *árboles y agua*.'}
            rows={5}
            className={`${INPUT} resize-y`}
          />
          <p className={AYUDA}>
            Debajo del texto se arma solo un cuadro con lugar, fecha y horario (de &quot;Datos del
            festival&quot;), y al lado la foto de Locación.
          </p>
        </div>

        <button type="button" onClick={guardarTextos} disabled={guardando === 'textos'} className={BOTON_GUARDAR}>
          {iconoGuardar('textos')}
          Guardar
        </button>
      </section>

      {/* ── Imágenes ────────────────────────────────────────────────── */}
      <section className={CARD}>
        <div>
          <h3 className={TITULO}>Imágenes de la página</h3>
          <p className={AYUDA}>
            Se guardan al subirlas. El banner va de fondo en la portada, oscurecido para que se lea
            el nombre; la foto va en la página de Locación, con marco de foto revelada.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ['banner_url', 'Banner (arriba)', 'Horizontal, mínimo 1920 px de ancho.'],
              ['foto_url', 'Foto de Locación', 'Vertical (4:5).'],
            ] as const
          ).map(([campo, etiqueta, ayuda]) => (
            <div key={campo}>
              <label className={`${LABEL} flex items-center gap-2`}>
                <ImageIcon size={14} />
                {etiqueta}
              </label>
              <CompactImageUploader
                key={config[campo] ?? `sin-${campo}`}
                bucket="flyers"
                folder="festival"
                maxWidth={2400}
                height="h-40"
                initialPreview={config[campo]}
                onUpload={url => {
                  editarConfig({ [campo]: url });
                  guardarConfig({ [campo]: url }, campo);
                }}
              />
              <p className={AYUDA}>{ayuda}</p>
              {config[campo] && (
                <button
                  type="button"
                  onClick={() => {
                    editarConfig({ [campo]: null });
                    guardarConfig({ [campo]: null }, campo);
                  }}
                  className="mt-2 text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-terra transition-colors"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Identidad ───────────────────────────────────────────────── */}
      <section className={CARD}>
        <div>
          <h3 className={TITULO}>Identidad</h3>
          <p className={AYUDA}>
            Por defecto, la paleta de Manso pasada a la estética de Basilar: marrón casi negro,
            crema, terra y oliva. El acento pinta el menú y los botones; el resalte, las palabras
            marcadas con *asteriscos* y los B2B.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ['color_fondo', 'Fondo'],
              ['color_texto', 'Texto'],
              ['color_acento', 'Acento'],
              ['color_resalte', 'Resalte'],
            ] as const
          ).map(([campo, etiqueta]) => (
            <div key={campo}>
              <label className={LABEL}>{etiqueta}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config[campo]}
                  onChange={e => editarConfig({ [campo]: e.target.value })}
                  className="w-11 h-11 shrink-0 rounded-lg bg-transparent border border-manso-cream/10 cursor-pointer"
                />
                <input
                  type="text"
                  value={config[campo]}
                  onChange={e => editarConfig({ [campo]: e.target.value })}
                  className={`${INPUT} font-mono uppercase`}
                />
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={guardarColores} disabled={guardando === 'colores'} className={BOTON_GUARDAR}>
          {iconoGuardar('colores')}
          Guardar
        </button>
      </section>

      {/* ── Entradas ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className={TITULO}>Entradas</h3>
          <p className={AYUDA}>
            Cada una es una fila de la tabla de venta, en este orden. Solo las que están{' '}
            <em>en venta</em> dejan elegir cantidad; el resto muestra su estado en lugar del
            selector. Para un pack, poné el precio del pack entero y cuántas entradas trae.
          </p>
        </div>

        {entradas.length === 0 && <p className="text-xs text-manso-cream/40">Sin entradas todavía.</p>}

        {entradas.map((entrada, i) => (
          <div key={entrada.id} className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 truncate">
                {entrada.nombre || `Entrada ${i + 1}`}
                {entrada.precio > 0 && ` · ${formatArs(entrada.precio)}`}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => mover('festival_entradas', entradas, i, -1)} disabled={i === 0} className={BOTON_ICONO} title="Subir">
                  <ArrowUp size={13} />
                </button>
                <button type="button" onClick={() => mover('festival_entradas', entradas, i, 1)} disabled={i === entradas.length - 1} className={BOTON_ICONO} title="Bajar">
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editarEntrada(entrada.id, { activo: !entrada.activo });
                    guardarFila('festival_entradas', entrada.id, { activo: !entrada.activo });
                  }}
                  className={BOTON_ICONO}
                  title={entrada.activo ? 'Ocultar' : 'Mostrar'}
                >
                  {entrada.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button type="button" onClick={() => borrarFila('festival_entradas', entrada.id, 'la entrada')} className={`${BOTON_ICONO} hover:text-manso-terra`} title="Borrar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {!entrada.activo && (
              <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/30">
                Oculta — no aparece en la tabla
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LABEL}>Nombre</label>
                <input
                  type="text"
                  value={entrada.nombre}
                  onChange={e => editarEntrada(entrada.id, { nombre: e.target.value })}
                  placeholder="Ej: Entrada general - Etapa 1"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Precio (ARS)</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={entrada.precio}
                  onChange={e => editarEntrada(entrada.id, { precio: Number(e.target.value) || 0 })}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Estado</label>
                <select
                  value={entrada.estado}
                  onChange={e => editarEntrada(entrada.id, { estado: e.target.value as EstadoEntrada })}
                  className={`${INPUT} [color-scheme:dark]`}
                >
                  {ESTADOS_ENTRADA.map(e => (
                    <option key={e.valor} value={e.valor}>
                      {e.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Entradas que trae</label>
                <input
                  type="number"
                  min={1}
                  value={entrada.entradas_por_unidad}
                  onChange={e => editarEntrada(entrada.id, { entradas_por_unidad: Math.max(1, Number(e.target.value) || 1) })}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Máximo por compra</label>
                <input
                  type="number"
                  min={1}
                  value={entrada.max_por_compra}
                  onChange={e => editarEntrada(entrada.id, { max_por_compra: Math.max(1, Number(e.target.value) || 1) })}
                  className={INPUT}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Descripción (opcional)</label>
                <input
                  type="text"
                  value={entrada.descripcion ?? ''}
                  onChange={e => editarEntrada(entrada.id, { descripcion: e.target.value })}
                  placeholder="Una línea chica debajo del nombre."
                  className={INPUT}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                guardarFila('festival_entradas', entrada.id, {
                  nombre: entrada.nombre,
                  descripcion: entrada.descripcion || null,
                  precio: entrada.precio,
                  estado: entrada.estado,
                  entradas_por_unidad: entrada.entradas_por_unidad,
                  max_por_compra: entrada.max_por_compra,
                })
              }
              disabled={guardando === entrada.id}
              className={BOTON_GUARDAR}
            >
              {iconoGuardar(entrada.id)}
              Guardar
            </button>
          </div>
        ))}

        <button type="button" onClick={agregarEntrada} className={BOTON_AGREGAR}>
          <Plus size={12} />
          Agregar entrada
        </button>
      </section>

      <FestivalLineupAdmin />

      {/* ── Info & FAQ ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className={TITULO}>Info &amp; FAQ</h3>
          <p className={AYUDA}>
            Cada pregunta es un bloque de /festival/info: título corto en mayúsculas y un párrafo.
            Se acomodan en tres columnas en este orden.
          </p>
        </div>

        {faq.length === 0 && <p className="text-xs text-manso-cream/40">Sin preguntas todavía.</p>}

        {faq.map((p, i) => (
          <div key={p.id} className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 truncate">
                {p.titulo || `Pregunta ${i + 1}`}
                {!p.activo && ' · oculta'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => mover('festival_faq', faq, i, -1)} disabled={i === 0} className={BOTON_ICONO} title="Subir">
                  <ArrowUp size={13} />
                </button>
                <button type="button" onClick={() => mover('festival_faq', faq, i, 1)} disabled={i === faq.length - 1} className={BOTON_ICONO} title="Bajar">
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editarPregunta(p.id, { activo: !p.activo });
                    guardarFila('festival_faq', p.id, { activo: !p.activo });
                  }}
                  className={BOTON_ICONO}
                  title={p.activo ? 'Ocultar' : 'Mostrar'}
                >
                  {p.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button type="button" onClick={() => borrarFila('festival_faq', p.id, 'la pregunta')} className={`${BOTON_ICONO} hover:text-manso-terra`} title="Borrar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div>
              <label className={LABEL}>Título</label>
              <input
                type="text"
                value={p.titulo}
                onChange={e => editarPregunta(p.id, { titulo: e.target.value })}
                placeholder="Ej: Edad"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Texto</label>
              <textarea
                value={p.texto}
                onChange={e => editarPregunta(p.id, { texto: e.target.value })}
                placeholder="Ej: El evento es para mayores de 18. Se pide DNI en la puerta."
                rows={4}
                className={`${INPUT} resize-y`}
              />
            </div>

            <button
              type="button"
              onClick={() => guardarFila('festival_faq', p.id, { titulo: p.titulo.trim(), texto: p.texto.trim() })}
              disabled={guardando === p.id}
              className={BOTON_GUARDAR}
            >
              {iconoGuardar(p.id)}
              Guardar
            </button>
          </div>
        ))}

        <button type="button" onClick={agregarPregunta} className={BOTON_AGREGAR}>
          <Plus size={12} />
          Agregar pregunta
        </button>
      </section>
    </div>
  );
}
