import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { Talent } from './talent';

const BLOB_KEY = 'characters.json';
const JSON_FALLBACK = path.join(process.cwd(), 'data', 'characters.json');

function readLocalJson(): Talent[] {
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
  return JSON.parse(raw) as Talent[];
}

async function getBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: BLOB_KEY });
  return blobs[0]?.url ?? null;
}

export async function readCharacters(): Promise<Talent[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return readLocalJson();

  try {
    const url = await getBlobUrl();
    if (!url) {
      const seed = readLocalJson();
      await writeCharacters(seed);
      return seed;
    }
    const res = await fetch(url, { cache: 'no-store' });
    return res.json() as Promise<Talent[]>;
  } catch {
    return readLocalJson();
  }
}

export async function writeCharacters(characters: Talent[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    fs.writeFileSync(JSON_FALLBACK, JSON.stringify(characters, null, 2), 'utf-8');
    return;
  }
  // Delete old blob first to avoid accumulation
  const { blobs } = await list({ prefix: BLOB_KEY });
  await Promise.all(blobs.map((b) => del(b.url)));

  await put(BLOB_KEY, JSON.stringify(characters, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export function nextId(characters: Talent[]): number {
  return characters.length > 0 ? Math.max(...characters.map((c) => c.id)) + 1 : 1;
}
