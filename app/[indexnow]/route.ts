/**
 * IndexNow key verification endpoint.
 *
 * Serves the IndexNow API key as a plain text file at /{KEY}.txt to prove
 * domain ownership. Bing/IndexNow fetches this URL when we POST URL changes.
 *
 * Only matches paths that look exactly like {key}.txt where {key} matches the
 * configured INDEXNOW_KEY env var. All other paths return 404.
 */

import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ indexnow: string }> },
) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new NextResponse('Not Found', { status: 404 });

  const { indexnow } = await params;
  if (indexnow !== `${key}.txt`) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return new NextResponse(key, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
