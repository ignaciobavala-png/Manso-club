'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, User, Mail, Calendar, CheckCircle, ExternalLink, EyeOff, Eye, Crown, Plus } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'member';
  display_name: string | null;
  avatar_url: string | null;
  telefono: string | null;
  created_at: string;
  updated_at: string;
  membresia_activa: boolean;
  membresia_hasta: string | null;
  membresia_tipo: string | null;
  permisos_totales: boolean;
}

interface UsuarioDrawerProps {
  usuario: UserProfile;
  onClose: () => void;
  onUpdated: (updated: UserProfile) => void;
}

function getNivel(u: UserProfile) {
  if (u.role === 'admin') return 'admin';
  if (u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > new Date())) return 'miembro';
  return 'registrado';
}

const NIVEL_BADGE: Record<string, string> = {
  admin:      'bg-manso-blue/30 text-blue-300',
  miembro:    'bg-manso-terra/20 text-manso-terra',
  registrado: 'bg-manso-cream/10 text-manso-cream/60',
};

const NIVEL_LABEL: Record<string, string> = {
  admin:      'Admin',
  miembro:    'Miembro',
  registrado: 'Registrado',
};

interface ArtistaInfo {
  id: string;
  nombre: string;
  slug: string;
  active: boolean;
  tipo: string | null;
}

interface PlanActivo {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  periodo: string;
  vencimiento: string;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  periodo: string;
  categoria: string;
}

