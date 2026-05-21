import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/mansoadm/', '/api/', '/setup-about-us/'],
      },
    ],
    sitemap: 'https://manso.club/sitemap.xml',
  };
}
