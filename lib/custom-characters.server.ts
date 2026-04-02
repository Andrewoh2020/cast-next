import { put, get } from '@vercel/blob';
import { TalentSex, TalentRace, TalentAgeRange, TalentBuild, TalentHeight, TalentStyle } from './talent';

// ── Types ────────────────────────────────────────────────────────────────

export interface CustomCharacterAttributes {
  sex: TalentSex;
  race: TalentRace[];
  ethnicity?: string;
  age?: number;
  ageRange: TalentAgeRange;
  build: TalentBuild;
  height: TalentHeight;
  style: TalentStyle;
}

export interface CustomCharacterDraft {
  id: string;
  userId: string;
  status: 'draft' | 'preview' | 'paid' | 'generating' | 'complete' | 'failed';
  description: string;
  name: string;
  slug: string;
  attributes: CustomCharacterAttributes;
  previewImages: string[];
  previewImageUrl?: string;
  sourceProfileUrl?: string;
  sourceProfileUrls?: string[];
  profileImageUrl?: string;
  profileThumbnailUrl?: string;
  referenceSheetUrl?: string;
  referenceSheetThumbnailUrl?: string;
  iterations: number;
  showInShowcase: boolean;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  completedAt?: string;
}

export interface ShowcaseEntry {
  characterId: string;
  name: string;
  previewImageUrl: string;
  style: TalentStyle;
  createdAt: string;
  creatorName?: string;
  creatorImageUrl?: string;
}

// ── Blob helpers ─────────────────────────────────────────────────────────

function draftsKey(userId: string) {
  return `users/${userId}/custom-characters.json`;
}

const SHOWCASE_KEY = 'custom-characters-showcase.json';
const MAX_SHOWCASE = 20;

async function readBlob<T>(pathname: string, fallback: T): Promise<T> {
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

async function writeBlob(pathname: string, data: unknown): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ── Draft CRUD ───────────────────────────────────────────────────────────

export async function getUserDrafts(userId: string): Promise<CustomCharacterDraft[]> {
  return readBlob<CustomCharacterDraft[]>(draftsKey(userId), []);
}

export async function getDraft(userId: string, draftId: string): Promise<CustomCharacterDraft | null> {
  const drafts = await getUserDrafts(userId);
  return drafts.find((d) => d.id === draftId) ?? null;
}

export async function saveDraft(userId: string, draft: CustomCharacterDraft): Promise<void> {
  const drafts = await getUserDrafts(userId);
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    drafts[idx] = { ...draft, updatedAt: new Date().toISOString() };
  } else {
    drafts.unshift(draft);
  }
  await writeBlob(draftsKey(userId), drafts);
}

export async function deleteDraft(userId: string, draftId: string): Promise<void> {
  const drafts = await getUserDrafts(userId);
  const filtered = drafts.filter((d) => d.id !== draftId);
  await writeBlob(draftsKey(userId), filtered);
}

// ── Showcase ─────────────────────────────────────────────────────────────

export async function getShowcase(): Promise<ShowcaseEntry[]> {
  return readBlob<ShowcaseEntry[]>(SHOWCASE_KEY, []);
}

export async function addToShowcase(entry: ShowcaseEntry): Promise<void> {
  const showcase = await getShowcase();
  showcase.unshift(entry);
  if (showcase.length > MAX_SHOWCASE) showcase.length = MAX_SHOWCASE;
  await writeBlob(SHOWCASE_KEY, showcase);
}
