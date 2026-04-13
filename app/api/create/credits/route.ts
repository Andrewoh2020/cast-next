import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCredits, claimLaunchPromo } from '@/lib/user-data.server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Auto-grant launch promo credits on first visit (2 free credits, first 200 accounts)
  await claimLaunchPromo(userId);

  const credits = await getCredits(userId);
  return NextResponse.json({ credits });
}
