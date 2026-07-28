'use client';

import Link from 'next/link';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { WHATSAPP_NUMBER } from '@/lib/constants';

export default function CheckoutFailurePage() {
  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex items-center px-6 sm:px-8 md:px-16 py-32">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-20 h-20 bg-manso-terra/15 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-10 h-10 text-manso-terra" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-manso-cream mb-4">
            El pago no se completó
          </h1>

          <p className="text-base text-manso-cream/60 mb-8 leading-relaxed">
            Mercado Pago no pudo procesar el pago. No se te cobró nada. Podés intentar con otro medio
            de pago o coordinar una transferencia con nosotros.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-3 bg-manso-terra text-manso-cream px-10 py-5 text-xs font-black uppercase tracking-widest hover:bg-manso-terra/80 transition-all rounded-full"
            >
              Intentar de nuevo
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-manso-cream/20 text-manso-cream px-10 py-5 text-xs font-black uppercase tracking-widest hover:bg-manso-cream/10 transition-all rounded-full"
            >
              <MessageCircle size={16} />
              Escribinos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