function calcularVencimiento(periodo: string): string {
  const d = new Date();
  if (periodo === 'mes') d.setMonth(d.getMonth() + 1);
  else if (periodo === 'año' || periodo === 'anual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

export function UsuarioDrawer({ usuario, onClose, onUpdated }: UsuarioDrawerProps) {
  const [artista, setArtista] = useState<ArtistaInfo | null>(null);
  const [togglingArtista, setTogglingArtista] = useState(false);

  // Membresía
  const [planActivo, setPlanActivo] = useState<PlanActivo | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [asignando, setAsignando] = useState(false);
  const [planSelId, setPlanSelId] = useState('');
  const [vencimientoInput, setVencimientoInput] = useState('');
  const [guardandoPlan, setGuardandoPlan] = useState(false);
  const [cancelandoPlan, setCelandoPlan] = useState(false);

  // Permisos
  const [permisos, setPermisos] = useState(usuario.permisos_totales);
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);
  const [savedPermisos, setSavedPermisos] = useState(false);

  useEffect(() => {
    supabase
      .from('artistas')
      .select('id, nombre, slug, active, tipo')
      .eq('user_id', usuario.id)
      .maybeSingle()
      .then(({ data }) => setArtista(data));

    supabase
      .from('user_membresias_activas')
      .select('id, vencimiento, membresias(id, nombre, categoria, precio, periodo)')
      .eq('user_id', usuario.id)
      .eq('estado', 'activa')
      .gt('vencimiento', new Date().toISOString())
      .order('vencimiento', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.membresias) {
          const m = data.membresias as unknown as { id: string; nombre: string; categoria: string; precio: number; periodo: string };
          setPlanActivo({
            id: data.id,
            nombre: m.nombre,
            categoria: m.categoria,
            precio: m.precio,
            periodo: m.periodo,
            vencimiento: data.vencimiento,
          });
        }
      });

    supabase
      .from('membresias')
      .select('id, nombre, precio, periodo, categoria')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .then(({ data }) => setPlanes(data ?? []));
  }, [usuario.id]);

  const nivel = getNivel(usuario);

  const handleToggleArtista = async () => {
    if (!artista) return;
    setTogglingArtista(true);
    const newActive = !artista.active;
    const { error } = await supabase.from('artistas').update({ active: newActive }).eq('id', artista.id);
    if (!error) setArtista(prev => prev ? { ...prev, active: newActive } : null);
    setTogglingArtista(false);
  };

  const handlePlanSelect = (id: string) => {
    setPlanSelId(id);
    const plan = planes.find(p => p.id === id);
    if (plan) setVencimientoInput(calcularVencimiento(plan.periodo));
  };

  const handleAsignarPlan = async () => {
    if (!planSelId || !vencimientoInput) return;
    setGuardandoPlan(true);

    const plan = planes.find(p => p.id === planSelId)!;
    const vencIso = new Date(vencimientoInput + 'T00:00:00').toISOString();

    // Cancelar planes activos previos
    await supabase
      .from('user_membresias_activas')
      .update({ estado: 'cancelada' })
      .eq('user_id', usuario.id)
      .eq('estado', 'activa');

    // Crear nuevo registro
    const { data: nuevo } = await supabase
      .from('user_membresias_activas')
      .insert({
        user_id: usuario.id,
        membresia_id: planSelId,
        inicio: new Date().toISOString(),
        vencimiento: vencIso,
        estado: 'activa',
      })
      .select('id')
      .single();

    // Sincronizar user_profiles
    const profileUpdate = {
      membresia_activa: true,
      membresia_tipo: plan.periodo,
      membresia_hasta: vencIso,
    };
    await supabase.from('user_profiles').update(profileUpdate).eq('id', usuario.id);

    setPlanActivo({
      id: nuevo?.id ?? '',
      nombre: plan.nombre,
      categoria: plan.categoria,
      precio: plan.precio,
      periodo: plan.periodo,
      vencimiento: vencIso,
    });
    setAsignando(false);
    setPlanSelId('');
    setGuardandoPlan(false);
    onUpdated({ ...usuario, ...profileUpdate });
  };

  const handleCancelarPlan = async () => {
    if (!confirm('¿Cancelar la membresía de este usuario?')) return;
    setCelandoPlan(true);

    await supabase
      .from('user_membresias_activas')
      .update({ estado: 'cancelada' })
      .eq('user_id', usuario.id)
      .eq('estado', 'activa');

    const profileUpdate = { membresia_activa: false, membresia_tipo: null, membresia_hasta: null };
    await supabase.from('user_profiles').update(profileUpdate).eq('id', usuario.id);

    setPlanActivo(null);
    setCelandoPlan(false);
    onUpdated({ ...usuario, ...profileUpdate });
  };

  const handleGuardarPermisos = async () => {
    setGuardandoPermisos(true);
    await supabase.from('user_profiles').update({ permisos_totales: permisos }).eq('id', usuario.id);
    setGuardandoPermisos(false);
    setSavedPermisos(true);
    onUpdated({ ...usuario, permisos_totales: permisos });
    setTimeout(() => setSavedPermisos(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#1D1D1B] border-l border-manso-cream/10 h-full overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-manso-cream/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-manso-cream/10 flex items-center justify-center">
              <User size={18} className="text-manso-cream/60" />
            </div>
            <div>
              <p className="text-sm font-black text-manso-cream leading-none mb-1">
                {usuario.display_name ?? 'Sin nombre'}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${NIVEL_BADGE[nivel]}`}>
                {NIVEL_LABEL[nivel]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors rounded-lg hover:bg-manso-cream/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info */}
        <div className="px-6 py-5 space-y-3 border-b border-manso-cream/10">
          <div className="flex items-center gap-2 text-manso-cream/60">
            <Mail size={13} />
            <span className="text-xs">{usuario.email}</span>
          </div>
          <div className="flex items-center gap-2 text-manso-cream/60">
            <Calendar size={13} />
            <span className="text-xs">
              Registrado el {new Date(usuario.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Perfil de artista */}
        {artista && (
          <div className="px-6 py-5 border-b border-manso-cream/10">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-terra mb-4">
              Perfil de artista
            </p>
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-manso-cream/5 border border-manso-cream/10">
              <div className="min-w-0">
                <p className="text-sm font-black text-manso-cream truncate">{artista.nombre}</p>
                <p className="text-[9px] text-manso-cream/40 uppercase tracking-widest mt-0.5">{artista.tipo ?? 'DJ'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/artistas/${artista.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream/60 hover:text-manso-cream transition-all"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={handleToggleArtista}
                  disabled={togglingArtista}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                    artista.active
                      ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {artista.active ? <><EyeOff size={11} /> Ocultar</> : <><Eye size={11} /> Publicar</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Membresía */}
        {usuario.role !== 'admin' && (
          <div className="px-6 py-5 border-b border-manso-cream/10">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-terra mb-4">
              Membresía
            </p>

            {planActivo && !asignando ? (
              <div className="space-y-3">
                {/* Plan activo */}
                <div className="p-4 rounded-xl bg-manso-terra/10 border border-manso-terra/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Crown size={13} className="text-manso-terra flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-manso-cream">{planActivo.nombre}</p>
                        <p className="text-[9px] text-manso-cream/40 uppercase tracking-widest mt-0.5">
                          {planActivo.categoria} · ${planActivo.precio.toLocaleString('es-AR')}/{planActivo.periodo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] text-manso-cream/40 uppercase tracking-widest">Vence</p>
                      <p className="text-xs font-black text-manso-terra">
                        {new Date(planActivo.vencimiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setAsignando(true); }}
                    className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl border border-manso-cream/20 text-manso-cream/60 hover:text-manso-cream hover:border-manso-cream/40 transition-all"
                  >
                    Cambiar plan
                  </button>
                  <button
                    onClick={handleCancelarPlan}
                    disabled={cancelandoPlan}
                    className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-50"
                  >
                    {cancelandoPlan ? 'Cancelando...' : 'Cancelar membresía'}
                  </button>
                </div>
              </div>
            ) : !asignando ? (
              <div className="space-y-3">
                <p className="text-xs text-manso-cream/30">Sin membresía activa</p>
                <button
                  onClick={() => setAsignando(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-manso-terra/10 border border-manso-terra/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-manso-terra hover:bg-manso-terra/20 transition-all"
                >
                  <Plus size={11} /> Asignar plan
                </button>
              </div>
            ) : null}

            {/* Form asignación */}
            {asignando && (
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 block mb-2">
                    Plan
                  </label>
                  <select
                    value={planSelId}
                    onChange={e => handlePlanSelect(e.target.value)}
                    className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-3 py-2 text-sm text-manso-cream focus:outline-none focus:border-manso-terra"
                  >
                    <option value="">Seleccioná un plan...</option>
                    {planes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — ${p.precio.toLocaleString('es-AR')}/{p.periodo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 block mb-2">
                    Vence el
                  </label>
                  <input
                    type="date"
                    value={vencimientoInput}
                    onChange={e => setVencimientoInput(e.target.value)}
                    className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-3 py-2 text-sm text-manso-cream focus:outline-none focus:border-manso-terra"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setAsignando(false); setPlanSelId(''); }}
                    className="flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl border border-manso-cream/10 text-manso-cream/40 hover:text-manso-cream transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAsignarPlan}
                    disabled={!planSelId || !vencimientoInput || guardandoPlan}
                    className="flex-1 py-2.5 bg-manso-terra text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-manso-terra/80 transition-all disabled:opacity-40"
                  >
                    {guardandoPlan ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Permisos */}
        {usuario.role !== 'admin' && (
          <div className="px-6 py-5 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-terra mb-5">
              Permisos
            </p>
            <p className="text-[9px] text-manso-cream/30 uppercase tracking-widest mb-4">
              Activa el acceso a streaming, tienda y perfil de artista
            </p>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold text-manso-cream">Permisos totales</span>
              <button
                onClick={() => setPermisos(!permisos)}
                className={`w-12 h-6 rounded-full transition-colors relative ${permisos ? 'bg-manso-olive' : 'bg-manso-cream/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${permisos ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <button
              onClick={handleGuardarPermisos}
              disabled={guardandoPermisos}
              className="w-full py-3 bg-manso-cream text-manso-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-manso-cream/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {guardandoPermisos ? (
                <div className="w-4 h-4 border-2 border-manso-black/30 border-t-manso-black rounded-full animate-spin" />
              ) : savedPermisos ? (
                <><CheckCircle size={14} /> Guardado</>
              ) : (
                'Guardar permisos'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
