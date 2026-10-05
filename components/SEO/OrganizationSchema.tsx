import { SITE_URL } from '@/lib/constants';
import { LUGAR, ORG_ID } from '@/lib/seo';
import { JsonLd } from './JsonLd';

/**
 * Manso como lugar físico (LocalBusiness) y no solo como marca: es lo que
 * Google usa para el mapa y las búsquedas "cerca de mí". Los horarios no van
 * porque no están cargados en ningún lado; mejor ninguno que uno inventado.
 */
export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        '@type': 'LocalBusiness',
        '@id': ORG_ID,
        name: 'Manso Club',
        description:
          'Club creativo en Colegiales, Buenos Aires: cowork durante la semana y espacio cultural con talleres, música, arte y encuentros los fines de semana.',
        url: SITE_URL,
        logo: `${SITE_URL}/manso-logo-black.png`,
        image: `${SITE_URL}/og-image.png`,
        telephone: LUGAR.whatsapp,
        sameAs: [LUGAR.instagram],
        address: {
          '@type': 'PostalAddress',
          streetAddress: LUGAR.calle,
          postalCode: LUGAR.codigoPostal,
          addressLocality: LUGAR.ciudad,
          addressRegion: 'CABA',
          addressCountry: LUGAR.pais,
        },
        areaServed: `${LUGAR.barrio}, ${LUGAR.ciudad}`,
        knowsAbout: ['cowork', 'talleres', 'música electrónica', 'arte', 'comunidad creativa'],
      }}
    />
  );
}
