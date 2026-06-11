'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { Play, Ticket, User, CreditCard, ArrowRight, Check, Lock, Tv, Calendar, Music, ShoppingBag, Palette } from 'lucide-react';
import { MiArtePerfilForm } from '@/components/mi-cuenta/MiArtePerfilForm';
import { updateProfileAction } from './actions';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Tab = 'membresia' | 'streaming' | 'tickets' | 'perfil' | 'miarte';

type Beneficio = { texto: string; incluido: boolean };
type Membresia = {
  nombre: string;
  precio: number;
  periodo: string;
  vencimiento: string;
  incluye_streaming: boolean;
  beneficios: Beneficio[];
} | null;

type Artista = {
  id: string;
  nombre: string;
  bio?: string | null;
  estilo?: string | null;
  tipo?: string | null;
  imagen_url?: string | null;
  soundcloud_url?: string | null;
  social_links?: { label: string; url: string }[] | null;
} | null;

type ContenidoItem = {
  id: string;
  titulo: string;
  slug: string;
  tipo: string;
  thumbnail_url: string | null;
};

type TicketItem = {
  id: string;
  codigo: string;
  evento_nombre: string | null;
  tipo: string;
  usado: boolean;
  created_at: string;
};

type Props = {
  userId: string;
  displayName: string;
  email: string;
  telefono: string | null;
  avatarUrl: string | null;
  membresia: Membresia;
  streaming: ContenidoItem[];
  tickets: TicketItem[];
  tieneMembresia: boolean;
  esMiembro: boolean;
  artista: Artista;
};

const BASE_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'membresia', label: 'Membresía',  icon: <CreditCard size={14} /> },
  { id: 'streaming', label: 'Streaming',  icon: <Play size={14} /> },
  { id: 'tickets',   label: 'Tickets',    icon: <Ticket size={14} /> },
  { id: 'perfil',    label: 'Perfil',     icon: <User size={14} /> },
];

