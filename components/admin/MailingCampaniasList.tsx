'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AUDIENCIAS } from '@/lib/mailing-audiencias';
import {
  Send,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  CalendarClock,
  MailCheck,
  MailX,
  MailWarning,
  MailOpen,
  MousePointerClick,
  XCircle,
} from 'lucide-react';

interface Campania {
  id: string;
  asunto: string;
  audiencia: string;
  estado: 'borrador' | 'programada' | 'enviada';
  created_at: string;
  sent_at: string | null;
  scheduled_at: string | null;
}

interface Metricas {
  total: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  clicked: number;
}

interface Props {
  refreshTrigger?: number;
}

export function MailingCampaniasList({ refreshTrigger }: Props) {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [metricas, setMetricas] = useState<Record<string, Metricas>>({});
  const [loading, setLoading] = useState(true);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCampanias = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mailing_campanias')
      .select('id, asunto, audiencia, estado, created_at, sent_at, scheduled_at')
      .order('created_at', { ascending: false });
    const lista = data || [];
    setCampanias(lista);

    const idsEnviadas = lista.filter((c) => c.estado === 'enviada').map((c) => c.id);
    if (idsEnviadas.length > 0) {
      const { data: envios } = await supabase
        .from('mailing_envios')
        .select('campania_id, estado, opened_at, clicked_at')
        .in('campania_id', idsEnviadas);

      const acumulado: Record<string, Metricas> = {};
      (envios || []).forEach((e) => {
        const m =
          acumulado[e.campania_id] ??
          { total: 0, delivered: 0, bounced: 0, failed: 0, opened: 0, clicked: 0 };
        m.total += 1;
        if (e.estado === 'delivered') m.delivered += 1;
        if (e.estado === 'bounced') m.bounced += 1;
        if (e.estado === 'failed') m.failed += 1;
        if (e.opened_at) m.opened += 1;
        if (e.clicked_at) m.clicked += 1;
        acumulado[e.campania_id] = m;
      });
      setMetricas(acumulado);
    }

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

  const cancelarProgramacion = async (campania: Campania) => {
    if (!confirm(`¿Cancelar la programación de "${campania.asunto}"? Volverá a borrador.`)) return;
    await supabase
      .from('mailing_campanias')
      .update({ estado: 'borrador', scheduled_at: null })
      .eq('id', campania.id);
    fetchCampanias();
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
          {campanias.map((c) => {
            const m = metricas[c.id];
            return (
              <div key={c.id} className="py-3 px-3 rounded-xl bg-manso-cream/5 border border-manso-cream/5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-manso-cream/90 truncate">{c.asunto}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 flex items-center gap-1.5 mt-0.5">
                      {c.estado === 'enviada' && <CheckCircle2 size={10} className="text-green-400" />}
                      {c.estado === 'programada' && <CalendarClock size={10} className="text-manso-terra" />}
                      {c.estado === 'borrador' && <Clock size={10} />}
                      {c.estado === 'programada' && c.scheduled_at
                        ? `programada · ${new Date(c.scheduled_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`
                        : c.estado}{' '}
                      · {audienciaLabel(c.audiencia)}
                    </p>
                  </div>

                  {c.estado !== 'enviada' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => enviar(c)}
                        disabled={enviandoId === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-terra hover:bg-manso-terra/90 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        {enviandoId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        {c.estado === 'programada' ? 'Enviar ya' : 'Enviar'}
                      </button>
                      {c.estado === 'programada' ? (
                        <button
                          onClick={() => cancelarProgramacion(c)}
                          className="p-1.5 text-manso-cream/30 hover:text-yellow-400"
                          title="Cancelar programación"
                        >
                          <XCircle size={12} />
                        </button>
                      ) : (
                        <button onClick={() => eliminar(c.id)} className="p-1.5 text-manso-cream/30 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 shrink-0">
                      {c.sent_at && new Date(c.sent_at).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>

                {c.estado === 'enviada' && m && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t border-manso-cream/5">
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                      <MailCheck size={11} className="text-manso-olive" /> {m.delivered} entregados
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                      <MailOpen size={11} className="text-blue-400" /> {m.opened} abiertos
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                      <MousePointerClick size={11} className="text-manso-terra" /> {m.clicked} clicks
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                      <MailWarning size={11} className="text-yellow-400" /> {m.bounced} rebotados
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                      <MailX size={11} className="text-red-400" /> {m.failed} fallidos
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/20">
                      de {m.total} enviados
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
