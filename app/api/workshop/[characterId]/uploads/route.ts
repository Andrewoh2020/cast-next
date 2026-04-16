import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { userOwnsCharacter } from '@/lib/user-data.server';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Upload a garment or scene reference photo for use in workshop generation.
 * Gated by character ownership. Stored under users/{userId}/workshop/{characterId}/refs/.
 * Expects multipart form-data: file, kind ("garment" | "scene").
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId: raw } = await params;
  const characterId = Number(raw);
  if (!Number.isFinite(characterId) || characterId <= 0) {
    return NextResponse.json({ error: 'Invalid characterId' }, { status: 400 });
  }

  const owns = await userOwnsCharacter(userId, characterId);
  if (!owns) return NextResponse.json({ error: 'Not licensed' }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const kind = (formData.get('kind') as string | null) ?? 'garment';
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!['garment', 'scene'].includes(kind)) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (10 MB max)' }, { status: 413 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 });
  }

  const pathname = `users/${userId}/workshop/${characterId}/refs/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const bytes = await file.arrayBuffer();
  const blob = await put(pathname, bytes, {
    access: 'private',
    contentType: file.type,
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  const url = `/api/media?p=${encodeURIComponent(blob.pathname)}`;
  return NextResponse.json({ url, pathname: blob.pathname });
}
