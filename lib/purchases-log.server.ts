import { put, get } from '@vercel/blob';

const BLOB_KEY = 'purchases-log.json';

export interface PurchaseLogEntry {
  characterId: number;
  characterName: string;
  licenseName: string;
  amount: number;
  purchasedAt: string;
}

async function readLog(): Promise<PurchaseLogEntry[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const result = await get(BLOB_KEY, { access: 'private', useCache: false });
    if (!result || !result.stream) return [];
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as PurchaseLogEntry[];
  } catch {
    return [];
  }
}

async function writeLog(entries: PurchaseLogEntry[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(BLOB_KEY, JSON.stringify(entries, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function appendPurchaseLog(entry: PurchaseLogEntry): Promise<void> {
  const log = await readLog();
  await writeLog([...log, entry]);
}

export async function getPurchasesLog(): Promise<PurchaseLogEntry[]> {
  return readLog();
}
