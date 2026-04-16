import { put, get } from '@vercel/blob';
import type { OutfitVariant, SceneShot, VoiceSpec } from './workshop.server';

/**
 * Custom workshops wrap a user-uploaded character photo (or one generated
 * through /create later) and hold the user's generated outfits/shots/voice
 * for that character. Not license-gated: any signed-in user can start one.
 */
export interface CustomWorkshopData {
  id: string;
  userId: string;
  name: string;
  sourceImageUrl: string; // stored in Blob under users/{userId}/custom-workshops/{id}/source.jpg
  outfits: OutfitVariant[];
  shots: SceneShot[];
  voice?: VoiceSpec;
  createdAt: string;
  updatedAt: string;
}

const listKey = (userId: string) => `users/${userId}/custom-workshops/_index.json`;
const workshopKey = (userId: string, id: string) => `users/${userId}/custom-workshops/${id}.json`;

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

// ── Index of a user's custom workshops ──────────────────────────────────

export interface CustomWorkshopSummary {
  id: string;
  name: string;
  sourceImageUrl: string;
  outfitCount: number;
  shotCount: number;
  updatedAt: string;
}

export async function listCustomWorkshops(userId: string): Promise<CustomWorkshopSummary[]> {
  return readJson<CustomWorkshopSummary[]>(listKey(userId), []);
}

async function upsertIndex(userId: string, summary: CustomWorkshopSummary): Promise<void> {
  const index = await listCustomWorkshops(userId);
  const next = [summary, ...index.filter((s) => s.id !== summary.id)];
  await writeJson(listKey(userId), next);
}

async function removeFromIndex(userId: string, id: string): Promise<void> {
  const index = await listCustomWorkshops(userId);
  await writeJson(listKey(userId), index.filter((s) => s.id !== id));
}

function toSummary(w: CustomWorkshopData): CustomWorkshopSummary {
  return {
    id: w.id,
    name: w.name,
    sourceImageUrl: w.sourceImageUrl,
    outfitCount: w.outfits.length,
    shotCount: w.shots.length,
    updatedAt: w.updatedAt,
  };
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function createCustomWorkshop(userId: string, params: {
  id: string;
  name: string;
  sourceImageUrl: string;
}): Promise<CustomWorkshopData> {
  const now = new Date().toISOString();
  const data: CustomWorkshopData = {
    id: params.id,
    userId,
    name: params.name,
    sourceImageUrl: params.sourceImageUrl,
    outfits: [],
    shots: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(workshopKey(userId, params.id), data);
  await upsertIndex(userId, toSummary(data));
  return data;
}

export async function readCustomWorkshop(userId: string, id: string): Promise<CustomWorkshopData | null> {
  const fallback = null as CustomWorkshopData | null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;
  try {
    const result = await get(workshopKey(userId, id), { access: 'private', useCache: false });
    if (!result || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as CustomWorkshopData;
  } catch {
    return null;
  }
}

async function writeCustomWorkshop(userId: string, data: CustomWorkshopData): Promise<CustomWorkshopData> {
  const next = { ...data, updatedAt: new Date().toISOString() };
  await writeJson(workshopKey(userId, data.id), next);
  await upsertIndex(userId, toSummary(next));
  return next;
}

export async function addCustomOutfit(userId: string, id: string, outfit: OutfitVariant): Promise<CustomWorkshopData | null> {
  const current = await readCustomWorkshop(userId, id);
  if (!current) return null;
  return writeCustomWorkshop(userId, { ...current, outfits: [outfit, ...current.outfits] });
}

export async function removeCustomOutfit(userId: string, id: string, variantId: string): Promise<CustomWorkshopData | null> {
  const current = await readCustomWorkshop(userId, id);
  if (!current) return null;
  return writeCustomWorkshop(userId, { ...current, outfits: current.outfits.filter((o) => o.id !== variantId) });
}

export async function addCustomShot(userId: string, id: string, shot: SceneShot): Promise<CustomWorkshopData | null> {
  const current = await readCustomWorkshop(userId, id);
  if (!current) return null;
  return writeCustomWorkshop(userId, { ...current, shots: [shot, ...current.shots] });
}

export async function deleteCustomWorkshop(userId: string, id: string): Promise<void> {
  await removeFromIndex(userId, id);
  // Note: we don't delete the blob itself — keep as audit trail. Index removal
  // is enough to hide it.
}
