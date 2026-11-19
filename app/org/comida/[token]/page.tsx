import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComidaPagina } from '@/components/org/ComidaPagina';
import { tokenComidaValido } from '@/lib/org';

// Pública pero sin nombre adivinable: solo abre con el código del link (404 si
// no). El layout de /org ya pone noindex y robots la tiene en el disallow.
export const metadata: Metadata = { title: 'Hospitality artistas · BLUR' };

export const dynamic = 'force-dynamic';

export default async function ComidaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenComidaValido(token)) notFound();
  return <ComidaPagina token={token} />;
}
