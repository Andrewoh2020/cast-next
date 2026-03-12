import { MetadataRoute } from 'next';
import { readSeo } from '@/lib/seo.server';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await readSeo();
  const base = seo.canonicalUrl || 'https://cast-next-silk.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/dashboard', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
