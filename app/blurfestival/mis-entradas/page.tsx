import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig } from '@/lib/festival';
import { createSupabaseAnon } from '@/lib/supabase';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { leerTextos } from '@/lib/festival-idioma-servidor';
import { EscribeTexto } from '@/components/festival/Escribe';
import { DECO, SeccionMarca } from '@/components/festival/SeccionMarca';
import { MisEntradasForm } from '@/components/festival/MisEntradasForm';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await leerTextos();
  // Es una herramienta de quien ya compró: no tiene nada que hacer en un buscador.
  return { title: t.misEntradas.titulo, robots: { index: false, follow: false } };
}

export default async function MisEntradas() {
  const [config, { t }] = await Promise.all([leerConfig(), leerTextos()]);
  if (!config) notFound();
  const { data } = await createSupabaseAnon().from('checkout_config').select('value').eq('key', 'whatsapp_numero').maybeSingle();
  const whatsapp = (data?.value as string | undefined)?.replace(/\D/g, '') || WHATSAPP_NUMBER;

  return (
    <SeccionMarca tema="crema" deco={DECO.tickets} className="flex-1 px-4 sm:px-7 pt-6 sm:pt-10 pb-[34vw] sm:pb-24 fest-entra">
      <div className="w-full max-w-[620px] mx-auto">
        <p className="fest-rotulo mb-8">
          <EscribeTexto texto={t.misEntradas.titulo} />
        </p>
        <MisEntradasForm whatsapp={whatsapp} />
      </div>
    </SeccionMarca>
  );
}
