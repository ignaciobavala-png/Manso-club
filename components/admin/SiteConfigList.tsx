'use client';

import { useState, useEffect } from 'react';
import { getSiteConfig, setSiteConfigVisibility } from '@/lib/siteConfig';
import { Settings, Eye, EyeOff, Edit3 } from 'lucide-react';

interface SiteConfigListProps {
  refreshTrigger?: number;
}

export function SiteConfigList({ refreshTrigger }: SiteConfigListProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [refreshTrigger]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const siteConfig = await getSiteConfig();
      setConfig(siteConfig);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (key: string) => {
    try {
      const currentVisible = config[key]?.visible ?? true;
      await setSiteConfigVisibility(key, !currentVisible);
      
      // Actualizar estado local
      setConfig(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          visible: !currentVisible
        }
      }));
    } catch (error) {
      console.error('Error actualizando visibilidad:', error);
    }
  };

  // Agrupar configuraciones por categorías
  const groupedConfig = {
    títulos: {
      title: 'Títulos Principales',
      icon: Settings,
      keys: ['porque_titulo', 'porque_subtitulo'],
      color: 'text-manso-terra'
    },
    beneficios: {
      title: 'Cards de Beneficios',
      icon: Settings,
      keys: [
        'beneficio1_titulo', 'beneficio1_descripcion',
        'beneficio2_titulo', 'beneficio2_descripcion',
        'beneficio3_titulo', 'beneficio3_descripcion',
        'beneficio4_titulo', 'beneficio4_descripcion'
      ],
      color: 'text-manso-terra'
    },
    adicional: {
      title: 'Contenido Adicional',
      icon: Settings,
      keys: ['porque_main_text'],
      color: 'text-manso-terra'
    }
  };

  if (loading) {
    return (
      <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
        <div className="flex items-center justify-center py-12">
          <div className="text-manso-cream/60">Cargando configuración...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="text-manso-terra" size={24} />
          <h3 className="text-xl font-black uppercase tracking-tighter text-manso-cream">
            Configuración del Sitio
          </h3>
        </div>
        <div className="flex items-center gap-2 text-manso-cream/60">
          <Eye size={16} />
          <span className="text-sm font-medium">
            {Object.keys(config).length} valores configurados
          </span>
        </div>
      </div>

      {/* Grupos de configuración */}
      <div className="space-y-8">
        {Object.entries(groupedConfig).map(([groupKey, group]) => {
          const IconComponent = group.icon;
          const groupValues = group.keys
            .filter(key => config[key]?.value)
            .map(key => ({ 
              key, 
              value: config[key].value, 
              visible: config[key].visible 
            }));

          if (groupValues.length === 0) return null;

          return (
            <div key={groupKey} className="bg-manso-cream/3 rounded-2xl p-6 border border-manso-cream/10">
              <div className="flex items-center gap-3 mb-4">
                <IconComponent size={20} className={group.color} />
                <h4 className="text-lg font-bold text-manso-cream">
                  {group.title}
                </h4>
                <span className="text-xs text-manso-cream/40 bg-manso-cream/10 px-2 py-1 rounded-lg">
                  {groupValues.length} activos
                </span>
              </div>

              <div className="space-y-3">
                {groupValues.map(({ key, value, visible }) => (
                  <div 
                    key={key} 
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                      visible 
                        ? 'bg-manso-black/20 border border-manso-cream/10' 
                        : 'bg-manso-black/10 border border-manso-cream/5 opacity-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-manso-cream/40 bg-manso-cream/10 px-2 py-1 rounded">
                          {key}
                        </span>
                        <Edit3 size={12} className="text-manso-cream/40" />
                        <button
                          onClick={() => toggleVisibility(key)}
                          className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                            visible
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                          title={visible ? 'Ocultar' : 'Mostrar'}
                        >
                          {visible ? <Eye size={10} /> : <EyeOff size={10} />}
                          {visible ? 'Visible' : 'Oculto'}
                        </button>
                      </div>
                      <p className="text-sm text-manso-cream/80 leading-relaxed">
                        {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen general */}
      <div className="mt-8 pt-6 border-t border-manso-cream/10">
        <div className="bg-manso-black/30 rounded-2xl p-6 text-center">
          <h4 className="text-sm font-bold uppercase tracking-widest text-manso-cream/60 mb-3">
            Vista Previa de la Sección
          </h4>
          <div className="bg-manso-black/50 rounded-xl p-4 border border-manso-cream/10">
            <h5 className="text-lg font-bold text-white mb-2">
              {config.porque_titulo?.visible ? config.porque_titulo.value : 'Why Manso'}
            </h5>
            <p className="text-sm text-white/60 mb-4">
              {config.porque_subtitulo?.visible ? config.porque_subtitulo.value : 'More than just a workspace...'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[1, 2, 3, 4].map(num => {
                const tituloKey = `beneficio${num}_titulo`;
                const tituloConfig = config[tituloKey];
                return tituloConfig?.visible ? (
                  <div key={num} className="bg-manso-cream/10 rounded-lg p-2 text-left">
                    <div className="font-bold text-manso-cream">
                      {tituloConfig.value}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 text-center">
        <p className="text-xs text-manso-cream/40">
          Usa el formulario de la izquierda para editar estos valores
        </p>
      </div>
    </div>
  );
}
