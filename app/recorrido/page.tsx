import type { Metadata } from 'next';
import { og } from '@/lib/seo';
import { RecorridoViaje } from '@/components/recorrido/RecorridoViaje';

const titulo = 'Recorrido | Manso Club';
const descripcion =
  'Un recorrido en primera persona por Manso Club, de la puerta de calle al balcón: el salón, la cabina, la escalera y el cowork.';

export const metadata: Metadata = {
  title: titulo,
  description: descripcion,
  openGraph: og({ title: titulo, description: descripcion }),
};

export default function RecorridoPage() {
  return (
    <main className="bg-manso-black text-manso-cream">
      {/* Sin JS no corre ningún observador: que el texto no quede invisible */}
      <noscript>
        <style>{`[data-item] article,[data-item]>div{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <RecorridoViaje />
    </main>
  );
}
