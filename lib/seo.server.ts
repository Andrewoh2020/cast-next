import { put, get } from '@vercel/blob';
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

const BLOB_KEY = 'seo.json';
const JSON_FALLBACK = path.join(process.cwd(), 'data', 'seo.json');

function readLocalJson(): SeoSettings {
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
  return JSON.parse(raw) as SeoSettings;
}

export async function readSeo(): Promise<SeoSettings> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return readLocalJson();

  try {
    const result = await get(BLOB_KEY, { access: 'private' });
    if (!result) {
      const seed = readLocalJson();
      await writeSeo(seed);
      return seed;
    }
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as SeoSettings;
  } catch {
    return readLocalJson();
  }
}

export async function writeSeo(settings: SeoSettings): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    fs.writeFileSync(JSON_FALLBACK, JSON.stringify(settings, null, 2), 'utf-8');
    return;
  }
  await put(BLOB_KEY, JSON.stringify(settings, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
