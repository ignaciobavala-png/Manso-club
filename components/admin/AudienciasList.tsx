'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Download, Search, Send, XCircle, Loader2 } from 'lucide-react';

interface Contacto {
  email: string;
  fuente: 'newsletter' | 'registrado' | 'ambos';
  fecha: string;
  excluido: boolean;
}

interface CampaniaBorrador {
  id: string;
  asunto: string;
}

export function AudienciasList() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [borradores, setBorradores] = useState<CampaniaBorrador[]>([]);
  const [campaniaPrueba, setCampaniaPrueba] = useState('');
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchContactos = useCallback(async () => {
    setLoading(true);
    const [{ data: suscriptores }, { data: registrados }, { data: exclusiones }] = await Promise.all([
      supabase.from('newsletter_suscriptores').select('email, created_at'),
      supabase.from('user_profiles').select('email, created_at'),
      supabase.from('mailing_exclusiones').select('email'),
    ]);

    const excluidos = new Set((exclusiones ?? []).map((e) => e.email.toLowerCase()));
    const mapa = new Map<string, Contacto>();

    (suscriptores ?? []).forEach((s) => {
      const key = s.email.toLowerCase();
      mapa.set(key, { email: s.email, fuente: 'newsletter', fecha: s.created_at, excluido: excluidos.has(key) });
    });

    (registrados ?? []).forEach((r) => {
      const key = r.email.toLowerCase();
      const existente = mapa.get(key);
      mapa.set(key, {
        email: r.email,
        fuente: existente ? 'ambos' : 'registrado',
        fecha: existente && existente.fecha < r.created_at ? existente.fecha : r.created_at,
        excluido: excluidos.has(key),
      });
    });

    setContactos(Array.from(mapa.values()).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
    setLoading(false);
  }, []);

  const fetchBorradores = useCallback(async () => {
    const { data } = await supabase
      .from('mailing_campanias')
      .select('id, asunto')
      .eq('estado', 'borrador')
      .order('created_at', { ascending: false });
    setBorradores(data || []);
  }, []);

  useEffect(() => {
    fetchContactos();
    fetchBorradores();
  }, [fetchContactos, fetchBorradores]);

  const contactosFiltrados = useMemo(
    () => contactos.filter((c) => c.email.toLowerCase().includes(busqueda.toLowerCase())),
    [contactos, busqueda]
  );

  const toggleSeleccionado = (email: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionados.size === contactosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(contactosFiltrados.map((c) => c.email)));
    }
  };

  const excluir = async (email: string) => {
    if (!confirm(`¿Excluir a ${email} de futuros envíos? No se borra su cuenta, solo deja de recibir mailing.`)) return;
    await supabase.from('mailing_exclusiones').insert([{ email, motivo: 'Excluido manualmente desde admin' }]);
    fetchContactos();
  };

  const reincluir = async (email: string) => {
    await supabase.from('mailing_exclusiones').delete().eq('email', email);
    fetchContactos();
  };

  const darDeBaja = async (email: string) => {
    if (!confirm(`¿Dar de baja a ${email} del newsletter? Se elimina su suscripción.`)) return;
    await supabase.from('newsletter_suscriptores').delete().eq('email', email);
    fetchContactos();
  };

  const exportCSV = () => {
    const rows = ['email,fuente,fecha,excluido', ...contactos.map((c) =>
      `${c.email},${c.fuente},${new Date(c.fecha).toLocaleDateString('es-AR')},${c.excluido}`
    )];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audiencia-mailing.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const enviarPrueba = async () => {
    if (!campaniaPrueba || seleccionados.size === 0) return;
    setEnviandoPrueba(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/mailing/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaniaId: campaniaPrueba, destinatarios: Array.from(seleccionados) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setFeedback(`Prueba enviada a ${data.enviados} destinatario(s)`);
      setSeleccionados(new Set());
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
    setEnviandoPrueba(false);
  };

  const fuenteLabel = { newsletter: 'Newsletter', registrado: 'Registrado', ambos: 'Ambos' };
  const fuenteColor = { newsletter: 'text-manso-olive', registrado: 'text-manso-cream/50', ambos: 'text-manso-terra' };

  return (
    <div className="bg-manso-cream/5 rounded-[2rem] border border-manso-cream/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-manso-cream/40" />
          <h3 className="text-sm font-black uppercase tracking-widest text-manso-cream">
            Total de mails ({contactos.length})
          </h3>
        </div>
        {contactos.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
        )}
      </div>

      <p className="text-[10px] text-manso-cream/40 mb-4">
        Unión de suscriptores de newsletter + usuarios registrados en la web, sin duplicados.
      </p>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/30" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por email..."
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl pl-9 pr-4 py-2 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
        />
      </div>

      {feedback && (
        <div className="mb-3 p-3 rounded-xl bg-manso-cream/10 text-manso-cream text-xs">{feedback}</div>
      )}

      {seleccionados.size > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-manso-terra/10 border border-manso-terra/20 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-manso-cream">
            {seleccionados.size} seleccionado(s)
          </span>
          <select
            value={campaniaPrueba}
            onChange={(e) => setCampaniaPrueba(e.target.value)}
            className="bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-2 py-1.5 text-xs text-manso-cream focus:outline-none"
          >
            <option value="" className="bg-manso-black">Elegir campaña...</option>
            {borradores.map((b) => (
              <option key={b.id} value={b.id} className="bg-manso-black">{b.asunto}</option>
            ))}
          </select>
          <button
            onClick={enviarPrueba}
            disabled={!campaniaPrueba || enviandoPrueba}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-terra hover:bg-manso-terra/90 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {enviandoPrueba ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Enviar prueba
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-manso-cream/30 uppercase tracking-widest">Cargando...</p>
      ) : contactosFiltrados.length === 0 ? (
        <p className="text-xs text-manso-cream/30 uppercase tracking-widest">Sin resultados</p>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-3">
          <label className="flex items-center gap-2 py-1 text-[9px] font-black uppercase tracking-widest text-manso-cream/40 cursor-pointer">
            <input
              type="checkbox"
              checked={seleccionados.size > 0 && seleccionados.size === contactosFiltrados.length}
              onChange={toggleSeleccionarTodos}
              className="accent-manso-terra"
            />
            Seleccionar todos
          </label>

          {contactosFiltrados.map((c) => (
            <div key={c.email} className={`flex items-center justify-between py-2 border-b border-manso-cream/5 ${c.excluido ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={seleccionados.has(c.email)}
                  onChange={() => toggleSeleccionado(c.email)}
                  className="accent-manso-terra shrink-0"
                />
                <span className="text-sm text-manso-cream/80 truncate">{c.email}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[8px] font-black uppercase tracking-widest ${fuenteColor[c.fuente]}`}>
                  {fuenteLabel[c.fuente]}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30">
                  {new Date(c.fecha).toLocaleDateString('es-AR')}
                </span>
                {c.excluido ? (
                  <button onClick={() => reincluir(c.email)} className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-cream">
                    Reincluir
                  </button>
                ) : (
                  <button onClick={() => excluir(c.email)} title="Excluir de mailing" className="text-manso-cream/30 hover:text-yellow-400">
                    <XCircle size={13} />
                  </button>
                )}
                {c.fuente === 'newsletter' && (
                  <button onClick={() => darDeBaja(c.email)} className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30 hover:text-red-400">
                    Dar de baja
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
