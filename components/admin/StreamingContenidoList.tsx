'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Wifi, Pencil, Trash2, WifiOff, Eye, Users, Lock } from 'lucide-react';

interface Item {
  id: string;
  titulo: string;
  slug: string;
  tipo: string;
  youtube_video_id: string | null;
  duracion_minutos: number | null;
  is_live: boolean;
  activo: boolean;
  orden: number;
  visibilidad: 'publico' | 'registrado' | 'miembro';
}

const TIPO_COLOR: Record<string, string> = {
  concierto: 'bg-manso-blue text-manso-cream',
  curso:     'bg-manso-olive text-white',
  taller:    'bg-manso-brown text-manso-cream',
};

const VISIBILIDAD_CONFIG = {
  publico:    { label: 'Público',    icon: Eye,   style: 'text-manso-cream/40' },
  registrado: { label: 'Registrado', icon: Users, style: 'text-manso-cream/40' },
  miembro:    { label: 'Miembro',    icon: Lock,  style: 'text-manso-terra/70' },
};

function GroupHeader({ label, count, accent }: { label: string; count: number; accent?: string }) {
  return (
    <div className="flex items-center gap-3 px-1 mb-2 mt-4 first:mt-0">
      <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${accent ?? 'text-manso-cream/25'}`}>
        {label}
      </p>
      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
        accent === 'text-red-400'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : accent === 'text-manso-terra/70'
          ? 'bg-manso-terra/10 border-manso-terra/20 text-manso-terra/60'
          : 'bg-manso-cream/5 border-manso-cream/10 text-manso-cream/25'
      }`}>
        {count}
      </span>
      <div className="flex-1 h-px bg-manso-cream/5" />
    </div>
  );
}

