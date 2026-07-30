'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CompactImageUploader } from './CompactImageUploader';
import { AUDIENCIAS, type Audiencia } from '@/lib/mailing-audiencias';
import type { Hotspot } from '@/emails/campania-generica';
import {
  Image as ImageIcon,
  MousePointerClick,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  AlertCircle,
  CheckCircle,
  CalendarClock,
  X,
  Type as TypeIcon,
} from 'lucide-react';

type Separacion = 'pegado' | 'poco' | 'normal' | 'mucho';

/**
 * Bloques que se pueden apilar en el mail. `canvas` es una pieza gráfica con
 * zonas clickeables dibujadas encima; `boton` y `texto` son HTML real.
 *
 * Preferir botón y texto HTML sobre dibujarlos dentro de la imagen: no se
 * pueden romper al recortar, se leen aunque el cliente bloquee las imágenes
 * (Gmail lo hace por defecto con remitentes nuevos), son seleccionables y
 * bajan la puntuación de spam de un mail que si no sería 100% imagen.
 */
type BloqueEditor =
  | { tipo: 'canvas'; url: string; alt: string; hotspots: Hotspot[] }
  | { tipo: 'boton'; texto: string; link: string; color: string; separacion: Separacion }
  | { tipo: 'texto'; contenido: string };

const SEPARACIONES: { id: Separacion; label: string }[] = [
  { id: 'pegado', label: 'Pegado al bloque anterior' },
  { id: 'poco', label: 'Poco aire' },
  { id: 'normal', label: 'Aire normal' },
  { id: 'mucho', label: 'Mucho aire' },
];

const bloqueNuevo = (tipo: BloqueEditor['tipo']): BloqueEditor => {
  if (tipo === 'boton') {
    return { tipo: 'boton', texto: '', link: '', color: '#BC2915', separacion: 'normal' };
  }
  if (tipo === 'texto') return { tipo: 'texto', contenido: '' };
  return { tipo: 'canvas', url: '', alt: '', hotspots: [] };
};

const FONDO_DEFAULT = '#FFFCDC';

// Paleta manso como accesos rápidos; el picker permite cualquier color
const FONDOS_SUGERIDOS = [
  { hex: '#FFFCDC', nombre: 'Crema' },
  { hex: '#1D1D1B', nombre: 'Negro' },
  { hex: '#030044', nombre: 'Azul' },
  { hex: '#BC2915', nombre: 'Terra' },
  { hex: '#868229', nombre: 'Oliva' },
  { hex: '#542C1B', nombre: 'Marrón' },
];

interface Props {
  onSaved?: () => void;
}

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------------------
// Editor visual: la imagen de la diseñadora + zonas clickeables que se dibujan
// arrastrando el mouse encima (como marcar un recorte). Cada zona lleva su link.
// ---------------------------------------------------------------------------

type DragState = {
  mode: 'create' | 'move' | 'resize';
  index: number;
  startX: number;
  startY: number;
  orig: Hotspot;
};

