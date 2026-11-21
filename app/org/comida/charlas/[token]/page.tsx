import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComidaPagina } from '@/components/org/ComidaPagina';
import { COMIDA_TIPOS, tokenComidaValido } from '@/lib/org';

// Mismo formulario que el de artistas (/org/comida/<código>) con su propio
// código: el del otro formulario no abre este.
export const metadata: Metadata = { title: `${COMIDA_TIPOS.charlas.titulo} · BLUR` };

export const dynamic = 'force-dynamic';

export default async function ComidaCharlasPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenComidaValido(token, 'charlas')) notFound();
  return <ComidaPagina token={token} tipo="charlas" />;
}
