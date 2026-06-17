'use client';

import { useState, useEffect } from 'react';
import { getSiteConfig } from '@/lib/siteConfig';
import { Search, Eye } from 'lucide-react';

interface SiteConfigListProps {
  refreshTrigger?: number;
}

export function SiteConfigList({ refreshTrigger }: SiteConfigListProps) {
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const config = await getSiteConfig();
        setSeoTitle(config.seo_title?.value ?? '');
        setSeoDescription(config.seo_description?.value ?? '');
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
        <div className="flex items-center justify-center py-12">
          <div className="text-manso-cream/60">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
      <div className="flex items-center gap-3 mb-6">
        <Search className="text-manso-terra" size={20} />
        <h3 className="text-xl font-black uppercase tracking-tighter text-manso-cream">
          Así aparece en Google
        </h3>
      </div>

      {/* Preview estilo Google */}
      <div className="bg-white rounded-2xl p-5 border border-manso-cream/10">
        <p className="text-[#1a0dab] text-lg font-medium leading-tight">
          {seoTitle || 'Manso Club | Cowork Creativo & Talleres en Buenos Aires'}
        </p>
        <p className="text-[#006621] text-xs mt-0.5">manso.club</p>
        <p className="text-[#545454] text-sm mt-1 leading-snug">
          {seoDescription || 'Ideal para freelancers, emprendedores, startups, trabajadores remotos, estudiantes y artistas que busquen un lugar creativo de pertenencia.'}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-4 text-manso-cream/30">
        <Eye size={12} />
        <p className="text-xs">Editá estos valores con el formulario de la izquierda.</p>
      </div>
    </div>
  );
}
