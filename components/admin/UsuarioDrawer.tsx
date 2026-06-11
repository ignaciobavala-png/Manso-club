'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Crown, User, Mail, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

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

export function UsuarioDrawer({ usuario, onClose, onUpdated }: UsuarioDrawerProps) {
  const [activa, setActiva] = useState(usuario.membresia_activa);
  const [tipo, setTipo] = useState(usuario.membresia_tipo ?? 'mensual');
  const [hasta, setHasta] = useState(
    usuario.membresia_hasta ? usuario.membresia_hasta.split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const nivel = getNivel(usuario);

  const handleSave = async () => {
    setSaving(true);
    const payload: Partial<UserProfile> = {
      membresia_activa: activa,
      membresia_tipo: activa ? tipo : null,
      membresia_hasta: activa && tipo !== 'vitalicio' && hasta ? hasta : null,
    };

    const { error } = await supabase
      .from('user_profiles')
      .update(payload)
      .eq('id', usuario.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      onUpdated({ ...usuario, ...payload } as UserProfile);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
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
          {usuario.membresia_hasta && (
            <div className="flex items-center gap-2 text-manso-cream/60">
              <Clock size={13} />
              <span className="text-xs">
                Membresía hasta {new Date(usuario.membresia_hasta).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Form membresía */}
        {usuario.role !== 'admin' && (
          <div className="px-6 py-5 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-terra mb-5">
              Membresía
            </p>

            {/* Toggle activa */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-manso-cream">Membresía activa</span>
              <button
                onClick={() => setActiva(!activa)}
                className={`w-12 h-6 rounded-full transition-colors relative ${activa ? 'bg-manso-terra' : 'bg-manso-cream/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${activa ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {activa && (
              <div className="space-y-4">
                {/* Tipo */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 block mb-2">
                    Tipo
                  </label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                    className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-3 py-2 text-sm text-manso-cream focus:outline-none focus:border-manso-terra"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                    <option value="vitalicio">Vitalicio</option>
                    <option value="promo">Promo</option>
                  </select>
                </div>

                {/* Fecha hasta (solo si no es vitalicio) */}
                {tipo !== 'vitalicio' && (
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 block mb-2">
                      Vence el
                    </label>
                    <input
                      type="date"
                      value={hasta}
                      onChange={e => setHasta(e.target.value)}
                      className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-3 py-2 text-sm text-manso-cream focus:outline-none focus:border-manso-terra"
                    />
                  </div>
                )}
                {tipo === 'vitalicio' && (
                  <p className="text-[9px] text-manso-cream/30 uppercase tracking-widest">
                    Sin fecha de vencimiento
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Guardar */}
        {usuario.role !== 'admin' && (
          <div className="px-6 py-5 border-t border-manso-cream/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-manso-cream text-manso-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-manso-cream/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-manso-black/30 border-t-manso-black rounded-full animate-spin" />
              ) : saved ? (
                <><CheckCircle size={14} /> Guardado</>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
