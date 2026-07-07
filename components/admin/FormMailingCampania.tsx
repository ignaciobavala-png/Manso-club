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
} from 'lucide-react';

type CanvasBloque = { url: string; alt: string; hotspots: Hotspot[] };

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
  const [audiencia, setAudiencia] = useState<Audiencia>('newsletter');
  const [canvases, setCanvases] = useState<CanvasBloque[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const agregarImagen = () => setCanvases([...canvases, { url: '', alt: '', hotspots: [] }]);

  const actualizarCanvas = (i: number, patch: Partial<CanvasBloque>) => {
    setCanvases(canvases.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const eliminarCanvas = (i: number) => setCanvases(canvases.filter((_, idx) => idx !== i));

  const moverCanvas = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= canvases.length) return;
    const copia = [...canvases];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setCanvases(copia);
  };

  const resetForm = () => {
    setAsunto('');
    setAudiencia('newsletter');
    setCanvases([]);
    setScheduledAt('');
  };

  const validar = (): string | null => {
    if (!asunto.trim()) return 'El asunto es obligatorio';
    if (canvases.length === 0) return 'Agregá al menos una imagen';
    if (canvases.some((c) => !c.url)) return 'Hay una imagen sin subir';
    for (const c of canvases) {
      for (const hs of c.hotspots) {
        if (!/^https?:\/\/.+/.test(hs.link.trim())) {
          return 'Todas las zonas marcadas necesitan un link válido (https://...)';
        }
      }
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

    const bloques = canvases.map((c) => ({
      tipo: 'canvas',
      url: c.url,
      alt: c.alt,
      hotspots: c.hotspots.map((hs) => ({ ...hs, link: hs.link.trim() })),
    }));

    setLoading(true);
    setErrorMsg(null);
    const { error: insertError } = await supabase.from('mailing_campanias').insert([
      {
        asunto,
        audiencia,
        bloques,
        estado: programar ? 'programada' : 'borrador',
        scheduled_at: scheduledIso,
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
          Subí el arte del mail y marcá dónde se clickea — el botón va dibujado en la imagen.
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
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 block">
          Imágenes del mail
        </label>

        {canvases.map((canvas, i) => (
          <div key={i} className="bg-manso-cream/5 border border-manso-cream/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 flex items-center gap-1.5">
                <ImageIcon size={12} /> Imagen {i + 1}
                {canvas.hotspots.length > 0 && (
                  <span className="flex items-center gap-1 text-manso-terra">
                    <MousePointerClick size={12} /> {canvas.hotspots.length}{' '}
                    {canvas.hotspots.length === 1 ? 'zona' : 'zonas'}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moverCanvas(i, -1)} disabled={i === 0} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => moverCanvas(i, 1)} disabled={i === canvases.length - 1} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20">
                  <ArrowDown size={12} />
                </button>
                <button onClick={() => eliminarCanvas(i)} className="p-1 text-manso-cream/40 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {!canvas.url ? (
              <CompactImageUploader bucket="emails" onUpload={(url) => actualizarCanvas(i, { url })} height="h-24" />
            ) : (
              <CanvasHotspots
                url={canvas.url}
                hotspots={canvas.hotspots}
                onChange={(hotspots) => actualizarCanvas(i, { hotspots })}
              />
            )}

            <input
              value={canvas.alt}
              onChange={(e) => actualizarCanvas(i, { alt: e.target.value })}
              placeholder="Texto alternativo (accesibilidad)"
              className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
            />
          </div>
        ))}

        <button
          onClick={agregarImagen}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/70 text-[9px] font-black uppercase tracking-widest transition-colors"
        >
          <Plus size={12} /> Agregar imagen
        </button>
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
