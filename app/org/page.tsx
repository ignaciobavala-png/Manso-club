import { haySesionOrg, leerComida, tokenComida, leerMapas, leerTareas, orgConfigurada } from '@/lib/org';
import { OrgLogin } from '@/components/org/OrgLogin';
import { OrgMapa } from '@/components/org/OrgMapa';

export const dynamic = 'force-dynamic';

export default async function OrgPage() {
  if (!orgConfigurada() || !(await haySesionOrg())) {
    return <OrgLogin cerrada={!orgConfigurada()} />;
  }
  const [mapas, tareas, comida] = await Promise.all([leerMapas(), leerTareas(), leerComida()]);
  return <OrgMapa mapasIniciales={mapas} tareasIniciales={tareas} comidaInicial={comida} tokensComida={{ artistas: tokenComida('artistas'), charlas: tokenComida('charlas'), staff: tokenComida('staff') }} />;
}
