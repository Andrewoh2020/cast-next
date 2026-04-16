import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { removeCustomShot } from '@/lib/custom-workshop.server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; shotId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, shotId } = await params;
  const workshop = await removeCustomShot(userId, id, shotId);
  return NextResponse.json({ workshop });
}
