import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { removeShot } from '@/lib/workshop.server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ characterId: string; shotId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId: raw, shotId } = await params;
  const characterId = Number(raw);
  if (!Number.isFinite(characterId) || characterId <= 0) {
    return NextResponse.json({ error: 'Invalid characterId' }, { status: 400 });
  }

  const workshop = await removeShot(userId, characterId, shotId);
  return NextResponse.json({ workshop });
}
