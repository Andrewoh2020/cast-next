import { NextRequest } from 'next/server';
import { get } from '@vercel/blob';

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get('p');
  if (!pathname) return new Response('Missing pathname', { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response('Blob not configured', { status: 503 });
  }

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result) return new Response('Not found', { status: 404 });

    if (result.statusCode === 304 || !result.stream) {
      return new Response(null, { status: 304 });
    }
    const isDownload = req.nextUrl.searchParams.get('download') === '1';
    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
        ...(isDownload ? { 'Content-Disposition': `attachment; filename="${pathname.split('/').pop()}"` } : {}),
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
