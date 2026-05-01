import { put, get, list } from '@vercel/blob';
import { randomBytes } from 'crypto';

/**
 * Studio project storage — pivot/studio-v1.
 *
 * One project per creative initiative. Every Studio generation lives
 * inside a project. Projects own characters, products, shots, voices,
 * and the agent conversation history.
 *
 * Layout in Vercel Blob:
 *   users/{userId}/studio-projects/{projectId}/meta.json
 *   users/{userId}/studio-projects/{projectId}/assets/{assetId}.json
 *   users/{userId}/studio-projects/{projectId}/conversation.jsonl  (append-only)
 *   users/{userId}/studio-projects/_index.json                     (fast list)
 *
 * Isolated from the existing custom-workshops namespace — this branch
 * never touches existing user data, never migrates, never destructs.
 */

// ── Types ────────────────────────────────────────────────────────────────

export type AssetType = 'character' | 'product' | 'shot' | 'voice' | 'image';

export interface ProjectMeta {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAsset {
  id: string;
  type: AssetType;
  name: string;
  /** Primary asset URL (image, video clip, voice clip). Optional for placeholder assets. */
  url?: string;
  /** Optional reference URL — e.g. character ref sheet, product side view. */
  refUrl?: string;
  /** Free-form per-type metadata (e.g. character demographics, voice provider id, model used). */
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  assets: ProjectAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  thumbnailUrl?: string;
  assetCount: number;
  updatedAt: string;
}

export type ConversationRole = 'user' | 'assistant' | 'tool';

export interface ConversationEntry {
  ts: string;
  role: ConversationRole;
  content: string;
  /** When role is 'tool', this names which tool ran. */
  toolName?: string;
}

// ── Blob keys ────────────────────────────────────────────────────────────

const metaKey = (userId: string, id: string) =>
  `users/${userId}/studio-projects/${id}/meta.json`;
const assetKey = (userId: string, projectId: string, assetId: string) =>
  `users/${userId}/studio-projects/${projectId}/assets/${assetId}.json`;
const assetsPrefix = (userId: string, projectId: string) =>
  `users/${userId}/studio-projects/${projectId}/assets/`;
const conversationKey = (userId: string, id: string) =>
  `users/${userId}/studio-projects/${id}/conversation.jsonl`;
const indexKey = (userId: string) =>
  `users/${userId}/studio-projects/_index.json`;

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

async function readText(key: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return '';
  try {
    const result = await get(key, { access: 'private', useCache: false });
    if (!result || result.statusCode === 304 || !result.stream) return '';
    return await new Response(result.stream).text();
  } catch {
    return '';
  }
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

function newId(prefix: 'p' | 'a'): string {
  return `${prefix}${Date.now().toString(36)}${randomBytes(2).toString('hex')}`;
}

// ── Index management ─────────────────────────────────────────────────────

export async function listProjects(userId: string): Promise<ProjectSummary[]> {
  return readJson<ProjectSummary[]>(indexKey(userId), []);
}

async function upsertIndex(userId: string, summary: ProjectSummary): Promise<void> {
  const index = await listProjects(userId);
  const next = [summary, ...index.filter((s) => s.id !== summary.id)];
  await writeJson(indexKey(userId), next);
}

async function removeFromIndex(userId: string, id: string): Promise<void> {
  const index = await listProjects(userId);
  await writeJson(indexKey(userId), index.filter((s) => s.id !== id));
}

// ── Project CRUD ─────────────────────────────────────────────────────────

export async function createProject(userId: string, name: string): Promise<ProjectData> {
  const id = newId('p');
  const now = new Date().toISOString();
  const meta: ProjectMeta = { id, userId, name, createdAt: now, updatedAt: now };
  await writeJson(metaKey(userId, id), meta);
  await upsertIndex(userId, { id, name, assetCount: 0, updatedAt: now });
  return { ...meta, assets: [] };
}

export async function readProject(userId: string, id: string): Promise<ProjectData | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const meta = await readJson<ProjectMeta | null>(metaKey(userId, id), null);
  if (!meta) return null;

  const urls = await listBlobUrls(assetsPrefix(userId, id));
  const assets = await Promise.all(urls.map((url) => readBlobByUrl<ProjectAsset>(url)));
  const valid = assets.filter(Boolean) as ProjectAsset[];
  // Newest-first
  valid.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { ...meta, assets: valid };
}

export async function renameProject(userId: string, id: string, name: string): Promise<void> {
  const meta = await readJson<ProjectMeta | null>(metaKey(userId, id), null);
  if (!meta) return;
  const now = new Date().toISOString();
  await writeJson(metaKey(userId, id), { ...meta, name, updatedAt: now });
  // Also refresh the index entry so the project list reflects the new name
  const summaries = await readJson<ProjectSummary[]>(indexKey(userId), []);
  const updated = summaries.map((s) => (s.id === id ? { ...s, name, updatedAt: now } : s));
  await writeJson(indexKey(userId), updated);
}

/** Soft-delete: remove from the index only. Asset blobs stay in place so a
 *  future cleanup job can sweep orphans. Avoids destructive ops in v1. */
export async function deleteProject(userId: string, id: string): Promise<void> {
  await removeFromIndex(userId, id);
}

// ── Asset management ─────────────────────────────────────────────────────

export async function addProjectAsset(
  userId: string,
  projectId: string,
  asset: Omit<ProjectAsset, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<ProjectAsset> {
  const fullAsset: ProjectAsset = {
    id: asset.id ?? newId('a'),
    type: asset.type,
    name: asset.name,
    url: asset.url,
    refUrl: asset.refUrl,
    metadata: asset.metadata,
    createdAt: asset.createdAt ?? new Date().toISOString(),
  };
  await writeJson(assetKey(userId, projectId, fullAsset.id), fullAsset);

  // Update index counts (best-effort; not critical correctness).
  // Mirrors the custom-workshop pattern — accepts the read-modify-write race.
  try {
    const index = await listProjects(userId);
    const entry = index.find((s) => s.id === projectId);
    if (entry) {
      entry.assetCount = (entry.assetCount ?? 0) + 1;
      entry.updatedAt = new Date().toISOString();
      if (!entry.thumbnailUrl && fullAsset.url) entry.thumbnailUrl = fullAsset.url;
      await writeJson(indexKey(userId), index);
    }
  } catch {}

  return fullAsset;
}

export async function getProjectAsset(
  userId: string,
  projectId: string,
  assetId: string,
): Promise<ProjectAsset | null> {
  return readJson<ProjectAsset | null>(assetKey(userId, projectId, assetId), null);
}

// ── Conversation log (append-only JSONL) ─────────────────────────────────

/** Append an entry to the project's conversation log. Vercel Blob doesn't
 *  support real append, so this does a read-modify-write. Tolerable for v1
 *  conversation lengths; chunked layout if/when needed. */
export async function appendConversation(
  userId: string,
  projectId: string,
  entry: Omit<ConversationEntry, 'ts'> & { ts?: string },
): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const fullEntry: ConversationEntry = {
    ts: entry.ts ?? new Date().toISOString(),
    role: entry.role,
    content: entry.content,
    toolName: entry.toolName,
  };
  const existing = await readText(conversationKey(userId, projectId));
  const next = (existing ? existing.trimEnd() + '\n' : '') + JSON.stringify(fullEntry);
  await put(conversationKey(userId, projectId), next, {
    access: 'private',
    contentType: 'application/x-ndjson',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readConversation(
  userId: string,
  projectId: string,
  limit?: number,
): Promise<ConversationEntry[]> {
  const text = await readText(conversationKey(userId, projectId));
  if (!text) return [];
  const lines = text.trim().split('\n').filter(Boolean);
  const entries = lines
    .map((line) => {
      try {
        return JSON.parse(line) as ConversationEntry;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ConversationEntry[];
  return limit ? entries.slice(-limit) : entries;
}
