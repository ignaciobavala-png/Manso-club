'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Wifi, Play, PowerOff, RotateCcw, CheckCircle, HelpCircle, X } from 'lucide-react';

type Modo = 'en_vivo' | 'grabado' | 'apagado';

interface Config {
  id: string;
  modo: Modo;
  stream_url: string | null;
  contenido_id: string | null;
}

interface Contenido {
  id: string;
  titulo: string;
  youtube_video_id: string | null;
  tipo: string;
  fue_transmitido: boolean;
}

const MODO_LABEL: Record<Modo, string> = {
  en_vivo:  'En vivo',
  grabado:  'Grabado en loop',
  apagado:  'Apagado',
};

const MODO_COLOR: Record<Modo, string> = {
  en_vivo:  'text-red-400',
  grabado:  'text-manso-olive',
  apagado:  'text-manso-cream/30',
};

const MODO_DOT: Record<Modo, string> = {
  en_vivo:  'bg-red-500 animate-pulse',
  grabado:  'bg-manso-olive',
  apagado:  'bg-manso-cream/20',
};

export function CanalControl() {
  const [config, setConfig] = useState<Config | null>(null);
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ayuda, setAyuda] = useState(false);

  // Edición local
  const [modo, setModo] = useState<Modo>('apagado');
  const [streamUrl, setStreamUrl] = useState('');
  const [contenidoId, setContenidoId] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    const [{ data: cfg }, { data: items }] = await Promise.all([
      supabase.from('streaming_config').select('id, modo, stream_url, contenido_id').single(),
      supabase
        .from('streaming_contenido')
        .select('id, titulo, youtube_video_id, tipo, fue_transmitido')
        .eq('activo', true)
        .order('orden', { ascending: true }),
    ]);

    if (cfg) {
      setConfig(cfg);
      setModo(cfg.modo as Modo);
      setStreamUrl(cfg.stream_url ?? '');
      setContenidoId(cfg.contenido_id ?? '');
    }
    setContenidos(items ?? []);
    setLoading(false);
  };

  const guardar = async () => {
    if (!config) return;
    setSaving(true);
    const payload = {
      modo,
      stream_url:   modo === 'en_vivo' ? (streamUrl.trim() || null) : null,
      contenido_id: modo === 'grabado'  ? (contenidoId || null)     : null,
      updated_at:   new Date().toISOString(),
    };
    const { error } = await supabase
      .from('streaming_config')
      .update(payload)
      .eq('id', config.id);
    setSaving(false);
    if (!error) {
      setConfig(prev => prev ? { ...prev, ...payload } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-[2rem] p-6 space-y-6">
      {/* Estado actual + botón ayuda */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${MODO_DOT[modo]}`} />
          <span className={`text-sm font-black uppercase tracking-widest ${MODO_COLOR[modo]}`}>
            Canal {MODO_LABEL[modo]}
          </span>
        </div>
        <button
          onClick={() => setAyuda(true)}
          className="w-7 h-7 rounded-full border border-manso-cream/15 flex items-center justify-center text-manso-cream/30 hover:text-manso-cream/60 hover:border-manso-cream/30 transition-all"
          title="¿Cómo funciona el canal?"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* Modal de ayuda */}
      {ayuda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAyuda(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-[#000000] border border-manso-cream/15 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black uppercase tracking-tight text-manso-cream">
                ¿Cómo funciona el canal?
              </h3>
              <button
                onClick={() => setAyuda(false)}
                className="w-8 h-8 rounded-full border border-manso-cream/15 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-5 text-sm text-manso-cream/60 leading-relaxed">
              <p>
                El canal es lo primero que ven los usuarios cuando entran a <span className="text-manso-cream font-bold">/streaming</span>. Funciona como una señal de TV: siempre hay algo "al aire".
              </p>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[8px] font-black uppercase tracking-widest mt-0.5">
                    <Wifi size={8} /> En vivo
                  </span>
                  <p>Ingresás la URL del stream de YouTube Live. Los usuarios ven el embed en vivo.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-manso-olive/15 border border-manso-olive/30 text-manso-olive text-[8px] font-black uppercase tracking-widest mt-0.5">
                    <Play size={8} /> Grabado
                  </span>
                  <p>Seleccionás un video del catálogo para que se reproduzca en loop. Útil para mantener el canal activo entre transmisiones.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-manso-cream/10 border border-manso-cream/15 text-manso-cream/40 text-[8px] font-black uppercase tracking-widest mt-0.5">
                    <PowerOff size={8} /> Apagado
                  </span>
                  <p>El canal muestra un placeholder. Los usuarios ven que no hay transmisión activa.</p>
                </div>
              </div>

              <div className="border-t border-manso-cream/10 pt-4 text-manso-cream/40 text-xs space-y-1.5">
                <p>
                  <span className="text-manso-cream/60 font-bold">Terminar un stream:</span> desde la lista de contenido, hacé click en "Terminar stream". El video se archiva automáticamente en la sección Multimedia para todos los usuarios registrados.
                </p>
                <p>
                  <span className="text-manso-cream/60 font-bold">Acceso:</span> el canal se ve con registro gratuito. El catálogo debajo tiene su propia visibilidad por item.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de modo */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/40 mb-3">Modo</p>
        <div className="grid grid-cols-3 gap-2">
          {(['en_vivo', 'grabado', 'apagado'] as Modo[]).map(m => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`py-3 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                modo === m
                  ? m === 'en_vivo'  ? 'bg-red-600/30 border border-red-500/50 text-red-400'
                  : m === 'grabado'  ? 'bg-manso-olive/20 border border-manso-olive/40 text-manso-olive'
                  :                    'bg-manso-cream/10 border border-manso-cream/20 text-manso-cream/60'
                  : 'bg-manso-cream/5 border border-manso-cream/10 text-manso-cream/30 hover:border-manso-cream/20 hover:text-manso-cream/50'
              }`}
            >
              {m === 'en_vivo' && <Wifi size={10} />}
              {m === 'grabado' && <Play size={10} />}
              {m === 'apagado' && <PowerOff size={10} />}
              {MODO_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Config específica por modo */}
      {modo === 'en_vivo' && (
        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/40 block mb-2">
            URL del stream (YouTube Live, HLS, etc.)
          </label>
          <input
            type="text"
            value={streamUrl}
            onChange={e => setStreamUrl(e.target.value)}
            placeholder="https://youtube.com/live/..."
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 text-sm text-manso-cream placeholder:text-manso-cream/20 font-mono focus:outline-none focus:border-red-500/50"
          />
          <p className="text-[10px] text-manso-cream/25 mt-1.5">
            También podés cargar el video en "Contenido" y usar el YouTube Video ID
          </p>
        </div>
      )}

      {modo === 'grabado' && (
        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/40 block mb-2">
            Contenido en loop
          </label>
          {contenidos.length === 0 ? (
            <p className="text-xs text-manso-cream/30">No hay contenido activo cargado aún.</p>
          ) : (
            <select
              value={contenidoId}
              onChange={e => setContenidoId(e.target.value)}
              className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 text-sm text-manso-cream focus:outline-none focus:border-manso-olive/50"
            >
              <option value="">— Seleccionar video —</option>
              {contenidos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.titulo} {c.fue_transmitido ? '(ya transmitido)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {modo === 'apagado' && (
        <p className="text-xs text-manso-cream/25">
          El canal está apagado. Los usuarios verán un placeholder de "próxima transmisión".
        </p>
      )}

      {/* Guardar */}
      <button
        onClick={guardar}
        disabled={saving}
        className="w-full py-3 bg-manso-cream text-manso-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-manso-cream/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-manso-black/30 border-t-manso-black rounded-full animate-spin" />
        ) : saved ? (
          <><CheckCircle size={14} /> Guardado</>
        ) : (
          <><RotateCcw size={12} /> Actualizar canal</>
        )}
      </button>
    </div>
  );
}
