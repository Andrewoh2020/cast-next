import { put, list } from '@vercel/blob';
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

async function getBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: BLOB_KEY });
  return blobs[0]?.url ?? null;
}

export async function readSeo(): Promise<SeoSettings> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return readLocalJson();

  try {
    const url = await getBlobUrl();
    if (!url) {
      const seed = readLocalJson();
      await writeSeo(seed);
      return seed;
    }
    const res = await fetch(url, { cache: 'no-store' });
    return res.json() as Promise<SeoSettings>;
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
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
