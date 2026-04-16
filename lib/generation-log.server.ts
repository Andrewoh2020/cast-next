import { put, get } from '@vercel/blob';

export interface GenerationEntry {
  characterId?: number;
  characterName?: string;
  characterSlug?: string;
  type: 'profile' | 'refsheet' | 'outfit' | 'shot';
  cost: number;          // image generation cost
  claudeCost?: number;   // Claude API cost for description
  generatedAt: string;
  durationMs?: number;   // time from request to image saved
  url?: string;
  failed: boolean;
  error?: string;
  provider?: 'kie' | 'fal' | 'google';
  // Provenance fields — legal proof that no real person's likeness was used
  userId?: string;       // who initiated the generation
  prompt?: string;       // exact text prompt sent to the image generator
  model?: string;        // specific AI model used (e.g. "fal-ai/nano-banana-2/edit")
  referenceImageUrl?: string; // the input reference image (should always be AI-generated)
}

const LOG_KEY = 'logs/generation-log.json';

export const GENERATION_COST = {
  google: {
    profile: 0.151,  // Google direct 4K Nano Banana 2
    refsheet: 0.151,
    outfit: 0.04,    // smaller — identity-lock edits
    shot: 0.04,
  },
  kie: {
    profile: 0.09,   // Kie.ai 4K nano-banana-2
    refsheet: 0.09,
    outfit: 0.04,
    shot: 0.04,
  },
  fal: {
    profile: 0.16,   // Fal.ai 4K nano-banana-2
    refsheet: 0.16,
    outfit: 0.04,
    shot: 0.04,
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
