import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe } from '@/lib/stripe.server';
import { getUserData } from '@/lib/user-data.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getUserData(userId);
  const customerId = data.subscription?.stripeCustomerId;
  if (!customerId) {
    return NextResponse.json({ error: 'No Stripe customer attached to this account' }, { status: 400 });
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.castability.ai';
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/account`,
  });

  return NextResponse.json({ url: session.url });
}
