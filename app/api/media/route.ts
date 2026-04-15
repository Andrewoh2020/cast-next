import { NextRequest } from 'next/server';
import { get } from '@vercel/blob';
import sharp from 'sharp';

const ALLOWED_WIDTHS = [96, 200, 400, 800, 1200];

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
    const filenameParam = req.nextUrl.searchParams.get('filename');
    const ext = (result.blob.contentType ?? '').includes('png') ? '.png' : '.jpg';
    const filename = filenameParam ? `${filenameParam}${ext}` : pathname.split('/').pop()!;

    // Resize if w param is provided
    const wParam = parseInt(req.nextUrl.searchParams.get('w') ?? '', 10);
    const targetWidth = ALLOWED_WIDTHS.find((w) => w >= wParam) ?? 0;

    if (targetWidth && !isDownload) {
      const buf = await new Response(result.stream).arrayBuffer();
      const resized = await sharp(Buffer.from(buf))
        .resize(targetWidth, undefined, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      return new Response(resized as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/jpeg',
          // 1 day fresh + 7 days stale-while-revalidate. Avoids "immutable" so any
          // bad cached bytes can heal themselves within a day.
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
        ...(isDownload ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
