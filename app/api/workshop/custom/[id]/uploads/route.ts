import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { readCustomWorkshop } from '@/lib/custom-workshop.server';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Upload a garment or scene reference photo for a custom workshop.
 * Gated by workshop ownership (user must own the workshop record).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const workshop = await readCustomWorkshop(userId, id);
  if (!workshop) return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const kind = (formData.get('kind') as string | null) ?? 'garment';
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!['garment', 'scene'].includes(kind)) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (10 MB max)' }, { status: 413 });

  const pathname = `users/${userId}/custom-workshops/${id}/refs/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const bytes = await file.arrayBuffer();
  const blob = await put(pathname, bytes, {
    access: 'private',
    contentType: file.type,
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  return NextResponse.json({ url: `/api/media?p=${encodeURIComponent(blob.pathname)}`, pathname: blob.pathname });
}
