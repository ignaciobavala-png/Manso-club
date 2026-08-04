'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Eye,
  Monitor,
  Smartphone,
  Share2,
  GripVertical,
  Copy,
  ChevronDown,
  ChevronRight,
  Save,
  FolderOpen,
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
type ItemRed = { etiqueta: string; link: string; icono: string };

/**
 * `id` es interno del editor y nunca se guarda: sirve como key de React. Con
 * `key={i}` el estado de un bloque (imagen cargada, zonas dibujadas) se quedaba
 * pegado al índice, así que al reordenar o duplicar el contenido saltaba de
 * tarjeta. Se elimina en construirBloques().
 */
type BloqueEditor = { id: string } & (
  | { tipo: 'canvas'; url: string; alt: string; hotspots: Hotspot[] }
  | {
      tipo: 'boton';
      texto: string;
      link: string;
      color: string;
      colorTexto: string;
      separacion: Separacion;
    }
  | { tipo: 'texto'; contenido: string }
  | { tipo: 'redes'; items: ItemRed[]; modo: 'iconos' | 'texto'; separacion: Separacion }
);

const nuevoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `b${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

/** Color del texto de un botón nuevo, y fallback de los guardados sin el campo. */
const TEXTO_BOTON_DEFAULT = '#FFFCDC';

const SEPARACIONES: { id: Separacion; label: string }[] = [
  { id: 'pegado', label: 'Pegado al bloque anterior' },
  { id: 'poco', label: 'Poco aire' },
  { id: 'normal', label: 'Aire normal' },
  { id: 'mucho', label: 'Mucho aire' },
];

const bloqueNuevo = (tipo: BloqueEditor['tipo']): BloqueEditor => {
  const id = nuevoId();
  if (tipo === 'boton') {
    return {
      id,
      tipo: 'boton',
      texto: '',
      link: '',
      color: '#BC2915',
      colorTexto: TEXTO_BOTON_DEFAULT,
      separacion: 'normal',
    };
  }
  if (tipo === 'texto') return { id, tipo: 'texto', contenido: '' };
  if (tipo === 'redes') {
    return {
      id,
      tipo: 'redes',
      items: [{ etiqueta: '', link: '', icono: '' }],
      modo: 'iconos',
      separacion: 'normal',
    };
  }
  return { id, tipo: 'canvas', url: '', alt: '', hotspots: [] };
};

/** Línea que resume el bloque cuando está colapsado. */
const resumenBloque = (b: BloqueEditor): string => {
  if (b.tipo === 'canvas') {
    if (!b.url) return 'sin imagen';
    const zonas = b.hotspots.length;
    return zonas ? `${zonas} ${zonas === 1 ? 'zona' : 'zonas'}` : 'sin zonas';
  }
  if (b.tipo === 'boton') return b.texto.trim() || 'sin texto';
  if (b.tipo === 'texto') {
    const t = b.contenido.trim().replace(/\s+/g, ' ');
    return t ? (t.length > 60 ? `${t.slice(0, 60)}…` : t) : 'vacío';
  }
  const n = b.items.filter((it) => it.link.trim()).length;
  return n ? `${n} ${n === 1 ? 'link' : 'links'}` : 'sin links';
};

/**
 * Acepta http(s), mailto: y tel:. Los dos últimos importan en el pie: en el
 * celular, tocar un `tel:` abre el teléfono y un `mailto:` el cliente de correo.
 */
const LINK_VALIDO = /^(https?:\/\/.+|mailto:[^\s@]+@[^\s@]+\.[^\s@]+|tel:\+?[\d\s()-]{6,})$/i;

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

/**
 * Plantillas: un set de bloques + color de fondo con nombre, para no rearmar
 * desde cero las campañas que siempre tienen la misma estructura (arte + botón
 * + pie de redes). Viven en localStorage y no en la base porque son un atajo
 * del editor, no contenido publicado: no hay nada que compartir entre usuarios
 * ni que versionar, y así no hace falta migración ni política de RLS.
 */
const PLANTILLAS_KEY = 'manso:mailing:plantillas';

type Plantilla = { nombre: string; colorFondo: string; bloques: BloqueEditor[] };

const leerPlantillas = (): Plantilla[] => {
  try {
    const raw = localStorage.getItem(PLANTILLAS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? (data as Plantilla[]) : [];
  } catch {
    return [];
  }
};

const escribirPlantillas = (plantillas: Plantilla[]) => {
  try {
    localStorage.setItem(PLANTILLAS_KEY, JSON.stringify(plantillas));
  } catch {
    /* modo incógnito o storage lleno: la plantilla no se guarda, nada más */
  }
};

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
  const [previewAbierto, setPreviewAbierto] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewMobile, setPreviewMobile] = useState(false);
  const [colapsados, setColapsados] = useState<Set<string>>(new Set());
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);
  // Los problemas se muestran recién después del primer intento: con el
  // formulario vacío, listar todo lo que falta es ruido, no ayuda.
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);

  useEffect(() => setPlantillas(leerPlantillas()), []);

  const agregarBloque = (tipo: BloqueEditor['tipo']) =>
    setBloques([...bloques, bloqueNuevo(tipo)]);

  const duplicarBloque = (i: number) => {
    const copia = structuredClone(bloques[i]);
    copia.id = nuevoId();
    setBloques([...bloques.slice(0, i + 1), copia, ...bloques.slice(i + 1)]);
  };

  const alternarColapso = (id: string) =>
    setColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const todosColapsados = bloques.length > 0 && bloques.every((b) => colapsados.has(b.id));

  const alternarTodos = () =>
    setColapsados(todosColapsados ? new Set() : new Set(bloques.map((b) => b.id)));

  /** Reordenar arrastrando: mueve el bloque `origen` a la posición `destino`. */
  const reordenar = (origen: number, destino: number) => {
    if (origen === destino) return;
    const copia = [...bloques];
    const [movido] = copia.splice(origen, 1);
    copia.splice(destino, 0, movido);
    setBloques(copia);
  };

  const actualizarBloque = (i: number, patch: Record<string, unknown>) => {
    setBloques(bloques.map((b, idx) => (idx === i ? ({ ...b, ...patch } as BloqueEditor) : b)));
  };

  const eliminarBloque = (i: number) => setBloques(bloques.filter((_, idx) => idx !== i));

  /** Edita un ítem dentro de un bloque de redes (índice de bloque + de ítem). */
  const actualizarItemRed = (i: number, k: number, patch: Partial<ItemRed>) => {
    setBloques(
      bloques.map((b, idx) =>
        idx === i && b.tipo === 'redes'
          ? { ...b, items: b.items.map((it, j) => (j === k ? { ...it, ...patch } : it)) }
          : b
      )
    );
  };

  const agregarItemRed = (i: number) => {
    setBloques(
      bloques.map((b, idx) =>
        idx === i && b.tipo === 'redes'
          ? { ...b, items: [...b.items, { etiqueta: '', link: '', icono: '' }] }
          : b
      )
    );
  };

  const eliminarItemRed = (i: number, k: number) => {
    setBloques(
      bloques.map((b, idx) =>
        idx === i && b.tipo === 'redes'
          ? { ...b, items: b.items.filter((_, j) => j !== k) }
          : b
      )
    );
  };

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
    setColapsados(new Set());
    setIntentoEnvio(false);
    setNombrePlantilla('');
    setGuardandoPlantilla(false);
  };

  const guardarPlantilla = () => {
    const nombre = nombrePlantilla.trim();
    if (!nombre) return;
    const nueva: Plantilla = { nombre, colorFondo, bloques };
    // Mismo nombre: se pisa, para poder iterar una plantilla sin acumular copias
    const next = [...plantillas.filter((p) => p.nombre !== nombre), nueva];
    setPlantillas(next);
    escribirPlantillas(next);
    setNombrePlantilla('');
    setGuardandoPlantilla(false);
    setSuccessMsg(`Plantilla "${nombre}" guardada`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const cargarPlantilla = (nombre: string) => {
    const p = plantillas.find((x) => x.nombre === nombre);
    if (!p) return;
    // Ids nuevos: los de la plantilla podrían chocar con los bloques en pantalla
    setBloques(p.bloques.map((b) => ({ ...structuredClone(b), id: nuevoId() })));
    setColorFondo(p.colorFondo || FONDO_DEFAULT);
    setColapsados(new Set());
    setIntentoEnvio(false);
  };

  const borrarPlantilla = (nombre: string) => {
    const next = plantillas.filter((p) => p.nombre !== nombre);
    setPlantillas(next);
    escribirPlantillas(next);
  };

  /**
   * Pasa los bloques del editor al formato que renderiza
   * emails/campania-generica.tsx. Lo usan el guardado y la vista previa, para
   * que lo que se ve en la previa sea exactamente lo que se va a mandar.
   */
  const construirBloques = () =>
    bloques.map((b) => {
      if (b.tipo === 'boton') {
        return {
          tipo: 'boton',
          texto: b.texto.trim(),
          link: b.link.trim(),
          color: b.color,
          // Las plantillas guardadas antes de este campo no lo traen
          colorTexto: b.colorTexto || TEXTO_BOTON_DEFAULT,
          separacion: b.separacion,
        };
      }
      if (b.tipo === 'texto') return { tipo: 'texto', contenido: b.contenido.trim() };
      if (b.tipo === 'redes') {
        return {
          tipo: 'redes',
          modo: b.modo,
          separacion: b.separacion,
          items: b.items
            .filter((it) => it.link.trim())
            .map((it) => ({
              etiqueta: it.etiqueta.trim(),
              link: it.link.trim(),
              icono: it.icono || undefined,
            })),
        };
      }
      return {
        tipo: 'canvas',
        url: b.url,
        alt: b.alt,
        hotspots: b.hotspots.map((hs) => ({ ...hs, link: hs.link.trim() })),
      };
    });

  const abrirPreview = async () => {
    setPreviewAbierto(true);
    setPreviewHtml(null);
    setPreviewError(null);
    try {
      const res = await fetch('/api/mailing/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asunto,
          preheader,
          colorFondo,
          // Sin imagen subida el <img> queda roto y ensucia la previa
          bloques: construirBloques().filter((b) => b.tipo !== 'canvas' || b.url),
        }),
      });
      const texto = await res.text();
      let data: { html?: string; error?: string };
      try {
        data = JSON.parse(texto);
      } catch {
        throw new Error(`El servidor respondió ${res.status}: ${texto.slice(0, 150)}`);
      }
      if (!res.ok) throw new Error(data.error || 'No se pudo generar la vista previa');
      setPreviewHtml(data.html ?? '');
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Error inesperado');
    }
  };

  const parsearMailsEspecificos = (): string[] =>
    mailsEspecificos
      .split(/[,\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

  /**
   * Todos los problemas de la campaña, no solo el primero. Antes la validación
   * cortaba en el primer error: con un mail de ocho bloques eso obligaba a
   * guardar, leer el cartel, corregir y repetir una vez por cada cosa que
   * faltaba. `bloqueId` permite marcar la tarjeta que tiene el problema.
   */
  const problemas = useMemo((): { bloqueId?: string; mensaje: string }[] => {
    const out: { bloqueId?: string; mensaje: string }[] = [];

    if (!asunto.trim()) out.push({ mensaje: 'El asunto es obligatorio' });
    if (!preheader.trim()) {
      out.push({
        mensaje: 'El pre-header es obligatorio: es el texto que la casilla muestra al lado del asunto',
      });
    } else if (preheader.trim().toLowerCase() === asunto.trim().toLowerCase()) {
      out.push({ mensaje: 'El pre-header no puede repetir el asunto — escribí un texto que lo complemente' });
    }
    if (bloques.length === 0) out.push({ mensaje: 'Agregá al menos un bloque' });

    for (const [i, b] of bloques.entries()) {
      const n = i + 1;
      const push = (mensaje: string) => out.push({ bloqueId: b.id, mensaje });

      if (b.tipo === 'canvas') {
        if (!b.url) push(`El bloque ${n} es una imagen sin subir`);
        for (const [k, hs] of b.hotspots.entries()) {
          if (!LINK_VALIDO.test(hs.link.trim())) {
            push(`La zona ${k + 1} del bloque ${n} no tiene un link válido (https://..., mailto: o tel:)`);
          }
        }
      }
      if (b.tipo === 'boton') {
        if (!b.texto.trim()) push(`El botón del bloque ${n} no tiene texto`);
        if (!LINK_VALIDO.test(b.link.trim())) {
          push(`El botón del bloque ${n} necesita un link válido (https://..., mailto: o tel:)`);
        }
      }
      if (b.tipo === 'texto' && !b.contenido.trim()) {
        push(`El texto del bloque ${n} está vacío`);
      }
      if (b.tipo === 'redes') {
        const conLink = b.items.filter((it) => it.link.trim());
        if (conLink.length === 0) push(`El bloque ${n} (redes) no tiene ningún link cargado`);
        for (const it of conLink) {
          if (!LINK_VALIDO.test(it.link.trim())) {
            push(`"${it.link.trim()}" del bloque ${n} no es válido (https://..., mailto: o tel:)`);
          }
          if (!it.etiqueta.trim()) {
            push(`Falta el nombre de un ítem del bloque ${n} — se usa como texto alternativo`);
          }
          if (b.modo === 'iconos' && !it.icono) {
            push(`Falta subir el ícono de "${it.etiqueta.trim()}" en el bloque ${n}`);
          }
        }
      }
    }

    if (audiencia === 'especifico') {
      const emails = parsearMailsEspecificos();
      if (emails.length === 0) out.push({ mensaje: 'Ingresá al menos un email' });
      for (const e of emails) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) out.push({ mensaje: `"${e}" no es un email válido` });
      }
    }

    return out;
    // parsearMailsEspecificos solo depende de mailsEspecificos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asunto, preheader, bloques, audiencia, mailsEspecificos]);

  /** Cantidad de problemas por bloque, para el badge de cada tarjeta. */
  const problemasPorBloque = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of problemas) {
      if (p.bloqueId) m.set(p.bloqueId, (m.get(p.bloqueId) ?? 0) + 1);
    }
    return m;
  }, [problemas]);

  const guardar = async (programar: boolean) => {
    if (problemas.length > 0) {
      setIntentoEnvio(true);
      // Un bloque colapsado con problemas se abre solo: si no, el cartel manda
      // a revisar el bloque 5 y en pantalla el bloque 5 es un renglón cerrado.
      setColapsados((prev) => new Set([...prev].filter((id) => !problemasPorBloque.has(id))));
      setErrorMsg(
        problemas.length === 1
          ? problemas[0].mensaje
          : `Hay ${problemas.length} cosas para corregir antes de guardar`
      );
      return;
    }
    setIntentoEnvio(false);

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

    const bloquesDb = construirBloques();

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

        {/* Barra de herramientas del armado: plantillas + colapsar todo */}
        <div className="flex flex-wrap items-center gap-2">
          {plantillas.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                value=""
                onChange={(e) => e.target.value && cargarPlantilla(e.target.value)}
                className="bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-2.5 py-1.5 text-[10px] text-manso-cream focus:outline-none focus:border-manso-terra"
                title="Cargar plantilla (reemplaza los bloques actuales)"
              >
                <option value="" className="bg-manso-black">
                  Cargar plantilla…
                </option>
                {plantillas.map((p) => (
                  <option key={p.nombre} value={p.nombre} className="bg-manso-black">
                    {p.nombre} ({p.bloques.length} bloques)
                  </option>
                ))}
              </select>
              <select
                value=""
                onChange={(e) => e.target.value && borrarPlantilla(e.target.value)}
                className="bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-2.5 py-1.5 text-[10px] text-manso-cream/50 focus:outline-none"
                title="Borrar una plantilla guardada"
              >
                <option value="" className="bg-manso-black">
                  Borrar…
                </option>
                {plantillas.map((p) => (
                  <option key={p.nombre} value={p.nombre} className="bg-manso-black">
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {guardandoPlantilla ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={nombrePlantilla}
                onChange={(e) => setNombrePlantilla(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarPlantilla();
                  if (e.key === 'Escape') setGuardandoPlantilla(false);
                }}
                placeholder="Nombre de la plantilla"
                className="bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-2.5 py-1.5 text-[10px] text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
              />
              <button
                onClick={guardarPlantilla}
                disabled={!nombrePlantilla.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-manso-terra/80 text-manso-cream text-[9px] font-black uppercase tracking-widest disabled:opacity-30"
              >
                Guardar
              </button>
              <button
                onClick={() => setGuardandoPlantilla(false)}
                className="p-1.5 text-manso-cream/40 hover:text-manso-cream"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setGuardandoPlantilla(true)}
              disabled={bloques.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/60 text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-30"
              title="Guardar estos bloques como plantilla reutilizable"
            >
              <Save size={11} /> Guardar como plantilla
            </button>
          )}

          {bloques.length > 1 && (
            <button
              onClick={alternarTodos}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/60 text-[9px] font-black uppercase tracking-widest transition-colors ml-auto"
            >
              {todosColapsados ? <FolderOpen size={11} /> : <ChevronRight size={11} />}
              {todosColapsados ? 'Abrir todos' : 'Colapsar todos'}
            </button>
          )}
        </div>

        {bloques.length > 1 && (
          <p className="text-[9px] text-manso-cream/30">
            Arrastrá un bloque desde el encabezado para cambiarlo de lugar.
          </p>
        )}

        {bloques.map((bloque, i) => {
          const colapsado = colapsados.has(bloque.id);
          const errores = intentoEnvio ? problemasPorBloque.get(bloque.id) ?? 0 : 0;
          return (
          <div
            key={bloque.id}
            onDragOver={(e) => {
              if (arrastrando === null) return;
              e.preventDefault();
              setSobre(i);
            }}
            onDrop={(e) => {
              if (arrastrando === null) return;
              e.preventDefault();
              reordenar(arrastrando, i);
              setArrastrando(null);
              setSobre(null);
            }}
            className={`bg-manso-cream/5 border rounded-xl p-3 space-y-2 transition-colors ${
              errores ? 'border-red-500/40' : 'border-manso-cream/10'
            } ${arrastrando === i ? 'opacity-40' : ''} ${
              sobre === i && arrastrando !== null && arrastrando !== i ? 'border-manso-terra' : ''
            }`}
          >
            <div
              draggable
              onDragStart={() => setArrastrando(i)}
              onDragEnd={() => {
                setArrastrando(null);
                setSobre(null);
              }}
              className="flex items-center justify-between cursor-grab active:cursor-grabbing"
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 flex items-center gap-1.5 min-w-0">
                <GripVertical size={12} className="text-manso-cream/30 shrink-0" />
                <button
                  onClick={() => alternarColapso(bloque.id)}
                  className="text-manso-cream/40 hover:text-manso-cream shrink-0"
                  title={colapsado ? 'Abrir bloque' : 'Colapsar bloque'}
                >
                  {colapsado ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
                {bloque.tipo === 'canvas' && <><ImageIcon size={12} /> Imagen</>}
                {bloque.tipo === 'boton' && <><MousePointerClick size={12} /> Botón</>}
                {bloque.tipo === 'texto' && <><TypeIcon size={12} /> Texto</>}
                {bloque.tipo === 'redes' && <><Share2 size={12} /> Redes / Contacto</>}
                <span className="text-manso-cream/25 shrink-0">bloque {i + 1}</span>
                {bloque.tipo === 'canvas' && bloque.hotspots.length > 0 && !colapsado && (
                  <span className="flex items-center gap-1 text-manso-terra">
                    <MousePointerClick size={12} /> {bloque.hotspots.length}{' '}
                    {bloque.hotspots.length === 1 ? 'zona' : 'zonas'}
                  </span>
                )}
                {colapsado && (
                  <span className="text-manso-cream/35 normal-case tracking-normal font-normal truncate">
                    {resumenBloque(bloque)}
                  </span>
                )}
                {errores > 0 && (
                  <span className="flex items-center gap-1 text-red-400 shrink-0">
                    <AlertCircle size={11} /> {errores}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moverBloque(i, -1)} disabled={i === 0} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20" title="Subir">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => moverBloque(i, 1)} disabled={i === bloques.length - 1} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20" title="Bajar">
                  <ArrowDown size={12} />
                </button>
                <button onClick={() => duplicarBloque(i)} className="p-1 text-manso-cream/40 hover:text-manso-cream" title="Duplicar bloque">
                  <Copy size={12} />
                </button>
                <button onClick={() => eliminarBloque(i)} className="p-1 text-manso-cream/40 hover:text-red-400" title="Eliminar bloque">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {!colapsado && <>
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
                  <label
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-manso-cream/5 border border-manso-cream/10 cursor-pointer shrink-0"
                    title="Color de fondo del botón"
                  >
                    <input
                      type="color"
                      value={bloque.color}
                      onChange={(e) => actualizarBloque(i, { color: e.target.value })}
                      className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                      Fondo
                    </span>
                  </label>
                  <label
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-manso-cream/5 border border-manso-cream/10 cursor-pointer shrink-0"
                    title="Color del texto del botón"
                  >
                    <input
                      type="color"
                      value={bloque.colorTexto || TEXTO_BOTON_DEFAULT}
                      onChange={(e) => actualizarBloque(i, { colorTexto: e.target.value })}
                      className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                      Texto
                    </span>
                  </label>
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
                    style={{ background: bloque.color, color: bloque.colorTexto || TEXTO_BOTON_DEFAULT }}
                  >
                    {bloque.texto.trim() || 'Texto del botón'}
                  </span>
                </div>
              </div>
            )}

            {bloque.tipo === 'redes' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={bloque.modo}
                    onChange={(e) => actualizarBloque(i, { modo: e.target.value })}
                    className="flex-1 bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-2 text-xs text-manso-cream focus:outline-none focus:border-manso-terra"
                  >
                    <option value="iconos" className="bg-manso-black">Mostrar iconos</option>
                    <option value="texto" className="bg-manso-black">Mostrar nombres (se ven sin imágenes)</option>
                  </select>
                  <select
                    value={bloque.separacion}
                    onChange={(e) => actualizarBloque(i, { separacion: e.target.value })}
                    className="flex-1 bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-2 text-xs text-manso-cream focus:outline-none focus:border-manso-terra"
                  >
                    {SEPARACIONES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-manso-black">{s.label}</option>
                    ))}
                  </select>
                </div>

                {bloque.items.map((item, k) => (
                  <div key={k} className="flex items-start gap-2 bg-manso-cream/5 rounded-lg p-2">
                    {bloque.modo === 'iconos' && (
                      <div className="w-16 shrink-0">
                        {item.icono ? (
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.icono} alt="" className="w-14 h-14 object-contain rounded bg-manso-cream/10" />
                            <button
                              onClick={() => actualizarItemRed(i, k, { icono: '' })}
                              className="absolute -top-1 -right-1 bg-manso-black rounded-full p-0.5 text-manso-cream/60 hover:text-red-400"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <CompactImageUploader
                            bucket="emails"
                            onUpload={(url) => actualizarItemRed(i, k, { icono: url })}
                            height="h-14"
                          />
                        )}
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <input
                        value={item.etiqueta}
                        onChange={(e) => actualizarItemRed(i, k, { etiqueta: e.target.value })}
                        placeholder="Nombre. Ej: Instagram"
                        className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
                      />
                      <input
                        value={item.link}
                        onChange={(e) => actualizarItemRed(i, k, { link: e.target.value })}
                        placeholder="https://instagram.com/... · mailto:hola@... · tel:+5411..."
                        className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
                      />
                    </div>
                    <button
                      onClick={() => eliminarItemRed(i, k)}
                      disabled={bloque.items.length === 1}
                      className="p-1 text-manso-cream/40 hover:text-red-400 disabled:opacity-20 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => agregarItemRed(i)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/60 text-[9px] font-black uppercase tracking-widest transition-colors"
                >
                  <Plus size={11} /> Agregar link
                </button>

                <p className="text-[9px] text-manso-cream/40">
                  Se dibujan en fila, centrados. Cada uno es su propia imagen con su propio
                  link, así que no hace falta recortar nada. Los iconos van en PNG con fondo
                  transparente, de unos 120px.
                </p>
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
            </>}
          </div>
          );
        })}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
          <button
            onClick={() => agregarBloque('redes')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/70 text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <Plus size={12} /> Redes
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

      {/* Checklist de lo que falta. Aparece recién tras el primer intento de
          guardar y se va vaciando sola a medida que se corrige. */}
      {intentoEnvio && problemas.length > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 mb-1.5">
            <AlertCircle size={11} /> Falta corregir ({problemas.length})
          </p>
          <ul className="space-y-1">
            {problemas.map((p, i) => (
              <li key={i} className="text-[11px] text-red-300/90 leading-snug">
                · {p.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}
      {intentoEnvio && problemas.length === 0 && (
        <p className="flex items-center gap-1.5 text-[10px] text-green-400">
          <CheckCircle size={12} /> Todo listo para guardar
        </p>
      )}

      <button
        onClick={abrirPreview}
        disabled={bloques.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-manso-cream/10 text-manso-cream text-xs font-black uppercase tracking-widest hover:bg-manso-cream/20 transition-colors disabled:opacity-30"
      >
        <Eye size={14} /> Vista previa
      </button>

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

      {previewAbierto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewAbierto(false)}
        >
          <div
            className="bg-manso-black border border-manso-cream/15 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-manso-cream/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-manso-cream">
                Vista previa
              </span>
              <div className="flex items-center gap-2">
                <div className="flex rounded-full bg-manso-cream/10 p-0.5">
                  <button
                    onClick={() => setPreviewMobile(false)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${
                      !previewMobile ? 'bg-manso-cream text-manso-black' : 'text-manso-cream/60'
                    }`}
                  >
                    <Monitor size={11} /> Compu
                  </button>
                  <button
                    onClick={() => setPreviewMobile(true)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${
                      previewMobile ? 'bg-manso-cream text-manso-black' : 'text-manso-cream/60'
                    }`}
                  >
                    <Smartphone size={11} /> Celular
                  </button>
                </div>
                <button
                  onClick={() => setPreviewAbierto(false)}
                  className="p-1.5 text-manso-cream/50 hover:text-manso-cream"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Así se ve en la bandeja antes de abrirlo */}
            <div className="px-4 py-2.5 border-b border-manso-cream/10 bg-manso-cream/5">
              <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30 mb-0.5">
                En la casilla
              </p>
              <p className="text-xs truncate">
                <span className="font-bold text-manso-cream">{asunto.trim() || 'Asunto'}</span>
                <span className="text-manso-cream/50"> - {preheader.trim() || 'Pre-header'}</span>
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center bg-manso-cream/5">
              {previewError ? (
                <p className="text-xs text-red-400 self-center text-center px-6">{previewError}</p>
              ) : previewHtml === null ? (
                <p className="text-[10px] uppercase tracking-widest text-manso-cream/30 self-center">
                  Generando...
                </p>
              ) : (
                <iframe
                  title="Vista previa del mail"
                  srcDoc={previewHtml}
                  sandbox=""
                  className="bg-white rounded-lg border border-manso-cream/10"
                  style={{ width: previewMobile ? 375 : 600, height: '70vh', flexShrink: 0 }}
                />
              )}
            </div>

            <p className="px-4 py-2.5 border-t border-manso-cream/10 text-[9px] text-manso-cream/40 leading-relaxed">
              Las imágenes se muestran enteras: las zonas clickeables se recortan recién al
              enviar, así que acá no se pueden clickear. Antes de mandar la campaña, revisala
              igual con el envío de prueba desde la lista.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
