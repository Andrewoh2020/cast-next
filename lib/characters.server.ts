import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';
import { Talent } from './talent';

const KV_KEY = 'characters';
const JSON_FALLBACK = path.join(process.cwd(), 'data', 'characters.json');

function readLocalJson(): Talent[] {
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
  return JSON.parse(raw) as Talent[];
}

export async function readCharacters(): Promise<Talent[]> {
  // In local dev without KV configured, fall back to JSON file
  if (!process.env.KV_REST_API_URL) {
    return readLocalJson();
  }
  const data = await kv.get<Talent[]>(KV_KEY);
  if (!data) {
    // First run: seed from local JSON and persist to KV
    const seed = readLocalJson();
    await kv.set(KV_KEY, seed);
    return seed;
  }
  return data;
}

export async function writeCharacters(characters: Talent[]): Promise<void> {
  if (!process.env.KV_REST_API_URL) {
    fs.writeFileSync(JSON_FALLBACK, JSON.stringify(characters, null, 2), 'utf-8');
    return;
  }
  await kv.set(KV_KEY, characters);
}

export function nextId(characters: Talent[]): number {
  return characters.length > 0 ? Math.max(...characters.map((c) => c.id)) + 1 : 1;
}
