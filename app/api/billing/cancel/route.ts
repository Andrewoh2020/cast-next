import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe } from '@/lib/stripe.server';
import { getUserData } from '@/lib/user-data.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Schedule cancellation at the end of the current billing period. The user
 * keeps their current plan + credits until then; at period end Stripe fires
 * `customer.subscription.deleted` and the webhook drops them to free.
 *
 * Reversible until the period ends — clicking any paid tier re-runs through
 * /api/billing/switch which sets cancel_at_period_end=false in the same call.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getUserData(userId);
  const subId = data.subscription?.stripeSubscriptionId;
  if (!subId) return NextResponse.json({ error: 'No active subscription' }, { status: 400 });

  try {
    await getStripe().subscriptions.update(subId, { cancel_at_period_end: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[billing/cancel] failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
