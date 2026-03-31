import { put, get } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { Talent, PriceOption } from './talent';

const DEFAULT_PRICES: PriceOption[] = [
  { name: 'Single Project', price: '$50', amount: 50 },
  { name: 'Studio License', price: '$250', amount: 250 },
  { name: 'Exclusive Rights', price: '$1000', amount: 1000 },
];

// Ensure every character has all standard license tiers.
// Preserves any custom pricing already set; fills in defaults for missing tiers.
// Respects exclusiveDisabled flag — characters marked as such will not have Exclusive Rights offered.
function normalizePrices(characters: Talent[]): Talent[] {
  return characters.map((c) => {
    const tiers = c.exclusiveDisabled
      ? DEFAULT_PRICES.filter((d) => d.name !== 'Exclusive Rights')
      : DEFAULT_PRICES;
    return {
      ...c,
      prices: tiers.map((def) => c.prices.find((p) => p.name === def.name) ?? def),
    };
  });
}

const BLOB_KEY = 'characters.json';
const JSON_FALLBACK = path.join(process.cwd(), 'data', 'characters.json');

function readLocalJson(): Talent[] {
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
  return JSON.parse(raw) as Talent[];
}

export async function readCharacters(): Promise<Talent[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return normalizePrices(readLocalJson());

  try {
    const result = await get(BLOB_KEY, { access: 'private', useCache: false });
    if (!result || result.statusCode === 304 || !result.stream) {
      const seed = readLocalJson();
      await writeCharacters(seed);
      return normalizePrices(seed);
    }
    const text = await new Response(result.stream).text();
    return normalizePrices(JSON.parse(text) as Talent[]);
  } catch (err) {
    console.error('[characters.server] Blob read failed, using local fallback:', err);
    return normalizePrices(readLocalJson());
  }
}

export async function writeCharacters(characters: Talent[]): Promise<void> {
  // Update local JSON when possible (fails on read-only filesystems like Vercel)
  try {
    fs.writeFileSync(JSON_FALLBACK, JSON.stringify(characters, null, 2), 'utf-8');
  } catch {}

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_KEY, JSON.stringify(characters, null, 2), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }
}

export async function readVisibleCharacters(): Promise<Talent[]> {
  const all = await readCharacters();
  return all.filter((c) => !c.hidden);
}

export function nextId(characters: Talent[]): number {
  return characters.length > 0 ? Math.max(...characters.map((c) => c.id)) + 1 : 1;
}
