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

// ── Signup promo: 2 free credits for every new account ──────────────

const PROMO_KEY = 'launch-promo.json';
const PROMO_CREDITS = 2;

interface PromoData {
  claimedUserIds: string[];
}

async function getPromoData(): Promise<PromoData> {
  return readUserBlob<PromoData>(PROMO_KEY, { claimedUserIds: [] });
}

async function writePromoData(data: PromoData): Promise<void> {
  await writeUserBlob(PROMO_KEY, data);
}

/**
 * Grant signup promo credits if the user hasn't claimed them yet.
 * Returns the number of promo credits granted (0 if already claimed).
 */
export async function claimLaunchPromo(userId: string): Promise<number> {
  const promo = await getPromoData();
  if (promo.claimedUserIds.includes(userId)) return 0;

  promo.claimedUserIds.push(userId);
  await writePromoData(promo);
  await addCredits(userId, PROMO_CREDITS, 0, `launch-promo-${userId}`);
  return PROMO_CREDITS;
}

export async function getCredits(userId: string): Promise<number> {
  const data = await getUserData(userId);
  return data.credits ?? 0;
}

/**
 * Deduct N credits atomically. Used when an action costs more than a single
 * credit (e.g. locking in a voice). If the user doesn't have enough credits,
 * throws before touching the balance.
 */
export async function deductCredits(userId: string, n: number): Promise<number> {
  if (n <= 0) throw new Error('deductCredits(n>0) required');
  const data = await getUserData(userId);
  const current = data.credits ?? 0;
  if (current < n) throw new Error(`Need ${n} credits, have ${current}`);
  const updated: UserData = { ...data, credits: current - n };
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return updated.credits;
}

/**
 * Check whether a user owns a license for a character. Considers Single Project
 * and Studio licenses valid for 1 year from purchase; Exclusive Rights never
 * expire. Used to gate workshop features on licensed characters only.
 */
export async function userOwnsCharacter(userId: string, characterId: number): Promise<boolean> {
  const data = await getUserData(userId);
  const now = Date.now();
  return (data.purchases ?? []).some((p) => {
    if (p.characterId !== characterId) return false;
    if (p.licenseName === 'Exclusive Rights') return true;
    // 1-year license window
    const purchased = new Date(p.purchasedAt).getTime();
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    return now - purchased < ONE_YEAR_MS;
  });
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