export default function MiCuentaTabs({ userId, displayName, email, telefono, avatarUrl, membresia, streaming, tickets, tieneMembresia, esMiembro, artista }: Props) {
  const TABS = esMiembro
    ? [...BASE_TABS.slice(0, 3), { id: 'miarte' as Tab, label: 'Mi Arte', icon: <Palette size={14} /> }, BASE_TABS[3]]
    : BASE_TABS;

  const [tab, setTab] = useState<Tab>('membresia');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl);
  const router = useRouter();

  const initial = displayName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? '?';

  // Días restantes y progreso
  const diasRestantes = membresia
    ? Math.max(0, Math.ceil((new Date(membresia.vencimiento).getTime() - Date.now()) / 86_400_000))
    : 0;
  const progreso = Math.min(100, Math.round((diasRestantes / 30) * 100));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-manso-black">
      {/* ── HEADER ── */}
      <div
        className="relative pt-28 pb-10 px-6"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,220,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,220,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full flex-shrink-0 shadow-lg overflow-hidden">
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-manso-terra flex items-center justify-center text-3xl font-black text-white">
                {initial}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-1">
              Mi Cuenta
            </p>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
              {displayName}<span className="text-manso-cream/20">_</span>
            </h1>
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
              {membresia ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-manso-terra/20 border border-manso-terra/30 text-[9px] font-black uppercase tracking-widest text-manso-terra">
                  <span className="w-1.5 h-1.5 rounded-full bg-manso-terra animate-pulse" />
                  {membresia.nombre}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-manso-cream/10 text-[9px] font-black uppercase tracking-widest text-manso-cream/40">
                  Sin membresía
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── DESCUBRÍ MANSO ── */}
      <div className="max-w-3xl mx-auto px-6 pb-8">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-5">Descubrí Manso</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/streaming"
            className="group rounded-[20px] border border-manso-cream/10 bg-manso-cream/5 p-5 hover:border-manso-terra/40 hover:bg-manso-terra/5 transition-all"
          >
            <Tv size={20} className="text-manso-terra mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-manso-cream text-xs font-black uppercase tracking-tight">Manso Live</p>
            <p className="text-manso-cream/30 text-[9px] mt-1 leading-tight">El stream que no para</p>
          </Link>
          <Link
            href="/agenda"
            className="group rounded-[20px] border border-manso-cream/10 bg-manso-cream/5 p-5 hover:border-manso-terra/40 hover:bg-manso-terra/5 transition-all"
          >
            <Calendar size={20} className="text-manso-terra mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-manso-cream text-xs font-black uppercase tracking-tight">Agenda</p>
            <p className="text-manso-cream/30 text-[9px] mt-1 leading-tight">Próximos eventos</p>
          </Link>
          <Link
            href="/artistas"
            className="group rounded-[20px] border border-manso-cream/10 bg-manso-cream/5 p-5 hover:border-manso-terra/40 hover:bg-manso-terra/5 transition-all"
          >
            <Music size={20} className="text-manso-terra mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-manso-cream text-xs font-black uppercase tracking-tight">Artistas</p>
            <p className="text-manso-cream/30 text-[9px] mt-1 leading-tight">La comunidad Manso</p>
          </Link>
          <Link
            href="/tienda"
            className="group rounded-[20px] border border-manso-cream/10 bg-manso-cream/5 p-5 hover:border-manso-terra/40 hover:bg-manso-terra/5 transition-all"
          >
            <ShoppingBag size={20} className="text-manso-terra mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-manso-cream text-xs font-black uppercase tracking-tight">Tienda</p>
            <p className="text-manso-cream/30 text-[9px] mt-1 leading-tight">Merch oficial</p>
          </Link>
        </div>
        {!membresia && (
          <Link
            href="/membresias"
            className="mt-3 flex items-center justify-between p-5 rounded-[20px] bg-manso-terra/10 border border-manso-terra/30 hover:bg-manso-terra/20 transition-all"
          >
            <div>
              <p className="text-manso-terra text-xs font-black uppercase tracking-tight">Sumá la membresía</p>
              <p className="text-manso-cream/50 text-[9px] mt-0.5">Desbloqueá streaming exclusivo y más beneficios</p>
            </div>
            <ArrowRight size={14} className="text-manso-terra flex-shrink-0" />
          </Link>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="border-b border-manso-cream/10 bg-manso-black sticky top-16 z-20">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                tab === t.id
                  ? 'border-manso-terra text-manso-terra'
                  : 'border-transparent text-manso-cream/40 hover:text-manso-cream/70'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ────── MEMBRESÍA ────── */}
        {tab === 'membresia' && (
          <div className="space-y-6">
            {membresia ? (
              <>
                {/* Card principal */}
                <div className="rounded-[28px] border border-manso-terra/30 bg-manso-terra/10 p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-1">Plan activo</p>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight text-manso-cream">{membresia.nombre}</h2>
                      <p className="text-manso-cream/40 text-sm mt-1">
                        USD ${membresia.precio} / {membresia.periodo}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[9px] font-black uppercase tracking-widest">
                      Activa
                    </span>
                  </div>

                  {/* Progreso */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] text-manso-cream/40 uppercase tracking-widest font-black">Días restantes</span>
                      <span className="text-[9px] text-manso-cream/70 font-black">{diasRestantes} días</span>
                    </div>
                    <div className="w-full h-1.5 bg-manso-cream/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-manso-terra rounded-full transition-all duration-700"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-manso-cream/30 mt-1.5 uppercase tracking-widest">
                      Vence {new Date(membresia.vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Beneficios */}
                {membresia.beneficios.length > 0 && (
                  <div className="rounded-[28px] border border-manso-cream/10 p-8 bg-manso-cream/5">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-5">Beneficios incluidos</p>
                    <div className="space-y-3">
                      {membresia.beneficios.map((b, i) => (
                        <div key={i} className="flex items-start gap-3">
                          {b.incluido
                            ? <Check size={14} className="text-green-400 shrink-0 mt-0.5" />
                            : <Lock size={14} className="text-manso-cream/20 shrink-0 mt-0.5" />
                          }
                          <span className={`text-sm leading-snug ${b.incluido ? 'text-manso-cream/80' : 'text-manso-cream/25 line-through'}`}>
                            {b.texto}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href="/membresias"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-manso-cream/20 text-manso-cream/50 hover:border-manso-terra hover:text-manso-terra text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Ver otros planes
                  <ArrowRight size={12} />
                </Link>
              </>
            ) : (
              <div className="text-center py-16 rounded-[28px] border border-manso-cream/10 bg-manso-cream/5">
                <div className="w-14 h-14 rounded-full bg-manso-cream/10 flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={22} className="text-manso-cream/30" />
                </div>
                <p className="text-manso-cream font-black text-lg uppercase italic tracking-tight mb-2">Sin membresía activa</p>
                <p className="text-manso-cream/40 text-sm mb-8">Elegí un plan y accedé a todos los beneficios de Manso Club</p>
                <Link
                  href="/membresias"
                  className="inline-block px-8 py-4 bg-manso-terra text-manso-cream rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all"
                >
                  Ver membresías
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ────── STREAMING ────── */}
        {tab === 'streaming' && (
          <div className="space-y-6">
            {tieneMembresia ? (
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-manso-terra/10 border border-manso-terra/30">
                <span className="w-2 h-2 rounded-full bg-manso-terra animate-pulse flex-shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-manso-terra">
                  Tu membresía incluye acceso exclusivo al streaming
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-manso-cream/5 border border-manso-cream/10">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-manso-cream/30 flex-shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/50">
                    Tenés acceso al contenido general
                  </p>
                </div>
                <Link
                  href="/membresias"
                  className="text-[9px] font-black uppercase tracking-widest text-manso-terra whitespace-nowrap hover:underline"
                >
                  Ver membresías →
                </Link>
              </div>
            )}

            {streaming.length > 0 ? (
              <>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-4">Disponible para vos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {streaming.map(item => (
                      <Link
                        key={item.id}
                        href={`/streaming/${item.slug}`}
                        className="group rounded-[18px] overflow-hidden border border-manso-cream/10 hover:border-manso-cream/20 transition-all"
                      >
                        <div className="relative aspect-video bg-zinc-900">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play size={20} className="text-manso-cream/10" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <div className="w-8 h-8 rounded-full bg-manso-terra flex items-center justify-center">
                              <Play size={12} className="text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-manso-cream text-xs font-black uppercase tracking-tight line-clamp-1">{item.titulo}</p>
                          <p className="text-manso-cream/30 text-[9px] uppercase tracking-widest mt-0.5">{item.tipo}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <Link
                  href="/streaming"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-manso-cream/20 text-manso-cream/50 hover:border-manso-terra hover:text-manso-terra text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Ver biblioteca completa
                  <ArrowRight size={12} />
                </Link>
              </>
            ) : (
              <div className="text-center py-16 rounded-[28px] border border-manso-cream/10 bg-manso-cream/5">
                <Play size={32} className="text-manso-cream/10 mx-auto mb-4" />
                <p className="text-manso-cream/40 text-sm uppercase tracking-widest font-black">Próximamente</p>
              </div>
            )}
          </div>
        )}

        {/* ────── TICKETS ────── */}
        {tab === 'tickets' && (
          <div className="space-y-4">
            {tickets.length > 0 ? (
              <>
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-4">Tus entradas</p>
                {tickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between p-6 rounded-[20px] border border-manso-cream/10 bg-manso-cream/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-manso-cream/10 flex items-center justify-center flex-shrink-0">
                        <Ticket size={16} className="text-manso-cream/40" />
                      </div>
                      <div>
                        <p className="text-manso-cream font-black uppercase tracking-tight text-sm">
                          {ticket.evento_nombre ?? ticket.tipo}
                        </p>
                        <p className="text-manso-cream/30 text-[9px] uppercase tracking-widest font-black mt-0.5">
                          {new Date(ticket.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-manso-cream/40 text-[9px] font-black uppercase tracking-widest mb-1">
                        {ticket.codigo}
                      </p>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        ticket.usado
                          ? 'bg-zinc-800 text-manso-cream/30'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {ticket.usado ? 'Usado' : 'Válido'}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-16 rounded-[28px] border border-manso-cream/10 bg-manso-cream/5">
                <div className="w-14 h-14 rounded-full bg-manso-cream/10 flex items-center justify-center mx-auto mb-4">
                  <Ticket size={22} className="text-manso-cream/30" />
                </div>
                <p className="text-manso-cream font-black text-lg uppercase italic tracking-tight mb-2">Sin entradas</p>
                <p className="text-manso-cream/40 text-sm mb-8">Cuando comprés un ticket aparecerá acá</p>
                <Link
                  href="/agenda"
                  className="inline-block px-8 py-4 border border-manso-cream/20 text-manso-cream/50 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-manso-terra hover:text-manso-terra transition-all"
                >
                  Ver agenda
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ────── MI ARTE ────── */}
        {tab === 'miarte' && (
          <MiArtePerfilForm artista={artista} />
        )}

        {/* ────── PERFIL ────── */}
        {tab === 'perfil' && (
          <PerfilForm
            userId={userId}
            displayName={displayName}
            email={email}
            telefono={telefono}
            avatarUrl={currentAvatarUrl}
            onLogout={handleLogout}
            onAvatarUpdated={setCurrentAvatarUrl}
          />
        )}
      </div>
    </div>
  );
}

function PerfilForm({ userId, displayName, email, telefono, avatarUrl, onLogout, onAvatarUpdated }: {
  userId: string;
  displayName: string;
  email: string;
  telefono: string | null;
  avatarUrl: string | null;
  onLogout: () => void;
  onAvatarUpdated: (url: string) => void;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(avatarUrl);
  const initial = displayName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? '?';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      // Convertir a WebP
      const webp = await new Promise<File>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height, 400);
          canvas.width = size;
          canvas.height = size;
          const ox = (img.width - size) / 2;
          const oy = (img.height - size) / 2;
          ctx.drawImage(img, ox, oy, size, size, 0, 0, size, size);
          canvas.toBlob((blob) => {
            resolve(new File([blob!], 'avatar.webp', { type: 'image/webp' }));
          }, 'image/webp', 0.85);
        };
        img.src = URL.createObjectURL(file);
      });

      const path = `${userId}/avatar.webp`;
      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(path, webp, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatares').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;

      await supabase.from('user_profiles').update({ avatar_url: url }).eq('id', userId);
      setLocalAvatar(url);
      onAvatarUpdated(url);
    } catch (err) {
      console.error('Error subiendo avatar:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      {state?.success && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-widest">
          <Check size={14} />
          Cambios guardados
        </div>
      )}
      {state?.error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest">
          {state.error}
        </div>
      )}

      {/* Avatar upload */}
      <div className="rounded-[28px] border border-manso-cream/10 p-8 bg-manso-cream/5">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-6">Foto de perfil</p>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-manso-terra">
            {localAvatar ? (
              <img src={localAvatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                {initial}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <label className={`inline-block px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
              uploadingAvatar
                ? 'bg-manso-cream/10 text-manso-cream/30 cursor-not-allowed'
                : 'bg-manso-cream/10 text-manso-cream hover:bg-manso-cream/20'
            }`}>
              {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </label>
            <p className="text-[9px] text-manso-cream/30 mt-2">JPG, PNG o WebP. Se recorta en cuadrado.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-manso-cream/10 p-8 bg-manso-cream/5">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-6">Datos personales</p>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">Nombre</label>
            <input
              type="text"
              name="display_name"
              defaultValue={displayName}
              required
              className="w-full p-4 bg-manso-cream/10 border border-manso-cream/20 rounded-xl outline-none font-bold text-sm text-manso-cream placeholder:text-manso-cream/30 focus:ring-2 focus:ring-manso-terra transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              defaultValue={telefono ?? ''}
              placeholder="+54 9 11 0000 0000"
              className="w-full p-4 bg-manso-cream/10 border border-manso-cream/20 rounded-xl outline-none font-bold text-sm text-manso-cream placeholder:text-manso-cream/20 focus:ring-2 focus:ring-manso-terra transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full p-4 bg-manso-cream/5 border border-manso-cream/10 rounded-xl font-bold text-sm text-manso-cream/30 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full p-4 rounded-xl font-black uppercase tracking-widest text-xs bg-manso-terra text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {pending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <button
        onClick={onLogout}
        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-manso-cream/10 text-manso-cream/30 hover:border-red-500/40 hover:text-red-400 transition-all"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
