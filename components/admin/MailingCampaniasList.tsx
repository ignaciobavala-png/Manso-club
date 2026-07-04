'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AUDIENCIAS } from '@/lib/mailing-audiencias';
import { Send, Trash2, Loader2, CheckCircle2, Clock } from 'lucide-react';

interface Campania {
  id: string;
  asunto: string;
  audiencia: string;
  estado: 'borrador' | 'enviada';
  created_at: string;
  sent_at: string | null;
}

interface Props {
  refreshTrigger?: number;
}

export function MailingCampaniasList({ refreshTrigger }: Props) {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCampanias = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mailing_campanias')
      .select('id, asunto, audiencia, estado, created_at, sent_at')
      .order('created_at', { ascending: false });
    setCampanias(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampanias();
  }, [fetchCampanias, refreshTrigger]);

  const audienciaLabel = (id: string) => AUDIENCIAS.find((a) => a.id === id)?.label ?? id;

  const enviar = async (campania: Campania) => {
    if (!confirm(`¿Enviar "${campania.asunto}" a ${audienciaLabel(campania.audiencia)}? Esta acción no se puede deshacer.`)) return;

    setEnviandoId(campania.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/mailing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaniaId: campania.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setFeedback(`Enviado a ${data.enviados} destinatarios${data.fallidos ? ` (${data.fallidos} fallidos)` : ''}`);
      fetchCampanias();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
    setEnviandoId(null);
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este borrador?')) return;
    await supabase.from('mailing_campanias').delete().eq('id', id);
    fetchCampanias();
  };

  return (
    <div className="bg-manso-cream/5 rounded-[2rem] border border-manso-cream/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-manso-cream">
          Campañas ({campanias.length})
        </h3>
      </div>

      {feedback && (
        <div className="mb-4 p-3 rounded-xl bg-manso-cream/10 text-manso-cream text-xs">{feedback}</div>
      )}

      {loading ? (
        <p className="text-xs text-manso-cream/30 uppercase tracking-widest">Cargando...</p>
      ) : campanias.length === 0 ? (
        <p className="text-xs text-manso-cream/30 uppercase tracking-widest">Sin campañas aún</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {campanias.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3 px-3 rounded-xl bg-manso-cream/5 border border-manso-cream/5">
              <div className="min-w-0">
                <p className="text-sm text-manso-cream/90 truncate">{c.asunto}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 flex items-center gap-1.5 mt-0.5">
                  {c.estado === 'enviada' ? <CheckCircle2 size={10} className="text-green-400" /> : <Clock size={10} />}
                  {c.estado} · {audienciaLabel(c.audiencia)}
                </p>
              </div>

              {c.estado === 'borrador' ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => enviar(c)}
                    disabled={enviandoId === c.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-terra hover:bg-manso-terra/90 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {enviandoId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Enviar
                  </button>
                  <button onClick={() => eliminar(c.id)} className="p-1.5 text-manso-cream/30 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 shrink-0">
                  {c.sent_at && new Date(c.sent_at).toLocaleDateString('es-AR')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
