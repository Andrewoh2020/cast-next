import fs from 'fs';
import path from 'path';

export interface SeoSettings {
  siteTitle: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  twitterHandle: string;
  googleAnalyticsId: string;
}

const SEO_FILE = path.join(process.cwd(), 'data', 'seo.json');

export function readSeo(): SeoSettings {
  const raw = fs.readFileSync(SEO_FILE, 'utf-8');
  return JSON.parse(raw) as SeoSettings;
}

export function writeSeo(settings: SeoSettings): void {
  fs.writeFileSync(SEO_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}
