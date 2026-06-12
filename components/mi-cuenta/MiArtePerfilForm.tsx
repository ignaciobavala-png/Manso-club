'use client';

import { useState, useActionState } from 'react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { ArtistasTracksList } from '@/components/admin/ArtistasTracksList';
import { ArtistaFotosList } from '@/components/admin/ArtistaFotosList';
import { FormArtistaTrack } from '@/components/admin/FormArtistaTrack';
import { saveArtistaAction } from '@/app/mi-cuenta/actions';
import { User, Music, Globe, Plus, Trash2, Check, ExternalLink } from 'lucide-react';

interface Artista {
  id: string;
  nombre: string;
  slug: string;
  bio?: string | null;
  estilo?: string | null;
  tipo?: string | null;
  imagen_url?: string | null;
  soundcloud_url?: string | null;
  social_links?: { label: string; url: string }[] | null;
}

interface Props {
  artista: Artista | null;
}

export function MiArtePerfilForm({ artista: initialArtista }: Props) {
  const [artista, setArtista] = useState(initialArtista);
  const [imageKey, setImageKey] = useState(0);
  const [tracksRefresh, setTracksRefresh] = useState(0);
  const [fotosRefresh, setFotosRefresh] = useState(0);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [links, setLinks] = useState<{ label: string; url: string }[]>(
    Array.isArray(artista?.social_links) ? artista.social_links : []
  );
  const [formData, setFormData] = useState({
    nombre: artista?.nombre ?? '',
    bio: artista?.bio ?? '',
    estilo: artista?.estilo ?? '',
    tipo: artista?.tipo ?? 'DJ',
    imagen_url: artista?.imagen_url ?? '',
    soundcloud_url: artista?.soundcloud_url ?? '',
  });

  const [state, formAction, pending] = useActionState(
    async (_prev: any, fd: FormData) => {
      fd.set('social_links', JSON.stringify(links));
      if (artista?.id) fd.set('editing_id', artista.id);
      const result = await saveArtistaAction(_prev, fd);
      if (result?.success && result.artistaId) {
        setArtista(prev => ({
          ...(prev ?? { nombre: '', slug: '' }),
          ...formData,
          id: result.artistaId!,
          slug: result.slug ?? prev?.slug ?? '',
          social_links: links,
        }));
      }
      return result;
    },
    null
  );

  return (
    <div className="space-y-8">
      {/* Form perfil */}
      <div className="rounded-[28px] border border-manso-cream/10 bg-manso-cream/5 p-8">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-6">
          {artista ? 'Tu perfil de artista' : 'Crear perfil de artista'}
        </p>

        {state?.error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="mb-4 flex items-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-widest">
            <Check size={14} /> Guardado
          </div>
        )}

        {artista?.slug && (
          <a
            href={`/artistas/${artista.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-manso-cream/5 border border-manso-cream/10 hover:border-manso-terra/40 hover:bg-manso-terra/5 transition-all group"
          >
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra mb-0.5">Tu perfil público</p>
              <p className="text-manso-cream/50 text-xs font-mono">mansoclub.com.ar/artistas/{artista.slug}</p>
            </div>
            <ExternalLink size={14} className="text-manso-cream/30 group-hover:text-manso-terra transition-colors shrink-0" />
          </a>
        )}

        <form action={formAction} className="space-y-5">
          {/* Foto */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
              {formData.tipo === 'Artista Visual' ? 'Foto de perfil' : 'Foto'}
            </label>
            <ImageUploader
              key={imageKey}
              bucket="artist"
              folder="profiles"
              maxWidth={1200}
              initialPreview={formData.imagen_url || null}
              onUpload={(url) => setFormData(f => ({ ...f, imagen_url: url }))}
            />
            <input type="hidden" name="imagen_url" value={formData.imagen_url} />
          </div>

          {/* Nombre */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/40" size={16} />
            <input
              type="text"
              name="nombre"
              placeholder="Nombre artístico"
              value={formData.nombre}
              onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))}
              required
              className="w-full bg-manso-cream/10 p-4 pl-11 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-sm text-manso-cream placeholder:text-manso-cream/30 transition-all"
            />
          </div>

          {/* Tipo */}
          <select
            name="tipo"
            value={formData.tipo}
            onChange={e => setFormData(f => ({ ...f, tipo: e.target.value }))}
            className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-sm text-manso-cream"
          >
            <option value="DJ">DJ</option>
            <option value="Artista Visual">Artista Visual</option>
          </select>

          {/* Estilo */}
          <div className="relative">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/40" size={16} />
            <input
              type="text"
              name="estilo"
              placeholder="Estilo / Género (ej: Techno, House)"
              value={formData.estilo}
              onChange={e => setFormData(f => ({ ...f, estilo: e.target.value }))}
              className="w-full bg-manso-cream/10 p-4 pl-11 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-sm text-manso-cream placeholder:text-manso-cream/30 transition-all"
            />
          </div>

          {/* Bio */}
          <textarea
            name="bio"
            placeholder="Biografía"
            value={formData.bio}
            onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
            rows={4}
            className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-sm text-manso-cream placeholder:text-manso-cream/30 resize-none transition-all"
          />

          {/* SoundCloud — solo para DJs */}
          {formData.tipo !== 'Artista Visual' && (
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/40" size={16} />
              <input
                type="url"
                name="soundcloud_url"
                placeholder="https://soundcloud.com/tu-perfil"
                value={formData.soundcloud_url}
                onChange={e => setFormData(f => ({ ...f, soundcloud_url: e.target.value }))}
                className="w-full bg-manso-cream/10 p-4 pl-11 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/30 transition-all"
              />
            </div>
          )}

          {/* Links sociales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50">Links</p>
              <button
                type="button"
                onClick={() => setLinks(l => [...l, { label: '', url: '' }])}
                className="flex items-center gap-1 px-3 py-1.5 bg-manso-terra/20 border border-manso-terra/30 rounded-full text-manso-terra text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/30 transition-all"
              >
                <Plus size={11} /> Agregar
              </button>
            </div>
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={link.label}
                  onChange={e => setLinks(l => l.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  className="w-28 shrink-0 bg-manso-cream/10 px-3 py-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-sm text-manso-cream placeholder:text-manso-cream/30"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={link.url}
                  onChange={e => setLinks(l => l.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                  className="flex-1 bg-manso-cream/10 px-3 py-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/30"
                />
                <button
                  type="button"
                  onClick={() => setLinks(l => l.filter((_, j) => j !== i))}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {!artista?.id && formData.tipo === 'Artista Visual' && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-manso-cream/5 border border-manso-cream/10">
              <span className="text-manso-terra text-base leading-none mt-0.5">↓</span>
              <p className="text-[10px] text-manso-cream/50 leading-relaxed">
                Después de crear tu perfil podrás subir tu galería de obras.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-manso-terra text-manso-cream rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50"
          >
            {pending ? 'Guardando...' : artista ? 'Actualizar perfil' : 'Crear perfil'}
          </button>
        </form>
      </div>

      {/* Tracks y fotos — solo si ya tiene perfil creado */}
      {artista?.id && (
        <>
          {/* Artista Visual: galería primero, sin tracks */}
          {formData.tipo === 'Artista Visual' ? (
            <ArtistaFotosList
              artistaId={artista.id}
              artistaNombre={artista.nombre}
              refreshTrigger={fotosRefresh}
            />
          ) : (
            /* DJ: tracks primero, luego galería */
            <>
              <ArtistasTracksList
                artistaId={artista.id}
                artistaNombre={artista.nombre}
                onEditTrack={(track) => { setEditingTrack(track); setShowTrackForm(true); }}
                onNewTrack={() => { setEditingTrack(null); setShowTrackForm(true); }}
                refreshTrigger={tracksRefresh}
              />

              <ArtistaFotosList
                artistaId={artista.id}
                artistaNombre={artista.nombre}
                refreshTrigger={fotosRefresh}
              />

              {showTrackForm && (
                <FormArtistaTrack
                  artistaId={artista.id}
                  artistaNombre={artista.nombre}
                  track={editingTrack}
                  isOpen={showTrackForm}
                  onClose={() => { setShowTrackForm(false); setEditingTrack(null); }}
                  onSave={() => setTracksRefresh(n => n + 1)}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
