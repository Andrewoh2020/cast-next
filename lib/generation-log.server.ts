import { put, get } from '@vercel/blob';

export interface GenerationEntry {
  characterId?: number;
  characterName?: string;
  characterSlug?: string;
  type: 'profile' | 'refsheet';
  cost: number;          // image generation cost
  claudeCost?: number;   // Claude API cost for description
  generatedAt: string;
  durationMs?: number;   // time from request to image saved
  url?: string;
  failed: boolean;
  error?: string;
  provider?: 'kie' | 'fal';
}

const LOG_KEY = 'logs/generation-log.json';

export const GENERATION_COST = {
  kie: {
    profile: 0.09,   // Kie.ai 4K nano-banana-2
    refsheet: 0.09,
  },
  fal: {
    profile: 0.16,   // Fal.ai 4K nano-banana-2
    refsheet: 0.16,
  },
} as const;

async function readLog(): Promise<GenerationEntry[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const result = await get(LOG_KEY, { access: 'private', useCache: false });
    if (!result || !result.stream) return [];
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as GenerationEntry[];
  } catch {
    return [];
  }
}

async function writeLog(entries: GenerationEntry[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(LOG_KEY, JSON.stringify(entries, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function appendGenerationLog(entry: GenerationEntry): Promise<void> {
  try {
    const entries = await readLog();
    await writeLog([...entries, entry]);
  } catch (err) {
    console.error('Failed to append generation log:', err);
  }
}

export async function getGenerationLog(): Promise<GenerationEntry[]> {
  return readLog();
}
