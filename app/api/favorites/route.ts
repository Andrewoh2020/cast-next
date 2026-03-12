import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserData, toggleFavorite } from '@/lib/user-data.server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await getUserData(userId);
  return NextResponse.json({ favorites: data.favorites });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { characterId } = await req.json() as { characterId: number };
  const favorites = await toggleFavorite(userId, characterId);
  return NextResponse.json({ favorites });
}
