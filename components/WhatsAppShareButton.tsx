import { SITE_URL } from '@/lib/constants';

interface WhatsAppShareButtonProps {
  title: string;
  /** Ruta relativa (ej: `/agenda/slug`). Se manda con el dominio oficial. */
  path: string;
  label?: string;
  className?: string;
}

const DEFAULT_CLASS =
  'flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.37A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.3 14.98l-.3-.19-3.08.81.82-3-.2-.31A8.1 8.1 0 0 1 12.04 3.8Zm-3.2 4.2c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.76 2.8 4.34 3.81 2.15.85 2.58.68 3.05.64.47-.04 1.5-.61 1.71-1.2.21-.6.21-1.1.15-1.2-.06-.11-.23-.17-.48-.3-.25-.12-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.12-.17.25-.65.82-.8.99-.15.17-.3.19-.55.06-.25-.12-1.07-.4-2.03-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.4-.78-1.9-.2-.5-.4-.43-.57-.44h-.48Z" />
  </svg>
);

/**
 * Abre WhatsApp con el mensaje ya armado. El link sale con el dominio oficial
 * y no con `window.location`, así que sirve igual desde un preview de Vercel.
 * La imagen de la vista previa no se manda acá: la toma WhatsApp de la página
 * (og:image), por eso cada ruta compartible define la suya.
 */
export function WhatsAppShareButton({ title, path, label = 'WhatsApp', className }: WhatsAppShareButtonProps) {
  const texto = `${title}\n${SITE_URL}${path}`;
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Compartir ${title} por WhatsApp`}
      className={className || DEFAULT_CLASS}
    >
      <WhatsAppIcon />
      {label && <span className="text-xs font-medium">{label}</span>}
    </a>
  );
}
