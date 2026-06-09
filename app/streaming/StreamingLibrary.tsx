'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Lock, Wifi, Clock } from 'lucide-react';

type Contenido = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  tipo: 'concierto' | 'curso' | 'taller';
  thumbnail_url: string | null;
  is_live: boolean;
  scheduled_at: string | null;
  duracion_minutos: number | null;
  precio_individual: number;
  curso_id: string | null;
  orden: number;
};

type Categoria = {
  slug: string;
  nombre: string;
  color: string;
};

type Props = {
  contenido: Contenido[];
  tieneMembresia: boolean;
  compraIds: string[];
  categorias: Categoria[];
};

export default function StreamingLibrary({ contenido, tieneMembresia, compraIds, categorias }: Props) {
  const [filtro, setFiltro] = useState<string>('todo');

  const compraSet = new Set(compraIds);
  const colorMap = Object.fromEntries(categorias.map(c => [c.slug, c.color]));

  const tieneAcceso = (item: Contenido) =>
    tieneMembresia || compraSet.has(item.id);

  const filtrados = filtro === 'todo'
    ? contenido
    : contenido.filter(c => c.tipo === filtro);

  return (
    <div>
      {/* Membresía activa badge */}
      {tieneMembresia && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-manso-terra/20 border border-manso-terra/30 mb-8">
          <span className="w-2 h-2 rounded-full bg-manso-terra animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra">
            Acceso completo con membresía
          </span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-10 flex-wrap">
        <button
          onClick={() => setFiltro('todo')}
          className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
            filtro === 'todo'
              ? 'bg-manso-cream text-manso-black'
              : 'border border-manso-cream/20 text-manso-cream/50 hover:border-manso-cream/50 hover:text-manso-cream'
          }`}
        >
          Todo
        </button>
        {categorias.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setFiltro(cat.slug)}
            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              filtro === cat.slug
                ? 'bg-manso-cream text-manso-black'
                : 'border border-manso-cream/20 text-manso-cream/50 hover:border-manso-cream/50 hover:text-manso-cream'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Grid de contenido */}
      {filtrados.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-manso-cream/5 flex items-center justify-center mx-auto mb-4">
            <Play size={24} className="text-manso-cream/20" />
          </div>
          <p className="text-manso-cream/30 text-sm uppercase tracking-widest font-black">
            {contenido.length === 0 ? 'Próximamente' : 'Sin resultados en esta categoría'}
          </p>
          {contenido.length === 0 && (
            <p className="text-manso-cream/20 text-xs mt-2">
              Estamos preparando el contenido
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((item) => {
            const acceso = tieneAcceso(item);
            const esGratis = item.precio_individual === 0;

            return (
              <Link
                key={item.id}
                href={`/streaming/${item.slug}`}
                className="group flex flex-col rounded-[24px] overflow-hidden border border-manso-cream/10 bg-manso-cream/5 hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all duration-500"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <Play size={32} className="text-manso-cream/10" />
                    </div>
                  )}

                  {/* Overlay play */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${acceso ? 'bg-manso-terra' : 'bg-white/20'}`}>
                      {acceso ? <Play size={18} className="text-white fill-white ml-1" /> : <Lock size={16} className="text-white" />}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {item.is_live && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-[8px] font-black uppercase tracking-widest">
                        <Wifi size={8} />
                        Live
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${colorMap[item.tipo] ?? 'bg-zinc-700 text-white'}`}>
                      {categorias.find(c => c.slug === item.tipo)?.nombre ?? item.tipo}
                    </span>
                  </div>

                  {/* Lock si no tiene acceso */}
                  {!acceso && (
                    <div className="absolute top-3 right-3">
                      <span className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                        <Lock size={12} className="text-white" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-manso-cream font-black uppercase tracking-tight leading-tight mb-2 line-clamp-2">
                    {item.titulo}
                  </h3>

                  {item.descripcion && (
                    <p className="text-manso-cream/40 text-xs leading-relaxed mb-3 line-clamp-2">
                      {item.descripcion}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    {/* Duración */}
                    {item.duracion_minutos && (
                      <span className="flex items-center gap-1 text-[9px] text-manso-cream/30 uppercase tracking-widest">
                        <Clock size={10} />
                        {item.duracion_minutos} min
                      </span>
                    )}

                    {/* Precio / acceso */}
                    <div className="ml-auto">
                      {acceso ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-manso-terra">
                          ✓ Tenés acceso
                        </span>
                      ) : esGratis ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                          Solo membresía
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/70">
                          USD ${item.precio_individual}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CTA membresía si no tiene acceso */}
      {!tieneMembresia && contenido.length > 0 && (
        <div className="mt-16 p-8 rounded-[30px] border border-manso-cream/10 bg-manso-cream/5 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
            Acceso completo
          </p>
          <p className="text-manso-cream font-black text-xl uppercase tracking-tight mb-2">
            Desbloqueá todo el contenido
          </p>
          <p className="text-manso-cream/40 text-sm mb-6">
            Con una membresía activa tenés acceso a todos los cursos y conciertos
          </p>
          <Link
            href="/membresias"
            className="inline-block px-8 py-4 bg-manso-terra text-manso-cream rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95"
          >
            Ver membresías
          </Link>
        </div>
      )}
    </div>
  );
}
