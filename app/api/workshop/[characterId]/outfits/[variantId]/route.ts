import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { removeOutfit } from '@/lib/workshop.server';
import { userOwnsCharacter } from '@/lib/user-data.server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ characterId: string; variantId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId: raw, variantId } = await params;
  const characterId = Number(raw);
  if (!Number.isFinite(characterId) || characterId <= 0) {
    return NextResponse.json({ error: 'Invalid characterId' }, { status: 400 });
  }

  const owns = await userOwnsCharacter(userId, characterId);
  if (!owns) return NextResponse.json({ error: 'Not licensed' }, { status: 403 });

  const workshop = await removeOutfit(userId, characterId, variantId);
  return NextResponse.json({ workshop });
}
