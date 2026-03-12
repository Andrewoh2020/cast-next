import { MetadataRoute } from 'next';
import { readSeo } from '@/lib/seo.server';
import { readCharacters } from '@/lib/characters.server';

export default function sitemap(): MetadataRoute.Sitemap {
  const seo = readSeo();
  const characters = readCharacters();
  const base = seo.canonicalUrl || 'https://cast-next-silk.vercel.app';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/#roster`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const characterRoutes: MetadataRoute.Sitemap = characters.map((c) => ({
    url: `${base}/talent/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...characterRoutes];
}
