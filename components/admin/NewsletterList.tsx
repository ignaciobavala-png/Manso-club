'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Download } from 'lucide-react';

interface Suscriptor {
  id: string;
  email: string;
  created_at: string;
}

export function NewsletterList() {
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('newsletter_suscriptores')
        .select('*')
        .order('created_at', { ascending: false });
      setSuscriptores(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const exportCSV = () => {
    const rows = ['email,fecha', ...suscriptores.map(s =>
      `${s.email},${new Date(s.created_at).toLocaleDateString('es-AR')}`
    )];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-manso-cream/5 rounded-[2rem] border border-manso-cream/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-manso-cream/40" />
          <h3 className="text-sm font-black uppercase tracking-widest text-manso-cream">
            Suscriptores ({suscriptores.length})
          </h3>
        </div>
        {suscriptores.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-manso-cream/30 uppercase tracking-widest">Cargando...</p>
      ) : suscriptores.length === 0 ? (
        <p className="text-xs text-manso-cream/30 uppercase tracking-widest">Sin suscriptores aún</p>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {suscriptores.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-manso-cream/5">
              <span className="text-sm text-manso-cream/80">{s.email}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30">
                {new Date(s.created_at).toLocaleDateString('es-AR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
