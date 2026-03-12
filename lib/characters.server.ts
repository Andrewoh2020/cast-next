import { put, get } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { Talent } from './talent';

const BLOB_KEY = 'characters.json';
const JSON_FALLBACK = path.join(process.cwd(), 'data', 'characters.json');

function readLocalJson(): Talent[] {
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
  return JSON.parse(raw) as Talent[];
}

export async function readCharacters(): Promise<Talent[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return readLocalJson();

  try {
    const result = await get(BLOB_KEY, { access: 'private' });
    if (!result) {
      const seed = readLocalJson();
      await writeCharacters(seed);
      return seed;
    }
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as Talent[];
  } catch {
    return readLocalJson();
  }
}

export async function writeCharacters(characters: Talent[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    fs.writeFileSync(JSON_FALLBACK, JSON.stringify(characters, null, 2), 'utf-8');
    return;
  }
  await put(BLOB_KEY, JSON.stringify(characters, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export function nextId(characters: Talent[]): number {
  return characters.length > 0 ? Math.max(...characters.map((c) => c.id)) + 1 : 1;
}
