import { haySesionOrg, leerMapas, leerTareas, orgConfigurada } from '@/lib/org';
import { OrgLogin } from '@/components/org/OrgLogin';
import { OrgMapa } from '@/components/org/OrgMapa';

export const dynamic = 'force-dynamic';

export default async function OrgPage() {
  if (!orgConfigurada() || !(await haySesionOrg())) {
    return <OrgLogin cerrada={!orgConfigurada()} />;
  }
  const [mapas, tareas] = await Promise.all([leerMapas(), leerTareas()]);
  return <OrgMapa mapasIniciales={mapas} tareasIniciales={tareas} />;
}
