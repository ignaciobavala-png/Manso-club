'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Youtube, Film, Image as ImageIcon, ExternalLink, Lock } from 'lucide-react';
import { VideoUploader } from './VideoUploader';
import { ImageUploader } from './ImageUploader';
import { VisibilidadToggle } from './VisibilidadToggle';

const inputCls = "w-full p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-manso-cream/50 mb-1";

const TIPOS = [
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'video', label: 'Video', icon: Film },
  { value: 'imagen', label: 'Foto', icon: ImageIcon },
] as const;

type Tipo = (typeof TIPOS)[number]['value'];

export function FormMultimedia() {
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<Tipo>('youtube');
  const [titulo, setTitulo] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [archivoUrl, setArchivoUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [visibilidad, setVisibilidad] = useState<'publico' | 'registrado' | 'miembro'>('publico');
  const [permitirYoutube, setPermitirYoutube] = useState(false);

  const resetForm = () => {
    setTitulo('');
    setYoutubeUrl('');
    setArchivoUrl('');
    setDescripcion('');
    setPermitirYoutube(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) return;
    setLoading(true);

    const { data: max } = await supabase
      .from('multimedia_videos')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1);

    const orden = (max?.[0]?.orden || 0) + 1;

    const payload: Record<string, unknown> = {
      titulo,
      descripcion: descripcion || null,
      tipo,
      orden,
      active: true,
      visibilidad,
    };

    if (tipo === 'youtube') {
      payload.youtube_url = youtubeUrl;
      payload.archivo_url = null;
      payload.permitir_youtube = permitirYoutube;
    } else {
      payload.youtube_url = null;
      payload.archivo_url = archivoUrl;
      payload.permitir_youtube = false;
    }

    const { error } = await supabase.from('multimedia_videos').insert(payload);

    if (error) {
      alert(error.message);
    } else {
      alert('¡Contenido agregado!');
      resetForm();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    }
    setLoading(false);
  };

  const canSubmit = titulo && (tipo === 'youtube' ? youtubeUrl : archivoUrl);

  return (
    <div className="bg-manso-cream/5 p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-1">
          Nuevo Contenido
        </h2>
        <p className="text-xs text-manso-cream/50">Agregá un video o imagen a la sección Multimedia</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de tipo */}
        <div>
          <label className={labelCls}>Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setTipo(value); setArchivoUrl(''); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-bold uppercase tracking-wider ${
                  tipo === value
                    ? 'bg-manso-terra/20 border-manso-terra text-manso-cream'
                    : 'bg-manso-cream/5 border-manso-cream/10 text-manso-cream/50 hover:border-manso-cream/30'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className={labelCls}>Título</label>
          <input type="text" placeholder="Nombre del contenido" className={inputCls}
            value={titulo} onChange={e => setTitulo(e.target.value)} required />
        </div>

        {/* URL de YouTube */}
        {tipo === 'youtube' && (
          <div>
            <label className={labelCls}>URL de YouTube</label>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" size={16} />
              <input type="url" placeholder="https://youtube.com/watch?v=..." className={`${inputCls} pl-9`}
                value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} required />
            </div>
          </div>
        )}

        {/* Toggle: permitir link a YouTube */}
        {tipo === 'youtube' && (
          <div>
            <label className={labelCls}>Comportamiento del reproductor</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPermitirYoutube(false)}
                className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-bold uppercase tracking-wider ${
                  !permitirYoutube
                    ? 'bg-manso-terra/20 border-manso-terra text-manso-cream'
                    : 'bg-manso-cream/5 border-manso-cream/10 text-manso-cream/50 hover:border-manso-cream/30'
                }`}
              >
                <Lock size={14} /> Bloqueado
              </button>
              <button
                type="button"
                onClick={() => setPermitirYoutube(true)}
                className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-bold uppercase tracking-wider ${
                  permitirYoutube
                    ? 'bg-manso-terra/20 border-manso-terra text-manso-cream'
                    : 'bg-manso-cream/5 border-manso-cream/10 text-manso-cream/50 hover:border-manso-cream/30'
                }`}
              >
                <ExternalLink size={14} /> Lleva a YouTube
              </button>
            </div>
            <p className="text-[10px] text-manso-cream/40 mt-1.5">
              &quot;Bloqueado&quot; mantiene al usuario en la página. &quot;Lleva a YouTube&quot; muestra los controles nativos y permite ir al canal.
            </p>
          </div>
        )}

        {/* Upload de video */}
        {tipo === 'video' && (
          <div>
            <label className={labelCls}>Archivo de video</label>
            <VideoUploader
              bucket="multimedia"
              folder="videos"
              onUpload={(url) => setArchivoUrl(url)}
            />
          </div>
        )}

        {/* Upload de imagen */}
        {tipo === 'imagen' && (
          <div>
            <label className={labelCls}>Archivo de imagen</label>
            <ImageUploader
              bucket="multimedia"
              folder="imagenes"
              onUpload={(url) => setArchivoUrl(url)}
            />
          </div>
        )}

        {/* Visibilidad */}
        <VisibilidadToggle value={visibilidad} onChange={setVisibilidad} />

        {/* Descripción */}
        <div>
          <label className={labelCls}>Descripción (opcional)</label>
          <textarea rows={2} placeholder="Contexto del contenido..." className={`${inputCls} resize-none`}
            value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </div>

        <button type="submit" disabled={loading || !canSubmit}
          className="w-full bg-manso-terra text-manso-cream py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm">
          {loading ? 'Agregando...' : 'Agregar'}
        </button>
      </form>
    </div>
  );
}
