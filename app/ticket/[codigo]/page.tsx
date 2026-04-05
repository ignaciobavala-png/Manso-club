import { notFound } from 'next/navigation';
import { createSupabaseAnon } from '../../../lib/supabase';
import QRCode from 'qrcode';
import Image from 'next/image';

interface TicketPageProps {
  params: {
    codigo: string;
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { codigo } = params;

  // Buscar ticket por código
  const supabase = createSupabaseAnon();
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      ordenes (
        created_at,
        total
      )
    `)
    .eq('codigo', codigo.toUpperCase())
    .single();

  if (error || !ticket) {
    notFound();
  }

  // Generar QR code
  const qrDataUrl = await QRCode.toDataURL(codigo, {
    width: 200,
    margin: 2,
    color: {
      dark: '#1D1D1B',
      light: '#F5E6D3',
    },
  });

  const fechaCompra = new Date(ticket.ordenes.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">
              Manso Club
            </h1>
            <p className="text-xs text-manso-cream/60 uppercase tracking-[0.3em]">
              Ticket Digital
            </p>
          </div>

          {/* Ticket Card */}
          <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8">
            {/* Ticket Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-manso-cream mb-1">
                  {ticket.evento_nombre}
                </h2>
                <p className="text-sm text-manso-cream/60">
                  {ticket.tipo === 'entrada' ? 'Entrada' : 
                   ticket.tipo === 'membresia' ? 'Membresía' : 'Producto'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                ticket.usado 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {ticket.usado ? 'Usado' : 'Válido'}
              </div>
            </div>

            {/* Ticket Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Columna Izquierda - Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-manso-cream/40 mb-1">
                    Nombre
                  </p>
                  <p className="text-sm text-manso-cream font-medium">
                    {ticket.nombre}
                  </p>
                </div>
                
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-manso-cream/40 mb-1">
                    Email
                  </p>
                  <p className="text-sm text-manso-cream font-medium">
                    {ticket.email}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-manso-cream/40 mb-1">
                    Fecha de Compra
                  </p>
                  <p className="text-sm text-manso-cream font-medium">
                    {fechaCompra}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-manso-cream/40 mb-1">
                    Total Pagado
                  </p>
                  <p className="text-sm text-manso-cream font-medium">
                    ${ticket.ordenes.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Columna Derecha - QR */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-manso-cream p-4 rounded-xl">
                  <Image 
                    src={qrDataUrl} 
                    alt={`QR Code for ticket ${codigo}`}
                    width={200}
                    height={200}
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-xs text-manso-cream/60 mt-3 text-center">
                  Código: {codigo}
                </p>
              </div>
            </div>

            {/* Código único destacado */}
            <div className="bg-manso-black/50 border border-manso-cream/20 rounded-xl p-4 mb-6">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-manso-cream/40 mb-2">
                  Código Único de Validación
                </p>
                <p className="text-2xl font-black text-manso-cream tracking-widest">
                  {codigo}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 items-center justify-center gap-2 px-6 py-3 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-white transition-all"
              >
                Imprimir Ticket
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/ticket/download/${codigo}`);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ticket-${codigo}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error descargando ticket:', error);
                    alert('Error al descargar el ticket');
                  }
                }}
                className="flex-1 items-center justify-center gap-2 px-6 py-3 bg-manso-cream/10 text-manso-cream border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-cream/20 transition-all"
              >
                Descargar como Imagen
              </button>
            </div>

            {/* Footer Info */}
            <div className="mt-6 pt-6 border-t border-manso-cream/10">
              <div className="text-center">
                <p className="text-xs text-manso-cream/40 mb-2">
                  Este ticket es válido para la entrada al evento.
                </p>
                <p className="text-xs text-manso-cream/40">
                  Presenta este código QR en la entrada para su validación.
                </p>
                <p className="text-[9px] text-manso-cream/20 mt-4">
                  Manso Club • www.manso.club
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: TicketPageProps) {
  const { codigo } = params;
  
  return {
    title: `Ticket ${codigo} - Manso Club`,
    description: `Ticket digital para eventos de Manso Club. Código: ${codigo}`,
  };
}
