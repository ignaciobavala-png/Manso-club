import { SITE_URL } from '@/lib/constants';
import { ORG_ID } from '@/lib/seo';
import { JsonLd } from './JsonLd';

// Sin SearchAction: apuntaba a /search, que el sitio no tiene.
export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        '@type': 'WebSite',
        name: 'Manso Club',
        url: SITE_URL,
        inLanguage: 'es-AR',
        publisher: { '@id': ORG_ID },
      }}
    />
  );
}
