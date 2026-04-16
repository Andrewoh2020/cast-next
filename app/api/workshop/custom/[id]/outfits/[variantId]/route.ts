import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { removeCustomOutfit } from '@/lib/custom-workshop.server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, variantId } = await params;
  const workshop = await removeCustomOutfit(userId, id, variantId);
  return NextResponse.json({ workshop });
}
