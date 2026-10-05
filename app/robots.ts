import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Lo privado de cada persona (cuenta, compras, tickets) no tiene nada que
        // hacer en un buscador.
        disallow: [
          '/mansoadm/',
          '/api/',
          '/setup-about-us/',
          '/mi-cuenta',
          '/checkout',
          '/ticket/',
          '/auth/',
          '/recuperar-contrasena',
          '/actualizar-contrasena',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
