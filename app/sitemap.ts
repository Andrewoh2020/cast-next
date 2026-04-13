import { MetadataRoute } from 'next';
import { readSeo } from '@/lib/seo.server';
import { readVisibleCharacters } from '@/lib/characters.server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, characters] = await Promise.all([readSeo(), readVisibleCharacters()]);
  const base = seo.canonicalUrl || 'https://www.castability.ai';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/license-terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/copyright-faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/launches`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/blog/character-consistency-ai-video`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  const characterRoutes: MetadataRoute.Sitemap = characters.map((c) => ({
    url: `${base}/characters/${c.slug}`,
    lastModified: c.createdAt ? new Date(c.createdAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...characterRoutes];
}
