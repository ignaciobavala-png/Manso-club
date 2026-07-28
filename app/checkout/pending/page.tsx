'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Clock, MessageCircle } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { WHATSAPP_NUMBER } from '@/lib/constants';

export default function CheckoutPendingPage() {
  const clearCart = useCart((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-white py-12 px-6 sm:px-8 md:px-20 flex items-center">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-20 h-20 bg-manso-olive/15 rounded-full flex items-center justify-center mx-auto mb-8">
          <Clock className="w-10 h-10 text-manso-olive" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-manso-black mb-4">
          Pago en proceso
        </h1>

        <p className="text-base text-zinc-600 mb-8 leading-relaxed">
          Mercado Pago todavía está procesando tu pago. Puede tardar hasta 48 horas según el medio
          que hayas elegido. Te avisamos apenas se acredite.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center gap-3 bg-manso-black text-manso-cream px-10 py-5 text-xs font-black uppercase tracking-widest hover:bg-manso-brown transition-all rounded-full"
          >
            Volver a la Tienda
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border-2 border-zinc-200 text-zinc-600 px-10 py-5 text-xs font-black uppercase tracking-widest hover:border-manso-olive hover:text-manso-olive transition-all rounded-full"
          >
            <MessageCircle size={16} />
            Consultar
          </a>
        </div>
      </div>
    </div>
  );
}
