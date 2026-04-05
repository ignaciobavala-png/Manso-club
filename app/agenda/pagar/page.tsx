import { MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { CopyButton } from '@/app/membresias/pagar/CopyButton';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { getBankConfig } from '@/lib/getBankConfig';

interface Props {
  searchParams: Promise<{ titulo?: string; precio?: string; frecuencia?: string; categoria?: string }>;
}

export default async function PagarAgenda({ searchParams }: Props) {
  const { titulo, precio, frecuencia, categoria } = await searchParams;
  const bank = await getBankConfig();
  const esPago = precio && parseInt(precio) > 0;

  const mensaje = encodeURIComponent(
    esPago
      ? `Hola Manso Club! Me quiero inscribir en "${titulo || ''}" ($${precio}). Adjunto comprobante de transferencia.`
      : `Hola Manso Club! Me quiero inscribir en "${titulo || ''}". ¿Cómo procedo?`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`;

  return (
    <main className="relative min-h-screen bg-manso-black flex flex-col items-center justify-center px-6 py-20">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">

        <Link
          href="/agenda"
          className="inline-flex items-center gap-2 text-manso-cream/40 hover:text-manso-cream transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Agenda</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          {categoria && (
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-terra mb-2">
              {categoria}
            </p>
          )}
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-manso-cream leading-none">
            {titulo || 'Inscripción'}
          </h1>
          {frecuencia && (
            <p className="text-sm text-manso-cream/40 mt-2 font-light">{frecuencia}</p>
          )}
          {esPago && (
            <p className="text-2xl font-black text-manso-cream/60 mt-3">
              ${parseInt(precio).toLocaleString('es-AR')}
            </p>
          )}
        </div>

        {/* Instrucciones — antes de los datos bancarios */}
        <p className="text-base text-manso-cream/90 mb-6 leading-relaxed font-light">
          {esPago
            ? 'Realizá la transferencia y envianos el comprobante por WhatsApp para confirmar tu inscripción.'
            : 'Contactanos por WhatsApp para confirmar tu inscripción.'}
        </p>

        {/* Datos bancarios — solo si es pago */}
        {esPago && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/40 mb-4">
              Datos para transferencia
            </p>
            {[
              { label: 'Banco',   value: bank.banco_nombre  },
              { label: 'Titular', value: bank.banco_titular },
              { label: 'CUIT',    value: bank.banco_cuit    },
              { label: 'CBU',     value: bank.banco_cbu     },
              { label: 'Alias',   value: bank.banco_alias   },
            ].map(({ label, value }) => value && (
              <div key={label} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">{label}</p>
                  <p className="text-sm font-bold text-manso-cream font-mono truncate">{value}</p>
                </div>
                <CopyButton value={value} />
              </div>
            ))}
          </div>
        )}

        {/* CTA WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
        >
          <MessageCircle size={16} />
          {esPago ? 'Enviar comprobante por WhatsApp' : 'Inscribirme por WhatsApp'}
        </a>
      </div>
    </main>
  );
}
