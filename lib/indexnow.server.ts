/**
 * IndexNow integration for Cast.
 *
 * IndexNow is an open protocol (api.indexnow.org) that lets you instantly
 * notify Bing, Yandex, Naver, Yep, and Seznam when content changes — much
 * faster than waiting for them to re-crawl your sitemap.
 *
 * Usage: import { pingIndexNow } from '@/lib/indexnow.server';
 *        await pingIndexNow(['/characters/marcus-thorne', '/']);
 */

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const HOST = 'www.castability.ai';
const SITE_URL = `https://${HOST}`;

/**
 * Notify IndexNow about one or more URLs that have changed.
 * Pass relative paths (e.g. '/characters/foo') or absolute URLs.
 * Fire-and-forget — never throws, only logs failures.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn('[indexnow] INDEXNOW_KEY not configured, skipping ping');
    return;
  }

  const urlList = paths
    .filter(Boolean)
    .map((p) => (p.startsWith('http') ? p : `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`));

  if (urlList.length === 0) return;

  try {
    const res = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[indexnow] Failed (${res.status}): ${text.slice(0, 200)}`);
      return;
    }

    console.log(`[indexnow] Pinged ${urlList.length} URL${urlList.length === 1 ? '' : 's'}`);
  } catch (err) {
    console.warn('[indexnow] Error:', err instanceof Error ? err.message : err);
  }
}