function CanvasHotspots({
  url,
  hotspots,
  onChange,
}: {
  url: string;
  hotspots: Hotspot[];
  onChange: (hotspots: Hotspot[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const toPct = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - r.left) / r.width) * 100),
      y: clamp(((e.clientY - r.top) / r.height) * 100),
    };
  };

  const capture = (e: React.PointerEvent) => {
    ref.current?.setPointerCapture(e.pointerId);
  };

  const empezarCrear = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const p = toPct(e);
    const nuevo: Hotspot = { x: p.x, y: p.y, w: 0, h: 0, link: '' };
    onChange([...hotspots, nuevo]);
    setDrag({ mode: 'create', index: hotspots.length, startX: p.x, startY: p.y, orig: nuevo });
    capture(e);
  };

  const empezarMover = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = toPct(e);
    setDrag({ mode: 'move', index: i, startX: p.x, startY: p.y, orig: hotspots[i] });
    capture(e);
  };

  const empezarResize = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = toPct(e);
    setDrag({ mode: 'resize', index: i, startX: p.x, startY: p.y, orig: hotspots[i] });
    capture(e);
  };

  const mover = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toPct(e);
    const { mode, index, startX, startY, orig } = drag;

    const next = [...hotspots];
    if (mode === 'create') {
      next[index] = {
        ...orig,
        x: Math.min(startX, p.x),
        y: Math.min(startY, p.y),
        w: Math.abs(p.x - startX),
        h: Math.abs(p.y - startY),
      };
    } else if (mode === 'move') {
      next[index] = {
        ...orig,
        x: clamp(orig.x + (p.x - startX), 0, 100 - orig.w),
        y: clamp(orig.y + (p.y - startY), 0, 100 - orig.h),
      };
    } else {
      next[index] = {
        ...orig,
        w: clamp(orig.w + (p.x - startX), 2, 100 - orig.x),
        h: clamp(orig.h + (p.y - startY), 2, 100 - orig.y),
      };
    }
    onChange(next);
  };

  const soltar = () => {
    if (!drag) return;
    if (drag.mode === 'create') {
      const hs = hotspots[drag.index];
      // Un click sin arrastre no crea zona (evita zonas accidentales)
      if (hs && (hs.w < 2 || hs.h < 2)) {
        onChange(hotspots.filter((_, i) => i !== drag.index));
      }
    }
    setDrag(null);
  };

  const eliminarZona = (i: number) => onChange(hotspots.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        ref={ref}
        onPointerDown={empezarCrear}
        onPointerMove={mover}
        onPointerUp={soltar}
        className="relative select-none touch-none cursor-crosshair rounded-xl overflow-hidden border border-manso-cream/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="block w-full pointer-events-none" draggable={false} />

        {hotspots.map((hs, i) => (
          <div
            key={i}
            onPointerDown={(e) => empezarMover(e, i)}
            className="absolute border-2 border-manso-terra bg-manso-terra/20 cursor-move group"
            style={{ left: `${hs.x}%`, top: `${hs.y}%`, width: `${hs.w}%`, height: `${hs.h}%` }}
          >
            <span className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-manso-terra text-manso-cream text-[10px] font-black flex items-center justify-center">
              {i + 1}
            </span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => eliminarZona(i)}
              className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-manso-black border border-manso-cream/30 text-manso-cream/70 hover:text-red-400 flex items-center justify-center"
              title="Eliminar zona"
            >
              <X size={10} />
            </button>
            <div
              onPointerDown={(e) => empezarResize(e, i)}
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-sm bg-manso-terra cursor-nwse-resize"
              title="Redimensionar"
            />
          </div>
        ))}
      </div>

      <p className="text-[9px] text-manso-cream/40 mt-1.5">
        Dibujá un rectángulo sobre cada botón de la imagen arrastrando el mouse. Arrastralo para
        moverlo y usá la esquina para ajustar el tamaño.
      </p>

      {hotspots.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {hotspots.map((hs, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 h-5 shrink-0 rounded-full bg-manso-terra text-manso-cream text-[10px] font-black flex items-center justify-center">
                {i + 1}
              </span>
              <input
                value={hs.link}
                onChange={(e) => {
                  const next = [...hotspots];
                  next[i] = { ...hs, link: e.target.value };
                  onChange(next);
                }}
                placeholder="Link de la zona (https://...)"
                className="flex-1 bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulario de campaña: asunto + audiencia + imágenes con zonas + programación
// ---------------------------------------------------------------------------

export function FormMailingCampania({ onSaved }: Props) {
  const [asunto, setAsunto] = useState('');
  const [preheader, setPreheader] = useState('');
  const [audiencia, setAudiencia] = useState<Audiencia>('newsletter');
  const [mailsEspecificos, setMailsEspecificos] = useState('');
  const [bloques, setBloques] = useState<BloqueEditor[]>([]);
  const [colorFondo, setColorFondo] = useState(FONDO_DEFAULT);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const agregarBloque = (tipo: BloqueEditor['tipo']) =>
    setBloques([...bloques, bloqueNuevo(tipo)]);

  const actualizarBloque = (i: number, patch: Record<string, unknown>) => {
    setBloques(bloques.map((b, idx) => (idx === i ? ({ ...b, ...patch } as BloqueEditor) : b)));
  };

  const eliminarBloque = (i: number) => setBloques(bloques.filter((_, idx) => idx !== i));

  const moverBloque = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= bloques.length) return;
    const copia = [...bloques];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setBloques(copia);
  };

  const resetForm = () => {
    setAsunto('');
    setPreheader('');
    setAudiencia('newsletter');
    setMailsEspecificos('');
    setBloques([]);
    setColorFondo(FONDO_DEFAULT);
    setScheduledAt('');
  };

  const parsearMailsEspecificos = (): string[] =>
    mailsEspecificos
      .split(/[,\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

  const validar = (): string | null => {
    if (!asunto.trim()) return 'El asunto es obligatorio';
    if (!preheader.trim()) return 'El pre-header es obligatorio: es el texto que la casilla muestra al lado del asunto';
    if (preheader.trim().toLowerCase() === asunto.trim().toLowerCase()) {
      return 'El pre-header no puede repetir el asunto — escribí un texto que lo complemente';
    }
    if (bloques.length === 0) return 'Agregá al menos un bloque';
    for (const [i, b] of bloques.entries()) {
      const n = i + 1;
      if (b.tipo === 'canvas') {
        if (!b.url) return `El bloque ${n} es una imagen sin subir`;
        for (const hs of b.hotspots) {
          if (!/^https?:\/\/.+/.test(hs.link.trim())) {
            return `Hay una zona sin link válido en el bloque ${n} (tiene que empezar con https://)`;
          }
        }
      }
      if (b.tipo === 'boton') {
        if (!b.texto.trim()) return `El botón del bloque ${n} no tiene texto`;
        if (!/^https?:\/\/.+/.test(b.link.trim())) {
          return `El botón del bloque ${n} necesita un link válido (https://...)`;
        }
      }
      if (b.tipo === 'texto' && !b.contenido.trim()) {
        return `El texto del bloque ${n} está vacío`;
      }
    }
    if (audiencia === 'especifico') {
      const emails = parsearMailsEspecificos();
      if (emails.length === 0) return 'Ingresá al menos un email';
      const invalido = emails.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      if (invalido) return `"${invalido}" no es un email válido`;
    }
    return null;
  };

  const guardar = async (programar: boolean) => {
    const error = validar();
    if (error) {
      setErrorMsg(error);
      return;
    }

    let scheduledIso: string | null = null;
    if (programar) {
      if (!scheduledAt) {
        setErrorMsg('Elegí fecha y hora para programar la campaña');
        return;
      }
      const fecha = new Date(scheduledAt);
      if (fecha.getTime() < Date.now()) {
        setErrorMsg('La fecha de programación ya pasó');
        return;
      }
      scheduledIso = fecha.toISOString();
    }

    // Los tipos coinciden con los que renderiza emails/campania-generica.tsx
    const bloquesDb = bloques.map((b) => {
      if (b.tipo === 'boton') {
        return {
          tipo: 'boton',
          texto: b.texto.trim(),
          link: b.link.trim(),
          color: b.color,
          separacion: b.separacion,
        };
      }
      if (b.tipo === 'texto') return { tipo: 'texto', contenido: b.contenido.trim() };
      return {
        tipo: 'canvas',
        url: b.url,
        alt: b.alt,
        hotspots: b.hotspots.map((hs) => ({ ...hs, link: hs.link.trim() })),
      };
    });

    setLoading(true);
    setErrorMsg(null);
    const { error: insertError } = await supabase.from('mailing_campanias').insert([
      {
        asunto,
        preheader: preheader.trim(),
        audiencia,
        bloques: bloquesDb,
        estado: programar ? 'programada' : 'borrador',
        color_fondo: colorFondo,
        scheduled_at: scheduledIso,
        destinatarios_especificos: audiencia === 'especifico' ? parsearMailsEspecificos() : null,
      },
    ]);
    setLoading(false);

    if (insertError) {
      setErrorMsg(insertError.message);
      return;
    }

    setSuccessMsg(
      programar
        ? `¡Campaña programada para el ${new Date(scheduledIso!).toLocaleString('es-AR')}!`
        : '¡Borrador guardado! Podés enviarlo desde la lista de campañas.'
    );
    setTimeout(() => setSuccessMsg(null), 4000);
    resetForm();
    onSaved?.();
  };

  return (
    <div className="bg-manso-cream/5 p-4 md:p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl space-y-5">
      <div>
        <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-manso-cream mb-1">
          Nueva Campaña
        </h2>
        <p className="text-xs text-manso-cream/60">
          Armá el mail apilando bloques: imágenes, botones y textos.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-400 text-xs">
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mb-1 block">
          Asunto
        </label>
        <input
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Ej: Nuevo evento este viernes"
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-2.5 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
        />
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mb-1 block">
          Pre-header
        </label>
        <p className="text-[9px] text-manso-cream/40 mb-1.5">
          Es el texto gris que la casilla muestra al lado del asunto. No repitas el asunto:
          usalo para completar la idea y dar una razón más para abrir el mail.
        </p>
        <input
          value={preheader}
          onChange={(e) => setPreheader(e.target.value)}
          maxLength={140}
          placeholder="Ej: Entradas anticipadas hasta el jueves"
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-2.5 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
        />
        {/* Así se va a ver en la bandeja de entrada */}
        <div className="mt-2 rounded-lg bg-manso-cream/10 border border-manso-cream/10 px-3 py-2 text-xs truncate">
          <span className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30 block mb-0.5">
            Así se ve en la casilla
          </span>
          <span className="font-bold text-manso-cream">{asunto.trim() || 'Asunto'}</span>
          <span className="text-manso-cream/50">
            {' '}
            - {preheader.trim() || 'Pre-header (texto de vista previa)'}
          </span>
        </div>
        {preheader.trim() &&
          preheader.trim().toLowerCase() === asunto.trim().toLowerCase() && (
            <p className="flex items-center gap-1 text-[10px] text-red-400 mt-1.5">
              <AlertCircle size={11} /> El pre-header está repitiendo el asunto
            </p>
          )}
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mb-1 block">
          Audiencia
        </label>
        <select
          value={audiencia}
          onChange={(e) => setAudiencia(e.target.value as Audiencia)}
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-2.5 text-sm text-manso-cream focus:outline-none focus:border-manso-terra"
        >
          {AUDIENCIAS.map((a) => (
            <option key={a.id} value={a.id} className="bg-manso-black">
              {a.label}
            </option>
          ))}
        </select>

        {audiencia === 'especifico' && (
          <textarea
            value={mailsEspecificos}
            onChange={(e) => setMailsEspecificos(e.target.value)}
            placeholder="Un email por línea o separados por coma: fulano@mail.com, mengano@mail.com"
            rows={3}
            className="w-full mt-2 bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-2.5 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra resize-none"
          />
        )}
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 block">
          Contenido del mail
        </label>
        <p className="text-[9px] text-manso-cream/40 -mt-2">
          Apilá bloques en el orden en que van a aparecer. Para los botones principales usá
          el bloque <strong className="text-manso-cream/70">Botón</strong> en vez de dibujarlos
          dentro de la imagen: se ven aunque Gmail bloquee las imágenes y nunca se cortan.
        </p>

        {bloques.map((bloque, i) => (
          <div key={i} className="bg-manso-cream/5 border border-manso-cream/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 flex items-center gap-1.5">
                {bloque.tipo === 'canvas' && <><ImageIcon size={12} /> Imagen</>}
                {bloque.tipo === 'boton' && <><MousePointerClick size={12} /> Botón</>}
                {bloque.tipo === 'texto' && <><TypeIcon size={12} /> Texto</>}
                <span className="text-manso-cream/25">bloque {i + 1}</span>
                {bloque.tipo === 'canvas' && bloque.hotspots.length > 0 && (
                  <span className="flex items-center gap-1 text-manso-terra">
                    <MousePointerClick size={12} /> {bloque.hotspots.length}{' '}
                    {bloque.hotspots.length === 1 ? 'zona' : 'zonas'}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moverBloque(i, -1)} disabled={i === 0} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => moverBloque(i, 1)} disabled={i === bloques.length - 1} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20">
                  <ArrowDown size={12} />
                </button>
                <button onClick={() => eliminarBloque(i)} className="p-1 text-manso-cream/40 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {bloque.tipo === 'canvas' && (
              <>
                {!bloque.url ? (
                  <CompactImageUploader bucket="emails" onUpload={(url) => actualizarBloque(i, { url })} height="h-24" />
                ) : (
                  <CanvasHotspots
                    url={bloque.url}
                    hotspots={bloque.hotspots}
                    onChange={(hotspots) => actualizarBloque(i, { hotspots })}
                  />
                )}
                <input
                  value={bloque.alt}
                  onChange={(e) => actualizarBloque(i, { alt: e.target.value })}
                  placeholder="Texto alternativo (accesibilidad)"
                  className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
                />
              </>
            )}

            {bloque.tipo === 'boton' && (
              <div className="space-y-2">
                <input
                  value={bloque.texto}
                  onChange={(e) => actualizarBloque(i, { texto: e.target.value })}
                  placeholder="Texto del botón. Ej: SUMATE :)"
                  className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-2 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
                />
                <input
                  value={bloque.link}
                  onChange={(e) => actualizarBloque(i, { link: e.target.value })}
                  placeholder="https://mansoclub.com.ar/membresias"
                  className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-2 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bloque.color}
                    onChange={(e) => actualizarBloque(i, { color: e.target.value })}
                    className="h-9 w-14 bg-transparent border border-manso-cream/10 rounded-lg cursor-pointer"
                    title="Color del botón"
                  />
                  <select
                    value={bloque.separacion}
                    onChange={(e) => actualizarBloque(i, { separacion: e.target.value as Separacion })}
                    className="flex-1 bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-2 text-xs text-manso-cream focus:outline-none focus:border-manso-terra"
                  >
                    {SEPARACIONES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-manso-black">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Vista previa aproximada de cómo lo va a dibujar el mail */}
                <div className="rounded-lg p-3 flex justify-center" style={{ backgroundColor: colorFondo }}>
                  <span
                    className="inline-block rounded-md px-8 py-3 text-sm"
                    style={{ background: bloque.color, color: '#FFFCDC' }}
                  >
                    {bloque.texto.trim() || 'Texto del botón'}
                  </span>
                </div>
              </div>
            )}

            {bloque.tipo === 'texto' && (
              <textarea
                value={bloque.contenido}
                onChange={(e) => actualizarBloque(i, { contenido: e.target.value })}
                rows={4}
                placeholder="Escribí el texto del mail. Se ve aunque las imágenes estén bloqueadas."
                className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-2 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra resize-y"
              />
            )}
          </div>
        ))}

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => agregarBloque('canvas')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/70 text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <Plus size={12} /> Imagen
          </button>
          <button
            onClick={() => agregarBloque('boton')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-terra/20 hover:bg-manso-terra/30 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <Plus size={12} /> Botón
          </button>
          <button
            onClick={() => agregarBloque('texto')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/70 text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <Plus size={12} /> Texto
          </button>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mb-1 block">
          Color de fondo del mail
        </label>
        <p className="text-[9px] text-manso-cream/40 mb-2">
          El marco alrededor del arte. Elegí el mismo color que el fondo de la imagen para que se
          vea continuo.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {FONDOS_SUGERIDOS.map((f) => (
            <button
              key={f.hex}
              type="button"
              onClick={() => setColorFondo(f.hex)}
              title={f.nombre}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                colorFondo.toLowerCase() === f.hex.toLowerCase()
                  ? 'border-manso-terra scale-110'
                  : 'border-manso-cream/20'
              }`}
              style={{ backgroundColor: f.hex }}
            />
          ))}
          <label
            className="flex items-center gap-2 ml-1 px-3 py-1.5 rounded-lg bg-manso-cream/5 border border-manso-cream/10 cursor-pointer hover:border-manso-terra transition-colors"
            title="Color personalizado"
          >
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(colorFondo) ? colorFondo : FONDO_DEFAULT}
              onChange={(e) => setColorFondo(e.target.value)}
              className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-manso-cream/60 uppercase">{colorFondo}</span>
          </label>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mb-1 flex items-center gap-1.5">
          <CalendarClock size={11} /> Programar envío (opcional)
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-2.5 text-sm text-manso-cream focus:outline-none focus:border-manso-terra [color-scheme:dark]"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => guardar(false)}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-manso-cream/10 text-manso-cream text-xs font-black uppercase tracking-widest hover:bg-manso-cream/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button
          onClick={() => guardar(true)}
          disabled={loading || !scheduledAt}
          className="flex-1 py-3 rounded-xl bg-manso-terra text-manso-cream text-xs font-black uppercase tracking-widest hover:bg-manso-terra/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Programar campaña'}
        </button>
      </div>
    </div>
  );
}
