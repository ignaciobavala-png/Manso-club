'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Image {
  id: string | number;
  src: string;
}

export function GalleryGrid({ images }: { images: Image[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border border-zinc-200 shadow-sm">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => setSelected(image.src)}
            className="group relative aspect-[4/3] overflow-hidden cursor-pointer outline-none transition-transform duration-300 ease-out active:scale-125 active:z-20 hover:scale-110 hover:z-10"
          >
            <img
              src={image.src}
              alt={`Manso Club`}
              className="w-full h-full object-cover transition-all duration-300 ease-out group-hover:brightness-110 group-active:brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300" />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelected(null)}
          >
            <X size={28} />
          </button>
          <img
            src={selected}
            alt="Manso Club"
            className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
