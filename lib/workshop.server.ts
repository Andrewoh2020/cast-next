import { put, get, del, list } from '@vercel/blob';

/**
 * Roster workshop storage — separate blob per outfit/shot.
 *
 * Structure:
 *   users/{userId}/workshops/{characterId}/outfits/{outfitId}.json
 *   users/{userId}/workshops/{characterId}/shots/{shotId}.json
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface OutfitVariant {
  id: string;
  prompt: string;
  garmentRefUrl?: string;
  imageUrl: string;
  thumbUrl?: string;
  createdAt: string;
  creditsSpent: number;
}

export interface SceneShot {
  id: string;
  prompt: string;
  sceneRefUrl?: string;
  sourceOutfitId?: string;
  imageUrl: string;
  thumbUrl?: string;
  createdAt: string;
  creditsSpent: number;
}

export interface VoiceSpec {
  provider: 'elevenlabs';
  voiceId: string;
  previewAudioUrl: string;
  sampleText: string;
  lockedInAt: string;
  creditsSpent: number;
}

export interface WorkshopData {
  characterId: number;
  outfits: OutfitVariant[];
  shots: SceneShot[];
  voice?: VoiceSpec;
  updatedAt: string;
}

// ── Blob keys ────────────────────────────────────────────────────────────

const outfitKey = (userId: string, charId: number, outfitId: string) => `users/${userId}/workshops/${charId}/outfits/${outfitId}.json`;
const shotKey = (userId: string, charId: number, shotId: string) => `users/${userId}/workshops/${charId}/shots/${shotId}.json`;
const outfitsPrefix = (userId: string, charId: number) => `users/${userId}/workshops/${charId}/outfits/`;
const shotsPrefix = (userId: string, charId: number) => `users/${userId}/workshops/${charId}/shots/`;
// Legacy single-file key (for migration)
const legacyKey = (userId: string, charId: number) => `users/${userId}/workshop/${charId}.json`;

// ── Helpers ──────────────────────────────────────────────────────────────

async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;
  try {
    const result = await get(key, { access: 'private', useCache: false });
    if (!result || result.statusCode === 304 || !result.stream) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, data: unknown): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(key, JSON.stringify(data, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function listBlobUrls(prefix: string): Promise<string[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const result = await list({ prefix, mode: 'expanded' });
    return result.blobs.map((b) => b.url);
  } catch {
    return [];
  }
}

async function readBlobByUrl<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Lazy migration from old single-JSON format ───────────────────────────

async function migrateIfNeeded(userId: string, characterId: number): Promise<boolean> {
  const legacy = await readJson<WorkshopData | null>(legacyKey(userId, characterId), null);
  if (!legacy || (!legacy.outfits?.length && !legacy.shots?.length)) return false;

  for (const outfit of legacy.outfits) {
    await writeJson(outfitKey(userId, characterId, outfit.id), outfit);
  }
  for (const shot of legacy.shots) {
    await writeJson(shotKey(userId, characterId, shot.id), shot);
  }

  // Delete legacy file
  try {
    await del(legacyKey(userId, characterId));
  } catch {}

  console.log(`[workshop] Migrated char ${characterId}: ${legacy.outfits.length} outfits, ${legacy.shots.length} shots`);
  return true;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

const EMPTY = (characterId: number): WorkshopData => ({
  characterId,
  outfits: [],
  shots: [],
  updatedAt: new Date().toISOString(),
});

export async function readWorkshop(userId: string, characterId: number): Promise<WorkshopData> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return EMPTY(characterId);

  // Check for legacy data and migrate
  await migrateIfNeeded(userId, characterId);

  // Read outfits and shots from separate blobs
  const [outfitUrls, shotUrls] = await Promise.all([
    listBlobUrls(outfitsPrefix(userId, characterId)),
    listBlobUrls(shotsPrefix(userId, characterId)),
  ]);

  const [outfits, shots] = await Promise.all([
    Promise.all(outfitUrls.map((url) => readBlobByUrl<OutfitVariant>(url))),
    Promise.all(shotUrls.map((url) => readBlobByUrl<SceneShot>(url))),
  ]);

  const validOutfits = (outfits.filter(Boolean) as OutfitVariant[])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const validShots = (shots.filter(Boolean) as SceneShot[])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    characterId,
    outfits: validOutfits,
    shots: validShots,
    updatedAt: new Date().toISOString(),
  };
}

export async function addOutfit(userId: string, characterId: number, outfit: OutfitVariant): Promise<WorkshopData> {
  // Single put — no race condition
  await writeJson(outfitKey(userId, characterId, outfit.id), outfit);
  return readWorkshop(userId, characterId);
}

export async function removeOutfit(userId: string, characterId: number, variantId: string): Promise<WorkshopData> {
  // Direct delete — no read-modify-write
  try {
    await del(outfitKey(userId, characterId, variantId));
  } catch {}
  return readWorkshop(userId, characterId);
}

export async function addShot(userId: string, characterId: number, shot: SceneShot): Promise<WorkshopData> {
  await writeJson(shotKey(userId, characterId, shot.id), shot);
  return readWorkshop(userId, characterId);
}

export async function removeShot(userId: string, characterId: number, shotId: string): Promise<WorkshopData> {
  try {
    await del(shotKey(userId, characterId, shotId));
  } catch {}
  return readWorkshop(userId, characterId);
}
