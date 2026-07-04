'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CompactImageUploader } from './CompactImageUploader';
import { AUDIENCIAS, type Audiencia } from '@/lib/mailing-audiencias';
import { Image as ImageIcon, MousePointerClick, Type, Trash2, ArrowUp, ArrowDown, Plus, AlertCircle, CheckCircle } from 'lucide-react';

type BloqueImagen = { tipo: 'imagen'; url: string; alt: string };
type BloqueBoton = { tipo: 'boton'; texto: string; link: string; color: string };
type BloqueTexto = { tipo: 'texto'; contenido: string };
type Bloque = BloqueImagen | BloqueBoton | BloqueTexto;

interface Props {
  onSaved?: () => void;
}

export function FormMailingCampania({ onSaved }: Props) {
  const [asunto, setAsunto] = useState('');
  const [audiencia, setAudiencia] = useState<Audiencia>('newsletter');
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const agregarBloque = (tipo: Bloque['tipo']) => {
    if (tipo === 'imagen') setBloques([...bloques, { tipo: 'imagen', url: '', alt: '' }]);
    if (tipo === 'boton') setBloques([...bloques, { tipo: 'boton', texto: 'Ver más', link: 'https://mansoclub.com.ar', color: '#BC2915' }]);
    if (tipo === 'texto') setBloques([...bloques, { tipo: 'texto', contenido: '' }]);
  };

  const actualizarBloque = (i: number, patch: Partial<Bloque>) => {
    setBloques(bloques.map((b, idx) => (idx === i ? ({ ...b, ...patch } as Bloque) : b)));
  };

  const eliminarBloque = (i: number) => setBloques(bloques.filter((_, idx) => idx !== i));

  const moverBloque = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= bloques.length) return;
    const copia = [...bloques];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setBloques(copia);
  };

  const resetForm = () => {
    setAsunto('');
    setAudiencia('newsletter');
    setBloques([]);
  };

  const guardarBorrador = async () => {
    if (!asunto.trim()) {
      setErrorMsg('El asunto es obligatorio');
      return;
    }
    if (bloques.some((b) => b.tipo === 'imagen' && !b.url)) {
      setErrorMsg('Hay un bloque de imagen sin subir');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.from('mailing_campanias').insert([{ asunto, audiencia, bloques }]);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg('¡Borrador guardado!');
    setTimeout(() => setSuccessMsg(null), 3000);
    resetForm();
    onSaved?.();
  };

  return (
    <div className="bg-manso-cream/5 p-4 md:p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl space-y-5">
      <div>
        <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-manso-cream mb-1">
          Nueva Campaña
        </h2>
        <p className="text-xs text-manso-cream/60">
          Armá el mail con bloques de imagen, botón y texto — sin tocar código.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-400 text-xs">
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mb-1 block">
          Asunto
        </label>
        <input
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Ej: Nuevo evento este viernes"
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-2.5 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
        />
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mb-1 block">
          Audiencia
        </label>
        <select
          value={audiencia}
          onChange={(e) => setAudiencia(e.target.value as Audiencia)}
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-2.5 text-sm text-manso-cream focus:outline-none focus:border-manso-terra"
        >
          {AUDIENCIAS.map((a) => (
            <option key={a.id} value={a.id} className="bg-manso-black">
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 block">
          Bloques
        </label>

        {bloques.map((bloque, i) => (
          <div key={i} className="bg-manso-cream/5 border border-manso-cream/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50 flex items-center gap-1.5">
                {bloque.tipo === 'imagen' && <ImageIcon size={12} />}
                {bloque.tipo === 'boton' && <MousePointerClick size={12} />}
                {bloque.tipo === 'texto' && <Type size={12} />}
                {bloque.tipo}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moverBloque(i, -1)} disabled={i === 0} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => moverBloque(i, 1)} disabled={i === bloques.length - 1} className="p-1 text-manso-cream/40 hover:text-manso-cream disabled:opacity-20">
                  <ArrowDown size={12} />
                </button>
                <button onClick={() => eliminarBloque(i)} className="p-1 text-manso-cream/40 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {bloque.tipo === 'imagen' && (
              <div className="space-y-2">
                <CompactImageUploader bucket="emails" onUpload={(url) => actualizarBloque(i, { url })} height="h-24" />
                <input
                  value={bloque.alt}
                  onChange={(e) => actualizarBloque(i, { alt: e.target.value })}
                  placeholder="Texto alternativo (accesibilidad)"
                  className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
                />
              </div>
            )}

            {bloque.tipo === 'boton' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={bloque.texto}
                  onChange={(e) => actualizarBloque(i, { texto: e.target.value })}
                  placeholder="Texto del botón"
                  className="col-span-2 bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
                />
                <input
                  value={bloque.link}
                  onChange={(e) => actualizarBloque(i, { link: e.target.value })}
                  placeholder="Link (https://...)"
                  className="bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
                />
                <input
                  type="color"
                  value={bloque.color}
                  onChange={(e) => actualizarBloque(i, { color: e.target.value })}
                  className="h-full w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {bloque.tipo === 'texto' && (
              <textarea
                value={bloque.contenido}
                onChange={(e) => actualizarBloque(i, { contenido: e.target.value })}
                placeholder="Texto del párrafo"
                rows={3}
                className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-lg px-3 py-1.5 text-xs text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
              />
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <button onClick={() => agregarBloque('imagen')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/70 text-[9px] font-black uppercase tracking-widest transition-colors">
            <Plus size={12} /> Imagen
          </button>
          <button onClick={() => agregarBloque('boton')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/70 text-[9px] font-black uppercase tracking-widest transition-colors">
            <Plus size={12} /> Botón
          </button>
          <button onClick={() => agregarBloque('texto')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-manso-cream/5 hover:bg-manso-cream/10 text-manso-cream/70 text-[9px] font-black uppercase tracking-widest transition-colors">
            <Plus size={12} /> Texto
          </button>
        </div>
      </div>

      <button
        onClick={guardarBorrador}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-manso-terra text-manso-cream text-xs font-black uppercase tracking-widest hover:bg-manso-terra/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar borrador'}
      </button>
    </div>
  );
}
