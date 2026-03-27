import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });

  const slug = formData.get('slug') as string | null;
  const type = formData.get('type') as string | null;

  const pathname = slug && type
    ? `characters/${slug}-${type}-${Date.now()}.${ext}`
    : `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, bytes, {
      access: 'private',
      contentType: file.type,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    // Store the pathname so we can proxy it; the full blob URL requires auth
    const proxyUrl = `/api/media?p=${encodeURIComponent(blob.pathname)}`;
    return NextResponse.json({ url: proxyUrl, pathname: blob.pathname });
  }

  // Local dev fallback — write to public/uploads
  const fs = await import('fs');
  const path = await import('path');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(bytes));
  return NextResponse.json({ url: `/uploads/${filename}`, pathname: null });
}
