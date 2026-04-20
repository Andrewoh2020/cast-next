import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureDripApplied } from '@/lib/user-data.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await ensureDripApplied(userId);
  const sub = data.subscription;
  return NextResponse.json({
    credits: data.credits ?? 0,
    tier: sub?.tier ?? 'free',
    status: sub?.status ?? 'none',
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    drip: {
      lastDripAt: data.drip?.lastDripAt ?? null,
      signupBonusGrantedAt: data.drip?.signupBonusGrantedAt ?? null,
    },
  });
}