function ItemRow({ item, onEdit, onDelete, onToggle, onTerminar }: {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (id: string, titulo: string) => void;
  onToggle: (id: string, current: boolean) => void;
  onTerminar: (id: string, titulo: string) => void;
}) {
  const vis = VISIBILIDAD_CONFIG[item.visibilidad];
  const VisIcon = vis.icon;

  return (
    <div className={`bg-manso-cream/5 rounded-2xl border p-4 transition-all ${
      item.is_live
        ? 'border-red-500/30 bg-red-500/5'
        : item.activo
        ? 'border-manso-cream/10'
        : 'border-manso-cream/5 opacity-50'
    }`}>
      {item.is_live && (
        <button
          onClick={() => onTerminar(item.id, item.titulo)}
          className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <WifiOff size={12} />
          Terminar stream
        </button>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${TIPO_COLOR[item.tipo] ?? 'bg-zinc-700 text-white'}`}>
              {item.tipo}
            </span>
            {item.is_live && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-black uppercase tracking-widest">
                <Wifi size={7} /> Live
              </span>
            )}
            {/* Audiencia — siempre visible */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-manso-cream/5 border border-manso-cream/10 ${vis.style}`}>
              <VisIcon size={7} />
              {vis.label}
            </span>
            {!item.activo && (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-manso-cream/10 text-manso-cream/40">
                Oculto
              </span>
            )}
          </div>

          <p className="text-manso-cream font-black text-sm leading-tight truncate">{item.titulo}</p>

          <div className="flex items-center gap-3 mt-1">
            <span className="text-manso-cream/30 text-[10px] font-mono">/{item.slug}</span>
            {item.youtube_video_id && (
              <span className="text-manso-cream/30 text-[10px] font-mono">YT: {item.youtube_video_id}</span>
            )}
            {item.duracion_minutos && (
              <span className="text-manso-cream/30 text-[10px]">{item.duracion_minutos} min</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(item.id, item.activo)}
            className={`w-8 h-8 rounded-full text-xs font-black transition-all flex items-center justify-center ${
              item.activo
                ? 'bg-manso-olive/20 text-manso-olive hover:bg-manso-olive/30'
                : 'bg-manso-cream/10 text-manso-cream/30 hover:bg-manso-cream/20'
            }`}
            title={item.activo ? 'Ocultar' : 'Activar'}
          >
            {item.activo ? '●' : '○'}
          </button>
          <button
            onClick={() => onEdit(item)}
            className="w-8 h-8 rounded-full bg-manso-cream/10 text-manso-cream/60 hover:bg-manso-cream/20 hover:text-manso-cream transition-all flex items-center justify-center"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(item.id, item.titulo)}
            className="w-8 h-8 rounded-full bg-manso-terra/10 text-manso-terra/60 hover:bg-manso-terra/20 hover:text-manso-terra transition-all flex items-center justify-center"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StreamingContenidoList({ refreshTrigger }: { refreshTrigger: number }) {
  const router = useRouter();
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('streaming_contenido')
      .select('id, titulo, slug, tipo, youtube_video_id, duracion_minutos, is_live, activo, orden, visibilidad')
      .order('orden', { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshTrigger]);

  const handleEdit = (item: Item) => {
    window.dispatchEvent(new CustomEvent('editStreamingContenido', { detail: item }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dispatch = () => window.dispatchEvent(new CustomEvent('dashboardRefresh'));

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Tu sesión expiró. Por favor iniciá sesión nuevamente.');
      router.push('/login');
      return false;
    }
    return true;
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    if (!await checkSession()) return;
    const { error } = await supabase.from('streaming_contenido').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    load(); dispatch();
  };

  const toggleActivo = async (id: string, current: boolean) => {
    if (!await checkSession()) return;
    await supabase.from('streaming_contenido').update({ activo: !current }).eq('id', id);
    load(); dispatch();
  };

  const terminarStream = async (id: string, titulo: string) => {
    if (!confirm(`¿Terminar el stream "${titulo}"?\n\nEl badge "En vivo" se apagará y el video quedará disponible como grabación.`)) return;
    if (!await checkSession()) return;
    const { error } = await supabase
      .from('streaming_contenido')
      .update({ is_live: false, activo: true, fue_transmitido: true, transmitido_en: new Date().toISOString() })
      .eq('id', id);
    if (error) { alert(error.message); return; }
    load(); dispatch();
  };

  if (loading) return (
    <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8 text-center">
      <p className="text-manso-cream/40 text-sm uppercase tracking-widest font-black">Cargando...</p>
    </div>
  );

  if (!items.length) return (
    <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-10 text-center">
      <p className="text-manso-cream/30 text-sm uppercase tracking-widest font-black">Sin contenido aún</p>
      <p className="text-manso-cream/20 text-xs mt-2">Creá el primer video desde "Nuevo contenido"</p>
    </div>
  );

  // Agrupado: primero live, luego por audiencia de más restrictivo a más abierto
  const live       = items.filter(i => i.is_live);
  const miembro    = items.filter(i => !i.is_live && i.visibilidad === 'miembro');
  const registrado = items.filter(i => !i.is_live && i.visibilidad === 'registrado');
  const publico    = items.filter(i => !i.is_live && i.visibilidad === 'publico');

  const rowProps = { onEdit: handleEdit, onDelete: handleDelete, onToggle: toggleActivo, onTerminar: terminarStream };

  return (
    <div className="space-y-1">
      {live.length > 0 && (
        <>
          <GroupHeader label="En vivo ahora" count={live.length} accent="text-red-400" />
          {live.map(i => <ItemRow key={i.id} item={i} {...rowProps} />)}
        </>
      )}
      {miembro.length > 0 && (
        <>
          <GroupHeader label="Solo miembros" count={miembro.length} accent="text-manso-terra/70" />
          {miembro.map(i => <ItemRow key={i.id} item={i} {...rowProps} />)}
        </>
      )}
      {registrado.length > 0 && (
        <>
          <GroupHeader label="Registrados" count={registrado.length} />
          {registrado.map(i => <ItemRow key={i.id} item={i} {...rowProps} />)}
        </>
      )}
      {publico.length > 0 && (
        <>
          <GroupHeader label="Público general" count={publico.length} />
          {publico.map(i => <ItemRow key={i.id} item={i} {...rowProps} />)}
        </>
      )}
    </div>
  );
}
