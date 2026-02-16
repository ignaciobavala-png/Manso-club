'use client';

import { usePathname } from 'next/navigation';

interface AdaptiveSectionLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  customBg?: string; // Para casos especiales
  forceDark?: boolean; // Para forzar tema oscuro
  forceLight?: boolean; // Para forzar tema claro
}

export function AdaptiveSectionLayout({ 
  title, 
  subtitle, 
  children, 
  customBg,
  forceDark,
  forceLight 
}: AdaptiveSectionLayoutProps) {
  const pathname = usePathname();

  // Determinar el fondo y colores de texto según la ruta
  const getThemeConfig = () => {
    // Si se fuerza un tema, usarlo
    if (forceDark) {
      return {
        bg: customBg || 'bg-manso-black',
        titleColor: 'text-manso-cream',
        subtitleColor: 'text-manso-cream/60'
      };
    }
    
    if (forceLight) {
      return {
        bg: customBg || 'bg-white',
        titleColor: 'text-manso-black',
        subtitleColor: 'text-zinc-400'
      };
    }

    // Lógica automática según ruta
    if (pathname?.includes('/mansoadm')) {
      return {
        bg: customBg || 'bg-manso-black',
        titleColor: 'text-manso-cream',
        subtitleColor: 'text-manso-cream/60'
      };
    }

    if (pathname?.includes('/artistas')) {
      return {
        bg: customBg || 'bg-manso-black',
        titleColor: 'text-manso-cream',
        subtitleColor: 'text-manso-cream/60'
      };
    }

    if (pathname?.includes('/membresias')) {
      return {
        bg: customBg || 'bg-manso-black',
        titleColor: 'text-manso-cream',
        subtitleColor: 'text-manso-cream/60'
      };
    }

    if (pathname?.includes('/about')) {
      return {
        bg: customBg || 'bg-manso-cream',
        titleColor: 'text-manso-black',
        subtitleColor: 'text-zinc-600'
      };
    }

    // Por defecto: fondo blanco para agenda, tienda, etc.
    return {
      bg: customBg || 'bg-white',
      titleColor: 'text-manso-black',
      subtitleColor: 'text-zinc-400'
    };
  };

  const theme = getThemeConfig();

  return (
    <main className={`min-h-screen ${theme.bg} pt-32 pb-20 px-4 md:px-8 transition-colors duration-500`}>
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10">
          <h1 className={`text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none ${theme.titleColor}`}>
            {title}<span className="text-zinc-200">_</span>
          </h1>
          <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${theme.subtitleColor} mt-4 ml-2 italic`}>
            {subtitle}
          </p>
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </main>
  );
}
