import { kv } from '@vercel/kv';
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

const KV_KEY = 'seo';
const JSON_FALLBACK = path.join(process.cwd(), 'data', 'seo.json');

function readLocalJson(): SeoSettings {
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
  return JSON.parse(raw) as SeoSettings;
}

export async function readSeo(): Promise<SeoSettings> {
  if (!process.env.KV_REST_API_URL) {
    return readLocalJson();
  }
  const data = await kv.get<SeoSettings>(KV_KEY);
  if (!data) {
    const seed = readLocalJson();
    await kv.set(KV_KEY, seed);
    return seed;
  }
  return data;
}

export async function writeSeo(settings: SeoSettings): Promise<void> {
  if (!process.env.KV_REST_API_URL) {
    fs.writeFileSync(JSON_FALLBACK, JSON.stringify(settings, null, 2), 'utf-8');
    return;
  }
  await kv.set(KV_KEY, settings);
}
