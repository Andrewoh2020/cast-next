import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { createCustomWorkshop, listCustomWorkshops } from '@/lib/custom-workshop.server';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * GET — list the user's custom workshops.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workshops = await listCustomWorkshops(userId);
  return NextResponse.json({ workshops });
}

/**
 * POST — upload a character photo and create a new custom workshop.
 * Expects multipart form-data: file (required), name (optional).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = ((formData.get('name') as string | null) ?? 'My character').trim() || 'My character';
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Invalid file type (JPEG, PNG, or WebP only)' }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (10 MB max)' }, { status: 413 });
  }

  // Unique id (nanoid-style short id)
  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const pathname = `users/${userId}/custom-workshops/${id}/source.${ext}`;
  const bytes = await file.arrayBuffer();
  const blob = await put(pathname, bytes, {
    access: 'private',
    contentType: file.type,
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  const sourceImageUrl = `/api/media?p=${encodeURIComponent(blob.pathname)}`;
  const workshop = await createCustomWorkshop(userId, { id, name, sourceImageUrl });

  return NextResponse.json({ workshop });
}
