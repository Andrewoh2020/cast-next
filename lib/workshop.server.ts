import { put, get } from '@vercel/blob';

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

// ── Blob I/O ─────────────────────────────────────────────────────────────

function workshopKey(userId: string, characterId: number) {
  return `users/${userId}/workshop/${characterId}.json`;
}

const EMPTY = (characterId: number): WorkshopData => ({
  characterId,
  outfits: [],
  shots: [],
  updatedAt: new Date().toISOString(),
});

export async function readWorkshop(userId: string, characterId: number): Promise<WorkshopData> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return EMPTY(characterId);
  try {
    const result = await get(workshopKey(userId, characterId), { access: 'private', useCache: false });
    if (!result || result.statusCode === 304 || !result.stream) return EMPTY(characterId);
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as Partial<WorkshopData>;
    return {
      characterId,
      outfits: parsed.outfits ?? [],
      shots: parsed.shots ?? [],
      voice: parsed.voice,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return EMPTY(characterId);
  }
}

async function writeWorkshop(userId: string, data: WorkshopData): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const payload: WorkshopData = { ...data, updatedAt: new Date().toISOString() };
  await put(workshopKey(userId, data.characterId), JSON.stringify(payload, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

export async function addOutfit(userId: string, characterId: number, outfit: OutfitVariant): Promise<WorkshopData> {
  const data = await readWorkshop(userId, characterId);
  const next: WorkshopData = {
    ...data,
    outfits: [outfit, ...data.outfits],
  };
  await writeWorkshop(userId, next);
  return next;
}

export async function removeOutfit(userId: string, characterId: number, variantId: string): Promise<WorkshopData> {
  const data = await readWorkshop(userId, characterId);
  const next: WorkshopData = {
    ...data,
    outfits: data.outfits.filter((o) => o.id !== variantId),
  };
  await writeWorkshop(userId, next);
  return next;
}

export async function addShot(userId: string, characterId: number, shot: SceneShot): Promise<WorkshopData> {
  const data = await readWorkshop(userId, characterId);
  const next: WorkshopData = {
    ...data,
    shots: [shot, ...data.shots],
  };
  await writeWorkshop(userId, next);
  return next;
}

export async function removeShot(userId: string, characterId: number, shotId: string): Promise<WorkshopData> {
  const data = await readWorkshop(userId, characterId);
  const next: WorkshopData = {
    ...data,
    shots: data.shots.filter((s) => s.id !== shotId),
  };
  await writeWorkshop(userId, next);
  return next;
}
