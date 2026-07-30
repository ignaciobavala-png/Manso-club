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
  FlaskConical,
  Users,
  Download,
  RefreshCw,
  MailQuestion,
} from 'lucide-react';

/** Estados que significan "esta persona no recibió el mail" y por lo tanto
 *  se le puede reenviar sin riesgo de que le llegue dos veces.
 *  - no_enviado: el lote falló contra la API de Resend, nunca salió.
 *  - failed: Resend lo aceptó pero no pudo entregarlo.
 *  Los 'bounced' quedan afuera a propósito: reintentar contra una dirección
 *  que rebotó degrada la reputación del dominio (ya están en mailing_exclusiones). */
const ESTADOS_NO_RECIBIDOS = ['no_enviado', 'failed'];

const ESTADO_LABEL: Record<string, { texto: string; clase: string }> = {
  delivered: { texto: 'Entregado', clase: 'text-manso-olive' },
  enviado: { texto: 'Sin confirmar', clase: 'text-manso-cream/40' },
  opened: { texto: 'Abierto', clase: 'text-blue-400' },
  bounced: { texto: 'Rebotó', clase: 'text-yellow-400' },
  failed: { texto: 'Falló', clase: 'text-red-400' },
  no_enviado: { texto: 'No salió', clase: 'text-red-400' },
};

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
  noEnviado: number;
  opened: number;
  clicked: number;
}

interface EnvioDetalle {
  destinatario: string;
  estado: string;
  opened_at: string | null;
  clicked_at: string | null;
  error_detalle: string | null;
}

interface Props {
  refreshTrigger?: number;
}

/**
 * Lee el cuerpo como texto y recién ahí intenta parsear JSON. Si la función
 * serverless crashea o da timeout, Vercel responde texto plano (no JSON) y el
 * res.json() directo moría con "JSON.parse: unexpected character" ocultando
 * el error real; acá el status y el cuerpo crudo llegan al feedback.
 */
async function leerJson(
  res: Response
): Promise<Record<string, unknown> & { error?: string; enviados?: number; fallidos?: number; errorDetalle?: string | null }> {
  const texto = await res.text();
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`El servidor respondió ${res.status}: ${texto.slice(0, 200) || 'sin cuerpo'}`);
  }
}

