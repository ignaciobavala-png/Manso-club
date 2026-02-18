'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Ticket, ArrowLeft, ExternalLink } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ordenData, setOrdenData] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    // Obtener parámetros de URL de forma segura
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    const preferenceId = params.get('preference_id');
    const externalReference = params.get('external_reference');

    if (!paymentId || !externalReference) {
      router.push('/checkout/failure');
      return;
    }

    const fetchOrderData = async () => {
      try {
        // Obtener datos de la orden
        const response = await fetch(`/api/orden/${externalReference}`);
        if (response.ok) {
          const data = await response.json();
          setOrdenData(data.orden);
          setTickets(data.tickets || []);
        }
      } catch (error) {
        console.error('Error obteniendo datos de la orden:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-manso-cream mx-auto mb-4"></div>
            <p className="text-manso-cream/60">Procesando tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-400" size={40} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-sm text-manso-cream/60">
              Tu compra ha sido procesada correctamente
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-manso-cream mb-4">
              Detalles de la Compra
            </h2>
            
            {ordenData && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Orden #{ordenData.id}</span>
                  <span className="text-sm text-manso-cream font-medium">
                    ${ordenData.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Comprador</span>
                  <span className="text-sm text-manso-cream">{ordenData.nombre}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Email</span>
                  <span className="text-sm text-manso-cream">{ordenData.email}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Fecha</span>
                  <span className="text-sm text-manso-cream">
                    {new Date(ordenData.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tickets */}
          {tickets.length > 0 && (
            <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 mb-6">
              <h2 className="text-xl font-bold text-manso-cream mb-4 flex items-center gap-2">
                <Ticket size={24} />
                Tus Tickets
              </h2>
              
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.codigo} className="flex items-center justify-between p-3 bg-manso-black/30 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-manso-cream">
                        {ticket.evento_nombre}
                      </p>
                      <p className="text-xs text-manso-cream/60">
                        Código: {ticket.codigo}
                      </p>
                    </div>
                    
                    <a
                      href={`/ticket/${ticket.codigo}`}
                      target="_blank"
                      className="flex items-center gap-2 px-3 py-2 bg-manso-cream/10 text-manso-cream border border-manso-cream/20 rounded-lg text-xs font-medium hover:bg-manso-cream/20 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Ver Ticket
                    </a>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <p className="text-xs text-blue-400">
                  📧 Hemos enviado tus tickets a tu email. También puedes acceder a ellos desde los enlaces de arriba.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-white transition-all"
            >
              <ArrowLeft size={16} />
              Volver al Inicio
            </button>
            
            {tickets.length > 0 && (
              <button
                onClick={() => window.open(`/ticket/${tickets[0].codigo}`, '_blank')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-manso-cream/10 text-manso-cream border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-cream/20 transition-all"
              >
                <Ticket size={16} />
                Ver Tickets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
