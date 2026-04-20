import { MetadataRoute } from 'next';
import { readSeo } from '@/lib/seo.server';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await readSeo();
  const base = seo.canonicalUrl || 'https://www.castability.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/dashboard', '/api/', '/account', '/create', '/success', '/sign-in', '/sign-up', '/preview', '/workshop'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
