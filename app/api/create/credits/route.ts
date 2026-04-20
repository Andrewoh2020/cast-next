import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserData, ensureDripApplied } from '@/lib/user-data.server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Lazy-grant signup bonus + daily drip on read.
  await ensureDripApplied(userId);
  const data = await getUserData(userId);
  return NextResponse.json({
    credits: data.credits ?? 0,
    tier: data.subscription?.tier ?? 'free',
    status: data.subscription?.status ?? 'none',
    currentPeriodEnd: data.subscription?.currentPeriodEnd ?? null,
  });
}
