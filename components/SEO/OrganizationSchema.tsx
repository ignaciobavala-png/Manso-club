export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Manso Club',
    url: 'https://manso.club',
    logo: 'https://manso.club/manso-logo-black.png',
    sameAs: [
      'https://www.instagram.com/manso___club/',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Cdad. de la Paz 601',
      addressLocality: 'Buenos Aires',
      addressCountry: 'AR',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