export function MailingCampaniasList({ refreshTrigger }: Props) {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [metricas, setMetricas] = useState<Record<string, Metricas>>({});
  const [loading, setLoading] = useState(true);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pruebaAbiertaId, setPruebaAbiertaId] = useState<string | null>(null);
  const [pruebaEmails, setPruebaEmails] = useState<Record<string, string>>({});
  const [enviandoPruebaId, setEnviandoPruebaId] = useState<string | null>(null);
  const [detalleAbiertoId, setDetalleAbiertoId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<EnvioDetalle[]>([]);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [detalleFiltro, setDetalleFiltro] = useState('');
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);

  const fetchCampanias = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mailing_campanias')
      .select('id, asunto, audiencia, estado, created_at, sent_at, scheduled_at')
      .order('created_at', { ascending: false });
    const lista = data || [];
    setCampanias(lista);

    // Agregado en Postgres (RPC): contar en el cliente exigía traerse una fila
    // por destinatario, y Supabase corta en 1000 filas por defecto — una
    // campaña de mil mails mostraba métricas truncadas sin avisar.
    const { data: filas } = await supabase.rpc('mailing_metricas');
    const acumulado: Record<string, Metricas> = {};
    (filas || []).forEach((f: any) => {
      acumulado[f.campania_id] = {
        total: Number(f.total),
        delivered: Number(f.delivered),
        bounced: Number(f.bounced),
        failed: Number(f.failed),
        noEnviado: Number(f.no_enviado),
        opened: Number(f.opened),
        clicked: Number(f.clicked),
      };
    });
    setMetricas(acumulado);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampanias();
  }, [fetchCampanias, refreshTrigger]);

  const audienciaLabel = (id: string) => AUDIENCIAS.find((a) => a.id === id)?.label ?? id;

  /**
   * Trae los envíos de una campaña paginando de a 1000: es el techo de filas
   * que devuelve Supabase por request, y una campaña puede tener más
   * destinatarios que eso (la del 29/07 tuvo 920 y la próxima puede pasarlo).
   * Sin el loop la lista mentiría por omisión, que es justo el problema que
   * este panel viene a resolver.
   */
  const traerEnvios = async (campaniaId: string): Promise<EnvioDetalle[]> => {
    const PAGINA = 1000;
    const todos: EnvioDetalle[] = [];
    for (let desde = 0; ; desde += PAGINA) {
      const { data, error } = await supabase
        .from('mailing_envios')
        .select('destinatario, estado, opened_at, clicked_at, error_detalle')
        .eq('campania_id', campaniaId)
        .order('destinatario')
        .range(desde, desde + PAGINA - 1);
      if (error) throw new Error(error.message);
      todos.push(...((data ?? []) as EnvioDetalle[]));
      if (!data || data.length < PAGINA) break;
    }
    return todos;
  };

  const toggleDetalle = async (campania: Campania) => {
    if (detalleAbiertoId === campania.id) {
      setDetalleAbiertoId(null);
      return;
    }
    setDetalleAbiertoId(campania.id);
    setDetalle([]);
    setDetalleFiltro('');
    setDetalleCargando(true);
    try {
      setDetalle(await traerEnvios(campania.id));
    } catch (err: any) {
      setFeedback(`Error al cargar el detalle: ${err.message}`);
    }
    setDetalleCargando(false);
  };

  const descargarCsv = async (campania: Campania) => {
    try {
      const filas = detalleAbiertoId === campania.id && detalle.length > 0 ? detalle : await traerEnvios(campania.id);
      const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const csv = [
        'email,estado,abierto_el,click_el,error',
        ...filas.map((f) =>
          [
            f.destinatario,
            ESTADO_LABEL[f.estado]?.texto ?? f.estado,
            f.opened_at ?? '',
            f.clicked_at ?? '',
            f.error_detalle ?? '',
          ]
            .map(escapar)
            .join(',')
        ),
      ].join('\n');

      // BOM para que Excel en es-AR abra el CSV con acentos correctos
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `envios-${campania.asunto.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setFeedback(`Error al exportar: ${err.message}`);
    }
  };

  /**
   * Crea un borrador nuevo, copia del original, dirigido SOLO a quienes no
   * recibieron el mail (ver ESTADOS_NO_RECIBIDOS). Deliberadamente no reenvía
   * sobre la campaña original ni toca sus envíos: quien ya recibió no está en
   * la lista nueva, así que es imposible que le llegue dos veces.
   * Queda en borrador a propósito — el admin revisa la lista antes de mandar.
   */
  const reenviarNoRecibidos = async (campania: Campania) => {
    setReenviandoId(campania.id);
    setFeedback(null);
    try {
      const envios = await traerEnvios(campania.id);
      const pendientes = Array.from(
        new Set(envios.filter((e) => ESTADOS_NO_RECIBIDOS.includes(e.estado)).map((e) => e.destinatario))
      );

      if (pendientes.length === 0) {
        setFeedback('Todos los destinatarios de esta campaña recibieron el mail. No hay a quién reenviar.');
        setReenviandoId(null);
        return;
      }

      if (
        !confirm(
          `Se va a crear un borrador nuevo para ${pendientes.length} destinatarios que NO recibieron "${campania.asunto}".\n\n` +
            `Los que sí lo recibieron quedan afuera. El borrador no se manda solo: lo revisás y le das enviar.`
        )
      ) {
        setReenviandoId(null);
        return;
      }

      const { data: original, error: errorOriginal } = await supabase
        .from('mailing_campanias')
        .select('asunto, preheader, bloques, color_fondo')
        .eq('id', campania.id)
        .single();
      if (errorOriginal) throw new Error(errorOriginal.message);

      const { error: errorInsert } = await supabase.from('mailing_campanias').insert([
        {
          asunto: original.asunto,
          preheader: original.preheader,
          bloques: original.bloques,
          color_fondo: original.color_fondo,
          audiencia: 'especifico',
          estado: 'borrador',
          destinatarios_especificos: pendientes,
        },
      ]);
      if (errorInsert) throw new Error(errorInsert.message);

      setFeedback(`Borrador creado para ${pendientes.length} destinatarios que no recibieron el mail. Revisalo y enviá cuando quieras.`);
      fetchCampanias();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
    setReenviandoId(null);
  };

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
      const data = await leerJson(res);
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      // Un envío parcial no es un éxito: la campaña del 29/07 perdió 620 de
      // 920 destinatarios y el aviso pasó desapercibido entre texto gris.
      setFeedback(
        data.fallidos
          ? `⚠️ ATENCIÓN: salieron ${data.enviados} de ${(data.enviados ?? 0) + (data.fallidos ?? 0)}. ` +
            `${data.fallidos} NO se enviaron${data.errorDetalle ? ` (${data.errorDetalle})` : ''}. ` +
            `Usá "Reenviar a los que no recibieron" para completar el envío sin duplicar.`
          : `Enviado a ${data.enviados} destinatarios`
      );
      fetchCampanias();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
    setEnviandoId(null);
  };

  const enviarPrueba = async (campania: Campania) => {
    const destinatarios = (pruebaEmails[campania.id] ?? '')
      .split(/[,\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (destinatarios.length === 0) {
      setFeedback('Ingresá al menos un email para la prueba');
      return;
    }

    setEnviandoPruebaId(campania.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/mailing/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaniaId: campania.id, destinatarios }),
      });
      const data = await leerJson(res);
      if (!res.ok) throw new Error(data.error || 'Error al enviar la prueba');
      setFeedback(`Prueba enviada a ${data.enviados} destinatario${data.enviados === 1 ? '' : 's'}`);
      setPruebaAbiertaId(null);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
    setEnviandoPruebaId(null);
  };

  const cancelarProgramacion = async (campania: Campania) => {
    if (!confirm(`¿Cancelar la programación de "${campania.asunto}"? Volverá a borrador.`)) return;
    await supabase
      .from('mailing_campanias')
      .update({ estado: 'borrador', scheduled_at: null })
      .eq('id', campania.id);
    fetchCampanias();
  };

  const eliminar = async (campania: Campania) => {
    const mensaje =
      campania.estado === 'enviada'
        ? `¿Eliminar "${campania.asunto}"? Ya fue enviada — se pierde el historial y las métricas de este envío.`
        : '¿Eliminar este borrador?';
    if (!confirm(mensaje)) return;
    await supabase.from('mailing_campanias').delete().eq('id', campania.id);
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
        <div
          className={`mb-4 p-3 rounded-xl text-xs ${
            feedback.startsWith('⚠️') || feedback.startsWith('Error')
              ? 'bg-red-500/15 border border-red-500/40 text-red-200'
              : 'bg-manso-cream/10 text-manso-cream'
          }`}
        >
          {feedback}
        </div>
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
                        onClick={() => setPruebaAbiertaId(pruebaAbiertaId === c.id ? null : c.id)}
                        className="p-1.5 text-manso-cream/30 hover:text-manso-cream"
                        title="Enviar prueba a un email"
                      >
                        <FlaskConical size={12} />
                      </button>
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
                        <button onClick={() => eliminar(c)} className="p-1.5 text-manso-cream/30 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30">
                        {c.sent_at && new Date(c.sent_at).toLocaleDateString('es-AR')}
                      </span>
                      <button onClick={() => eliminar(c)} className="p-1.5 text-manso-cream/30 hover:text-red-400" title="Eliminar (borra el historial de este envío)">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {pruebaAbiertaId === c.id && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-manso-cream/5">
                    <input
                      value={pruebaEmails[c.id] ?? ''}
                      onChange={(e) => setPruebaEmails({ ...pruebaEmails, [c.id]: e.target.value })}
                      placeholder="email@ejemplo.com, otro@ejemplo.com"
                      className="flex-1 bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
                    />
                    <button
                      onClick={() => enviarPrueba(c)}
                      disabled={enviandoPruebaId === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 shrink-0"
                    >
                      {enviandoPruebaId === c.id ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
                      Mandar prueba
                    </button>
                  </div>
                )}

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
                    {m.noEnviado > 0 && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-300">
                        <MailQuestion size={11} className="text-red-400" /> {m.noEnviado} nunca salieron
                      </span>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/20">
                      de {m.total} destinatarios
                    </span>
                  </div>
                )}

                {c.estado === 'enviada' && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      onClick={() => toggleDetalle(c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors"
                    >
                      <Users size={11} />
                      {detalleAbiertoId === c.id ? 'Ocultar detalle' : 'Ver a quién le llegó'}
                    </button>
                    <button
                      onClick={() => descargarCsv(c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors"
                    >
                      <Download size={11} /> CSV
                    </button>
                    {m && m.noEnviado + m.failed > 0 && (
                      <button
                        onClick={() => reenviarNoRecibidos(c)}
                        disabled={reenviandoId === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-terra hover:bg-manso-terra/90 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        {reenviandoId === c.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <RefreshCw size={11} />
                        )}
                        Reenviar a los {m.noEnviado + m.failed} que no recibieron
                      </button>
                    )}
                  </div>
                )}

                {detalleAbiertoId === c.id && (
                  <div className="mt-2 pt-2 border-t border-manso-cream/5">
                    {detalleCargando ? (
                      <p className="text-[10px] uppercase tracking-widest text-manso-cream/30">Cargando destinatarios...</p>
                    ) : (
                      <>
                        <input
                          value={detalleFiltro}
                          onChange={(e) => setDetalleFiltro(e.target.value)}
                          placeholder="Buscar email o estado..."
                          className="w-full mb-2 bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
                        />
                        <div className="max-h-64 overflow-y-auto space-y-0.5">
                          {detalle
                            .filter((e) => {
                              const q = detalleFiltro.trim().toLowerCase();
                              if (!q) return true;
                              const label = ESTADO_LABEL[e.estado]?.texto ?? e.estado;
                              return (
                                e.destinatario.toLowerCase().includes(q) || label.toLowerCase().includes(q)
                              );
                            })
                            .map((e) => {
                              const label = ESTADO_LABEL[e.estado] ?? { texto: e.estado, clase: 'text-manso-cream/40' };
                              return (
                                <div
                                  key={e.destinatario}
                                  className="flex items-center justify-between gap-3 py-1 px-2 rounded-lg odd:bg-manso-cream/[0.03]"
                                >
                                  <span className="text-[11px] text-manso-cream/70 truncate" title={e.error_detalle ?? undefined}>
                                    {e.destinatario}
                                  </span>
                                  <span className="flex items-center gap-2 shrink-0">
                                    {e.opened_at && <MailOpen size={10} className="text-blue-400" />}
                                    {e.clicked_at && <MousePointerClick size={10} className="text-manso-terra" />}
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${label.clase}`}>
                                      {label.texto}
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}
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
