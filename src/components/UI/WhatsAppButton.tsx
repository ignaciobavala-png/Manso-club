import React from 'react';

export const WhatsAppButton: React.FC = () => {
  const WHATSAPP_NUMBER = "5491130232533"; // Recordá cambiar esto por el número real
  const MESSAGE = encodeURIComponent("Hola Manso Club, quería hacer una consulta...");
  
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-[90 group flex items-center justify-center"
      aria-label="Contactar por WhatsApp"
    >
      {/* Animación de pulso externa */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-20 animate-ping group-hover:animate-none"></span>

      {/* Tooltip lateral */}
      <span className="absolute right-20 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0">
        Contacto Directo_
      </span>

      {/* Círculo del Botón con el Logo Oficial */}
      <div className="relative bg-[#25D366] text-white p-4 rounded-full shadow-[0_10px_20px_rgba(37,211,102,0.3)] transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center">
        <svg 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.55 4.197 1.592 6.015L0 24l6.135-1.61a11.787 11.787 0 005.915 1.61h.004c6.635 0 12.05-5.414 12.05-12.05 0-3.212-1.25-6.232-3.52-8.51z"/>
        </svg>
      </div>
    </a>
  );
};