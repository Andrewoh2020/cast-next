import { put, get } from '@vercel/blob';

export interface PurchaseRecord {
  characterId: number;
  characterName: string;
  characterSlug: string;
  characterImg: string;
  licenseName: string;
  licensePrice: string;
  purchasedAt: string;
  referenceSheetUrl?: string;
}

export interface UserData {
  favorites: number[]; // character IDs
  purchases: PurchaseRecord[];
}

function userKey(userId: string, file: string) {
  return `users/${userId}/${file}`;
}

async function readUserBlob<T>(pathname: string, fallback: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;
  try {
    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode === 304 || !result.stream) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeUserBlob(pathname: string, data: unknown): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getUserData(userId: string): Promise<UserData> {
  return readUserBlob<UserData>(userKey(userId, 'data.json'), { favorites: [], purchases: [] });
}

export async function toggleFavorite(userId: string, characterId: number): Promise<number[]> {
  const data = await getUserData(userId);
  const already = data.favorites.includes(characterId);
  const next = already
    ? data.favorites.filter((id) => id !== characterId)
    : [...data.favorites, characterId];
  await writeUserBlob(userKey(userId, 'data.json'), { ...data, favorites: next });
  return next;
}

export async function recordPurchase(userId: string, purchase: PurchaseRecord): Promise<void> {
  const data = await getUserData(userId);
  const updated = [purchase, ...data.purchases];
  await writeUserBlob(userKey(userId, 'data.json'), { ...data, purchases: updated });
}
