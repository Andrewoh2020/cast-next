import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCredits } from '@/lib/user-data.server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const credits = await getCredits(userId);
  return NextResponse.json({ credits });
}
