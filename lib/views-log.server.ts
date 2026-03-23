import { put, get } from '@vercel/blob';

const BLOB_KEY = 'views-log.json';

export interface ViewLogEntry {
  characterId: number;
  sessionId: string;
  viewedAt: string; // ISO date string
}

async function readLog(): Promise<ViewLogEntry[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const result = await get(BLOB_KEY, { access: 'private', useCache: false });
    if (!result || !result.stream) return [];
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as ViewLogEntry[];
  } catch {
    return [];
  }
}

async function writeLog(entries: ViewLogEntry[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(BLOB_KEY, JSON.stringify(entries, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function appendViewLog(entry: ViewLogEntry): Promise<void> {
  const log = await readLog();
  // Deduplicate: only log one view per session per character per day
  const today = entry.viewedAt.slice(0, 10);
  const alreadyLogged = log.some(
    (e) => e.characterId === entry.characterId && e.sessionId === entry.sessionId && e.viewedAt.slice(0, 10) === today
  );
  if (alreadyLogged) return;
  await writeLog([...log, entry]);
}

export async function getViewsLog(): Promise<ViewLogEntry[]> {
  return readLog();
}
