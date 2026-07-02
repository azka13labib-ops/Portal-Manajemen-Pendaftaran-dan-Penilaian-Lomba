import { MetadataRoute } from 'next';

const BASE_URL = 'https://portallomba.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/events/', '/auth/login', '/auth/register'],
        disallow: ['/admin/', '/judge/', '/participant/', '/api/', '/workspace/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
