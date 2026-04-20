import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe, priceMap } from '@/lib/stripe.server';
import { getUserData } from '@/lib/user-data.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * In-app plan switch. Updates the user's existing subscription to a new
 * priceId and bills the prorated difference immediately against the saved
 * payment method (proration_behavior: 'always_invoice'). The webhook handler
 * picks up the resulting `customer.subscription.updated` event and applies
 * the prorated credit grant.
 *
 * Also clears `cancel_at_period_end` so a user who was canceling can switch
 * plans without first having to "uncancel".
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { newPriceId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const newPriceId = body.newPriceId;
  if (!newPriceId) return NextResponse.json({ error: 'newPriceId required' }, { status: 400 });

  const map = priceMap();
  const entry = map[newPriceId];
  if (!entry?.tier) return NextResponse.json({ error: 'Not a subscription priceId' }, { status: 400 });

  const data = await getUserData(userId);
  const subId = data.subscription?.stripeSubscriptionId;
  if (!subId) return NextResponse.json({ error: 'No active subscription to switch' }, { status: 400 });

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);
  const item = sub.items.data[0];
  if (!item) return NextResponse.json({ error: 'Subscription has no items' }, { status: 500 });
  if (item.price.id === newPriceId && !sub.cancel_at_period_end) {
    return NextResponse.json({ error: 'Already on this plan' }, { status: 400 });
  }

  try {
    await stripe.subscriptions.update(subId, {
      items: [{ id: item.id, price: newPriceId }],
      proration_behavior: 'always_invoice',
      cancel_at_period_end: false,
      payment_behavior: 'allow_incomplete',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[billing/switch] failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // The customer.subscription.updated webhook will handle credit grant + state.
  return NextResponse.json({ success: true, tier: entry.tier });
}
