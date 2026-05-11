'use client';

import { usePathname } from 'next/navigation';
import { TYPE, OPACITY } from '@/lib/ui-constants';

interface AdaptiveSectionLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  customBg?: string;
  forceDark?: boolean;
  forceLight?: boolean;
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
        subtitleColor: 'text-manso-cream/60',
        isDark: true
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
    if (pathname?.includes('/mansoadm') || pathname?.includes('/artistas') || pathname?.includes('/membresias') || pathname?.includes('/tienda')) {
      return {
        bg: customBg || 'bg-manso-black',
        titleColor: 'text-manso-cream',
        subtitleColor: 'text-manso-cream/60',
        isDark: true
      };
    }

    if (pathname?.includes('/about')) {
      return {
        bg: customBg || 'bg-manso-cream',
        titleColor: 'text-manso-black',
        subtitleColor: 'text-manso-black/60'
      };
    }

    // Por defecto: fondo blanco para agenda, tienda, etc.
    return {
      bg: customBg || 'bg-manso-white',
      titleColor: 'text-manso-black',
      subtitleColor: 'text-manso-black/60'
    };
  };

  const theme = getThemeConfig();

  return (
    <main
      className={`min-h-screen ${theme.bg} pt-32 pb-20 px-4 md:px-8 transition-colors duration-500`}
      style={theme.bg.includes('black') ? {
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      } : undefined}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10">
          <h1 className={`${TYPE.h1} ${theme.titleColor}`}>
            {title}<span className="text-zinc-200 cursor-blink">_</span>
          </h1>
          <p className={`${TYPE.label} ${theme.subtitleColor} mt-4 ml-2 italic`}>
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
