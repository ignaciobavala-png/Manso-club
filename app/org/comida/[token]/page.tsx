import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Inter_Tight, Courier_Prime } from 'next/font/google';
import { FormComida } from '@/components/org/FormComida';
import { tokenComidaValido } from '@/lib/org';
import '../comida.css';

const cuerpo = Inter_Tight({ subsets: ['latin'], variable: '--font-comida-cuerpo' });
const mono = Courier_Prime({ subsets: ['latin'], weight: '400', variable: '--font-comida-mono' });

// Pública pero sin nombre adivinable: solo abre con el código del link (404 si
// no). El layout de /org ya pone noindex y robots la tiene en el disallow.
export const metadata: Metadata = { title: 'Comida · Organización BLUR' };

export const dynamic = 'force-dynamic';

export default async function ComidaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenComidaValido(token)) notFound();
  return (
    <div className={`comida ${cuerpo.variable} ${mono.variable}`}>
      <div className="portada">
        <Image src="/org/comida-portada.jpg" alt="Vista aérea de la isla en el Delta" fill priority sizes="100vw" />
        <div className="portada-in">
          <Image src="/org/comida-logo.png" alt="BLUR" width={380} height={65} className="logo" priority />
          <div className="mono">Sábado 12.12.2026 · Una isla en el Delta · 14:00 — 04:00</div>
        </div>
      </div>
      <main>
        <header>
          <div className="kicker mono">Organización · Comida</div>
          <h2>¿Qué querés comer?</h2>
          <p>Completalo una sola vez. Si te equivocás, volvé a cargarlo con el mismo nombre y se actualiza.</p>
        </header>
        <FormComida token={token} />
        <div className="pie">
          <Image src="/org/comida-pie.jpg" alt="BLUR · Sáb 12-12 · 2PM-4AM · Delta, Tigre" width={1080} height={441} sizes="720px" />
        </div>
        <footer className="mono"><span>BLUR Festival · Manso Club</span><span>12.12.2026 · Delta, Buenos Aires</span></footer>
      </main>
    </div>
  );
}
