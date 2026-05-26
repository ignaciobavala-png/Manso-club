'use client';

import { useState } from 'react';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: conectar con backend/email service
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section className="py-10 md:py-14 px-4 sm:px-8 md:px-20 border-t border-black/10" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-manso-black">
            Newsletter<span className="text-manso-black/20">_</span>
          </h2>
          <p className="text-sm text-manso-black/50 mt-1">Recibí novedades, eventos y contenido exclusivo.</p>
        </div>

        {submitted ? (
          <p className="text-sm font-bold uppercase tracking-widest text-manso-black/60">¡Gracias! Te tenemos en cuenta.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-0 w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="flex-1 md:w-72 px-4 py-3 text-sm bg-white border border-manso-black/20 text-manso-black placeholder-manso-black/30 outline-none focus:border-manso-black transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-manso-black text-manso-cream text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors whitespace-nowrap"
            >
              Suscribirme
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
