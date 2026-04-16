import { put, get, del, list } from '@vercel/blob';
import type { OutfitVariant, SceneShot, VoiceSpec } from './workshop.server';

/**
 * Custom workshop storage — separate blob per outfit/shot.
 *
 * Structure:
 *   users/{userId}/custom-workshops/{id}/meta.json
 *   users/{userId}/custom-workshops/{id}/outfits/{outfitId}.json
 *   users/{userId}/custom-workshops/{id}/shots/{shotId}.json
 *
 * No read-modify-write — each add/delete is atomic on its own key.
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface CustomWorkshopMeta {
  id: string;
  userId: string;
  name: string;
  sourceImageUrl: string;
  referenceSheetUrl?: string;
  createdAt: string;
}

export interface CustomWorkshopData {
  id: string;
  userId: string;
  name: string;
  sourceImageUrl: string;
  referenceSheetUrl?: string;
  outfits: OutfitVariant[];
  shots: SceneShot[];
  voice?: VoiceSpec;
  createdAt: string;
  updatedAt: string;
}

export interface CustomWorkshopSummary {
  id: string;
  name: string;
  sourceImageUrl: string;
  outfitCount: number;
  shotCount: number;
  updatedAt: string;
}

// ── Blob keys ────────────────────────────────────────────────────────────

const metaKey = (userId: string, id: string) => `users/${userId}/custom-workshops/${id}/meta.json`;
const outfitKey = (userId: string, id: string, outfitId: string) => `users/${userId}/custom-workshops/${id}/outfits/${outfitId}.json`;
const shotKey = (userId: string, id: string, shotId: string) => `users/${userId}/custom-workshops/${id}/shots/${shotId}.json`;
const outfitsPrefix = (userId: string, id: string) => `users/${userId}/custom-workshops/${id}/outfits/`;
const shotsPrefix = (userId: string, id: string) => `users/${userId}/custom-workshops/${id}/shots/`;
const indexKey = (userId: string) => `users/${userId}/custom-workshops/_index.json`;
// Legacy single-file key (for migration)
const legacyKey = (userId: string, id: string) => `users/${userId}/custom-workshops/${id}.json`;

// ── Low-level helpers ────────────────────────────────────────────────────

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

// ── Index management ─────────────────────────────────────────────────────

export async function listCustomWorkshops(userId: string): Promise<CustomWorkshopSummary[]> {
  return readJson<CustomWorkshopSummary[]>(indexKey(userId), []);
}

async function upsertIndex(userId: string, summary: CustomWorkshopSummary): Promise<void> {
  const index = await listCustomWorkshops(userId);
  const next = [summary, ...index.filter((s) => s.id !== summary.id)];
  await writeJson(indexKey(userId), next);
}

async function removeFromIndex(userId: string, id: string): Promise<void> {
  const index = await listCustomWorkshops(userId);
  await writeJson(indexKey(userId), index.filter((s) => s.id !== id));
}

// ── Lazy migration from old single-JSON format ───────────────────────────

async function migrateIfNeeded(userId: string, id: string): Promise<boolean> {
  const legacy = await readJson<CustomWorkshopData | null>(legacyKey(userId, id), null);
  if (!legacy) return false;

  // Write meta
  const meta: CustomWorkshopMeta = {
    id: legacy.id,
    userId: legacy.userId,
    name: legacy.name,
    sourceImageUrl: legacy.sourceImageUrl,
    createdAt: legacy.createdAt,
  };
  await writeJson(metaKey(userId, id), meta);

  // Write each outfit as a separate blob
  for (const outfit of legacy.outfits) {
    await writeJson(outfitKey(userId, id, outfit.id), outfit);
  }

  // Write each shot as a separate blob
  for (const shot of legacy.shots) {
    await writeJson(shotKey(userId, id, shot.id), shot);
  }

  // Delete the legacy single JSON
  try {
    await del(legacyKey(userId, id));
  } catch {}

  console.log(`[custom-workshop] Migrated ${id}: ${legacy.outfits.length} outfits, ${legacy.shots.length} shots`);
  return true;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function createCustomWorkshop(userId: string, params: {
  id: string;
  name: string;
  sourceImageUrl: string;
  referenceSheetUrl?: string;
}): Promise<CustomWorkshopData> {
  const now = new Date().toISOString();
  const meta: CustomWorkshopMeta = {
    id: params.id,
    userId,
    name: params.name,
    sourceImageUrl: params.sourceImageUrl,
    referenceSheetUrl: params.referenceSheetUrl,
    createdAt: now,
  };
  await writeJson(metaKey(userId, params.id), meta);

  const data: CustomWorkshopData = {
    ...meta,
    outfits: [],
    shots: [],
    updatedAt: now,
  };

  await upsertIndex(userId, {
    id: params.id,
    name: params.name,
    sourceImageUrl: params.sourceImageUrl,
    outfitCount: 0,
    shotCount: 0,
    updatedAt: now,
  });

  return data;
}

export async function readCustomWorkshop(userId: string, id: string): Promise<CustomWorkshopData | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  // Try new format first
  let meta = await readJson<CustomWorkshopMeta | null>(metaKey(userId, id), null);

  if (!meta) {
    // Try lazy migration from old format
    const migrated = await migrateIfNeeded(userId, id);
    if (migrated) {
      meta = await readJson<CustomWorkshopMeta | null>(metaKey(userId, id), null);
    }
    if (!meta) return null;
  }

  // Read outfits and shots in parallel from separate blobs
  const [outfitUrls, shotUrls] = await Promise.all([
    listBlobUrls(outfitsPrefix(userId, id)),
    listBlobUrls(shotsPrefix(userId, id)),
  ]);

  const [outfits, shots] = await Promise.all([
    Promise.all(outfitUrls.map((url) => readBlobByUrl<OutfitVariant>(url))),
    Promise.all(shotUrls.map((url) => readBlobByUrl<SceneShot>(url))),
  ]);

  const validOutfits = outfits.filter(Boolean) as OutfitVariant[];
  const validShots = shots.filter(Boolean) as SceneShot[];

  // Sort by createdAt descending (newest first)
  validOutfits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  validShots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    id: meta.id,
    userId: meta.userId,
    name: meta.name,
    sourceImageUrl: meta.sourceImageUrl,
    referenceSheetUrl: meta.referenceSheetUrl,
    outfits: validOutfits,
    shots: validShots,
    createdAt: meta.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function addCustomOutfit(userId: string, workshopId: string, outfit: OutfitVariant): Promise<CustomWorkshopData | null> {
  // Single put — no read-modify-write, no race condition
  await writeJson(outfitKey(userId, workshopId, outfit.id), outfit);

  // Update index count (best-effort, not critical)
  try {
    const index = await listCustomWorkshops(userId);
    const entry = index.find((s) => s.id === workshopId);
    if (entry) {
      entry.outfitCount = (entry.outfitCount ?? 0) + 1;
      entry.updatedAt = new Date().toISOString();
      await writeJson(indexKey(userId), index);
    }
  } catch {}

  // Return full workshop (assembled from separate reads)
  return readCustomWorkshop(userId, workshopId);
}

export async function removeCustomOutfit(userId: string, workshopId: string, variantId: string): Promise<CustomWorkshopData | null> {
  // Direct delete — no read-modify-write
  try {
    await del(outfitKey(userId, workshopId, variantId));
  } catch {}

  // Update index count (best-effort)
  try {
    const index = await listCustomWorkshops(userId);
    const entry = index.find((s) => s.id === workshopId);
    if (entry) {
      entry.outfitCount = Math.max(0, (entry.outfitCount ?? 0) - 1);
      entry.updatedAt = new Date().toISOString();
      await writeJson(indexKey(userId), index);
    }
  } catch {}

  return readCustomWorkshop(userId, workshopId);
}

export async function addCustomShot(userId: string, workshopId: string, shot: SceneShot): Promise<CustomWorkshopData | null> {
  await writeJson(shotKey(userId, workshopId, shot.id), shot);

  try {
    const index = await listCustomWorkshops(userId);
    const entry = index.find((s) => s.id === workshopId);
    if (entry) {
      entry.shotCount = (entry.shotCount ?? 0) + 1;
      entry.updatedAt = new Date().toISOString();
      await writeJson(indexKey(userId), index);
    }
  } catch {}

  return readCustomWorkshop(userId, workshopId);
}

export async function removeCustomShot(userId: string, workshopId: string, shotId: string): Promise<CustomWorkshopData | null> {
  try {
    await del(shotKey(userId, workshopId, shotId));
  } catch {}

  try {
    const index = await listCustomWorkshops(userId);
    const entry = index.find((s) => s.id === workshopId);
    if (entry) {
      entry.shotCount = Math.max(0, (entry.shotCount ?? 0) - 1);
      entry.updatedAt = new Date().toISOString();
      await writeJson(indexKey(userId), index);
    }
  } catch {}

  return readCustomWorkshop(userId, workshopId);
}

export async function deleteCustomWorkshop(userId: string, id: string): Promise<void> {
  await removeFromIndex(userId, id);
}

/** Update just the reference sheet URL on a workshop's meta. */
export async function updateCustomWorkshopRefSheet(userId: string, id: string, referenceSheetUrl: string): Promise<void> {
  const meta = await readJson<CustomWorkshopMeta | null>(metaKey(userId, id), null);
  if (!meta) return;
  await writeJson(metaKey(userId, id), { ...meta, referenceSheetUrl });
}
