'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { WHATSAPP_NUMBER } from '@/lib/constants';

type Resultado = 'verificando' | 'aprobado' | 'confirmando' | 'no_aprobado' | 'desconocido';

function formatArs(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const clearCart = useCart((state) => state.clearCart);

  const pedidoId = searchParams.get('external_reference');
  const statusMP = searchParams.get('status') || searchParams.get('collection_status');

  const [resultado, setResultado] = useState<Resultado>('verificando');
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    // Sin referencia de pedido no hay nada que confirmar: esta pantalla no debe
    // dar por aprobado un pago solo porque alguien abrió la URL.
    if (!pedidoId) {
      setResultado('desconocido');
      return;
    }

    clearCart();

    let cancelado = false;
    let intentos = 0;

    const consultar = async () => {
      try {
        const res = await fetch(`/api/pedido-estado?id=${encodeURIComponent(pedidoId)}`);
        if (!res.ok) throw new Error('No se pudo consultar el pedido');

        const data = await res.json();
        if (cancelado) return;

        if (typeof data.total === 'number') setTotal(data.total);

        if (data.estado === 'pagado') {
          setResultado('aprobado');
          return;
        }

        if (data.estado === 'cancelado') {
          setResultado('no_aprobado');
          return;
        }

        // El webhook de Mercado Pago puede tardar unos segundos en llegar, así
        // que se reintenta antes de mostrar un estado intermedio.
        intentos += 1;
        if (intentos < 4) {
          setTimeout(consultar, 2000);
        } else {
          setResultado(statusMP === 'approved' ? 'confirmando' : 'no_aprobado');
        }
      } catch {
        if (!cancelado) setResultado(statusMP === 'approved' ? 'confirmando' : 'desconocido');
      }
    };

    consultar();
    return () => {
      cancelado = true;
    };
  }, [pedidoId, statusMP, clearCart]);

  const contenido = {
    verificando: {
      icono: (
        <div className="w-10 h-10 border-2 border-manso-cream/20 border-t-manso-terra rounded-full animate-spin" />
      ),
      fondo: 'bg-manso-cream/5',
      titulo: 'Confirmando tu pago',
      texto: 'Estamos verificando el pago con Mercado Pago. Esto puede tardar unos segundos.',
    },
    aprobado: {
      icono: <CheckCircle className="w-10 h-10 text-manso-olive" />,
      fondo: 'bg-manso-olive/20',
      titulo: '¡Pago confirmado!',
      texto: 'Recibimos tu pago. Te vamos a escribir para coordinar el envío de tu pedido.',
    },
    confirmando: {
      icono: <Clock className="w-10 h-10 text-manso-olive" />,
      fondo: 'bg-manso-olive/20',
      titulo: 'Pago recibido',
      texto:
        'Mercado Pago nos informó que el pago salió bien y estamos terminando de acreditarlo. Te confirmamos por WhatsApp en breve.',
    },
    no_aprobado: {
      icono: <AlertCircle className="w-10 h-10 text-manso-terra" />,
      fondo: 'bg-manso-terra/15',
      titulo: 'Todavía no pudimos confirmar el pago',
      texto:
        'No nos figura el pago acreditado. Si creés que ya pagaste, escribinos por WhatsApp y lo verificamos con vos.',
    },
    desconocido: {
      icono: <AlertCircle className="w-10 h-10 text-manso-cream/40" />,
      fondo: 'bg-manso-cream/5',
      titulo: 'No encontramos el pedido',
      texto:
        'No pudimos identificar a qué compra corresponde esta página. Si hiciste un pago, escribinos y lo revisamos.',
    },
  }[resultado];

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex items-center px-6 sm:px-8 md:px-16 py-32">
        <div className="max-w-xl mx-auto text-center">
          <div className={`w-20 h-20 ${contenido.fondo} rounded-full flex items-center justify-center mx-auto mb-8`}>
            {contenido.icono}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-manso-cream mb-4">
            {contenido.titulo}
          </h1>

          <p className="text-base text-manso-cream/60 mb-6 leading-relaxed">{contenido.texto}</p>

          {total !== null && resultado !== 'desconocido' && (
            <div className="inline-flex items-center gap-3 bg-manso-cream/5 border border-manso-cream/15 rounded-2xl px-6 py-3 mb-8">
              <span className="text-[10px] uppercase tracking-widest text-manso-cream/40 font-black">
                Total
              </span>
              <span className="text-lg font-black text-manso-cream">{formatArs(total)}</span>
            </div>
          )}

          {pedidoId && (
            <p className="text-xs text-manso-cream/30 mb-8 font-mono">Pedido #{pedidoId.slice(0, 8)}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-3 bg-manso-terra text-manso-cream px-10 py-5 text-xs font-black uppercase tracking-widest hover:bg-manso-terra/80 transition-all rounded-full"
            >
              Volver a la Tienda
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-manso-black flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-manso-cream/20 border-t-manso-terra rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
