'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Trash2, Upload } from 'lucide-react';
import { subirFoto } from '@/lib/subir-foto';
import { BOTON_ICONO } from './festivalComun';

interface Props {
  fotos: string[];
  /** Recibe la lista entera cada vez que cambia: subir, mover o quitar. */
  onChange: (fotos: string[]) => void;
  bucket?: string;
  folder?: string;
  maxLado?: number;
}

/**
 * Galería del panel: se suben varias fotos de una (el selector acepta muchas)
 * y se reordenan arrastrándolas o con las flechas, que son las que andan en
 * el celular (el arrastre nativo de HTML no funciona con el dedo).
 *
 * Las fotos se suben de a una y cada una se suma apenas termina, así que si
 * una falla las anteriores ya quedaron guardadas.
 */
export function GaleriaFotosAdmin({ fotos, onChange, bucket = 'flyers', folder, maxLado = 2000 }: Props) {
  const [subiendo, setSubiendo] = useState<{ hecho: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrastrada, setArrastrada] = useState<number | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);

  const subir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (archivos.length === 0) return;

    setError(null);
    let lista = fotos;
    const fallidas: string[] = [];
    for (let i = 0; i < archivos.length; i++) {
      setSubiendo({ hecho: i, total: archivos.length });
      try {
        const url = await subirFoto(archivos[i], { bucket, folder, maxLado });
        lista = [...lista, url];
        onChange(lista);
      } catch (err) {
        console.error('Error subiendo foto:', err);
        fallidas.push(archivos[i].name);
      }
    }
    setSubiendo(null);
    if (fallidas.length > 0) setError(`No se pudieron subir: ${fallidas.join(', ')}`);
  };

  const mover = (desde: number, hasta: number) => {
    if (desde === hasta || hasta < 0 || hasta >= fotos.length) return;
    const lista = [...fotos];
    const [foto] = lista.splice(desde, 1);
    lista.splice(hasta, 0, foto);
    onChange(lista);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fotos.map((url, i) => (
          <div
            key={`${i}-${url}`}
            draggable
            onDragStart={() => setArrastrada(i)}
            onDragOver={e => {
              e.preventDefault();
              setSobre(i);
            }}
            onDragLeave={() => setSobre(s => (s === i ? null : s))}
            onDrop={e => {
              e.preventDefault();
              if (arrastrada !== null) mover(arrastrada, i);
              setArrastrada(null);
              setSobre(null);
            }}
            onDragEnd={() => {
              setArrastrada(null);
              setSobre(null);
            }}
            className={`relative rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing transition ${
              sobre === i && arrastrada !== i ? 'border-manso-terra ring-2 ring-manso-terra/50' : 'border-manso-cream/10'
            } ${arrastrada === i ? 'opacity-40' : ''}`}
          >
            <img src={url} alt="" draggable={false} className="w-full h-28 object-cover pointer-events-none" />
            <span className="absolute top-1.5 left-1.5 px-1.5 rounded bg-black/70 text-[10px] font-black text-manso-cream">
              {i + 1}
            </span>
            <div className="absolute bottom-1.5 right-1.5 flex gap-1 bg-black/60 rounded-lg">
              <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0} className={BOTON_ICONO} title="Antes">
                <ArrowLeft size={13} />
              </button>
              <button type="button" onClick={() => mover(i, i + 1)} disabled={i === fotos.length - 1} className={BOTON_ICONO} title="Después">
                <ArrowRight size={13} />
              </button>
              <button type="button" onClick={() => onChange(fotos.filter((_, k) => k !== i))} className={`${BOTON_ICONO} hover:text-manso-terra`} title="Quitar">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        <label
          className={`flex flex-col items-center justify-center gap-1.5 h-28 border-2 border-dashed border-manso-cream/20 rounded-xl bg-manso-cream/5 hover:bg-manso-cream/10 hover:border-manso-cream/40 transition-all text-center px-2 ${
            subiendo ? 'cursor-wait' : 'cursor-pointer'
          }`}
        >
          {subiendo ? (
            <>
              <Loader2 size={16} className="text-manso-terra animate-spin" />
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                Subiendo {subiendo.hecho + 1} de {subiendo.total}
              </span>
            </>
          ) : (
            <>
              <Upload size={16} className="text-manso-cream/40" />
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">Sumar fotos</span>
            </>
          )}
          <input type="file" accept="image/*" multiple className="hidden" onChange={subir} disabled={Boolean(subiendo)} />
        </label>
      </div>
      {error && <p className="mt-2 text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
