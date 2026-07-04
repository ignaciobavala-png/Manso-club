'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text?: string;
  /** Ruta relativa (ej: `/artistas/slug`) o URL absoluta. Por defecto usa la URL actual. */
  url?: string;
  className?: string;
  label?: string;
}

const DEFAULT_CLASS =
  'flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all';

export function ShareButton({ title, text, url, className, label = 'Compartir' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url ? new URL(url, window.location.origin).toString() : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // usuario canceló el share nativo — no hacer nada
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard no disponible — no hacer nada
    }
  };

  return (
    <button type="button" onClick={handleShare} className={className || DEFAULT_CLASS}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      <span className="text-xs font-medium">{copied ? 'Copiado' : label}</span>
    </button>
  );
}
