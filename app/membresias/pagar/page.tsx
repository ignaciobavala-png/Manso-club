import type { Metadata } from 'next';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { CopyButton } from './CopyButton';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { getBankConfig, datosParaTransferencia } from '@/lib/getBankConfig';

export const metadata: Metadata = {
  title: 'Pago de membresía | Manso Club',
  description: 'Instrucciones de pago para membresías de Manso Club.',
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ nombre?: string; precio?: string; periodo?: string }>;
}

export default async function PagarMembresia({ searchParams }: Props) {
  const { nombre, precio, periodo } = await searchParams;
  const bank = await getBankConfig();
  const datosBancarios = datosParaTransferencia(bank);

  const mensaje = encodeURIComponent(
    `Hola Manso Club! Quiero suscribirme a la membresía ${nombre || ''} ($${precio || ''}/${periodo || ''}). Adjunto comprobante de transferencia.`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`;

  return (
    <main className="relative min-h-screen bg-manso-black flex flex-col items-center justify-center px-6 py-20">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">

        <Link
          href="/membresias"
          className="inline-flex items-center gap-2 text-manso-cream/40 hover:text-manso-cream transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Membresías</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-terra mb-2">
            Suscripción
          </p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-manso-cream leading-none">
            {nombre || 'Membresía'}
          </h1>
          {precio && (
            <p className="text-2xl font-black text-manso-cream/60 mt-2">
              ${Number(precio).toLocaleString('es-AR')}
              {periodo && <span className="text-sm font-normal">/{periodo}</span>}
            </p>
          )}
        </div>

        {/* Datos bancarios — la tarjeta solo se dibuja si hay algo que copiar */}
        {datosBancarios.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/40 mb-4">
              Datos para transferencia
            </p>

            {datosBancarios.map(({ label, value }) => (
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

        {/* Instrucciones */}
        <p className="text-xs text-manso-cream/50 text-center mb-6 leading-relaxed">
          {datosBancarios.length > 0
            ? 'Realizá la transferencia y envianos el comprobante por WhatsApp para confirmar tu membresía.'
            : 'Escribinos por WhatsApp y te pasamos los datos para transferir.'}
        </p>

        {/* CTA WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
        >
          <MessageCircle size={16} />
          Enviar comprobante por WhatsApp
        </a>
      </div>
    </main>
  );
}
