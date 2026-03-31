import { put, get } from '@vercel/blob';
import { appendPurchaseLog } from './purchases-log.server';

export interface PurchaseRecord {
  characterId: number;
  characterName: string;
  characterSlug: string;
  characterImg: string;
  licenseName: string;
  licensePrice: string;
  purchasedAt: string;
  referenceSheetUrl?: string;
  sessionId?: string;
}

export interface CreditPurchaseRecord {
  credits: number;
  amount: number; // USD cents
  purchasedAt: string;
  sessionId: string;
}

export interface UserData {
  favorites: number[]; // character IDs
  purchases: PurchaseRecord[];
  credits: number;
  creditPurchases: CreditPurchaseRecord[];
}

function userKey(userId: string, file: string) {
  return `users/${userId}/${file}`;
}

async function readUserBlob<T>(pathname: string, fallback: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;
  try {
    const result = await get(pathname, { access: 'private', useCache: false });
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
  return readUserBlob<UserData>(userKey(userId, 'data.json'), { favorites: [], purchases: [], credits: 0, creditPurchases: [] });
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

export async function addCredits(userId: string, credits: number, amount: number, sessionId: string): Promise<number> {
  const data = await getUserData(userId);
  if ((data.creditPurchases ?? []).some((p) => p.sessionId === sessionId)) return data.credits ?? 0;
  const updated: UserData = {
    ...data,
    credits: (data.credits ?? 0) + credits,
    creditPurchases: [{ credits, amount, purchasedAt: new Date().toISOString(), sessionId }, ...(data.creditPurchases ?? [])],
  };
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return updated.credits;
}

export async function deductCredit(userId: string): Promise<number> {
  const data = await getUserData(userId);
  const current = data.credits ?? 0;
  if (current <= 0) throw new Error('No credits available');
  const updated: UserData = { ...data, credits: current - 1 };
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return updated.credits;
}

export async function getCredits(userId: string): Promise<number> {
  const data = await getUserData(userId);
  return data.credits ?? 0;
}

export async function recordPurchase(userId: string, purchase: PurchaseRecord): Promise<void> {
  const data = await getUserData(userId);
  if (purchase.sessionId && data.purchases.some((p) => p.sessionId === purchase.sessionId)) return;
  const updated = [purchase, ...data.purchases];
  await writeUserBlob(userKey(userId, 'data.json'), { ...data, purchases: updated });
  // Append to global analytics log (non-blocking)
  appendPurchaseLog({
    characterId: purchase.characterId,
    characterName: purchase.characterName,
    licenseName: purchase.licenseName,
    amount: Number(purchase.licensePrice.replace(/[^0-9.]/g, '')) || 0,
    purchasedAt: purchase.purchasedAt,
  }).catch(() => {});
}
