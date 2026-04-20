import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe, priceMap } from '@/lib/stripe.server';
import { getUserData } from '@/lib/user-data.server';
import { TIER_MONTHLY_CREDITS } from '@/lib/credit-costs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Quote a plan switch before the user confirms. Returns the prorated charge,
 * the credit delta they'll receive immediately, and the new monthly allowance.
 *
 * GET /api/billing/preview-switch?priceId=price_xxx
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const newPriceId = req.nextUrl.searchParams.get('priceId');
  if (!newPriceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 });

  const map = priceMap();
  const entry = map[newPriceId];
  if (!entry?.tier) return NextResponse.json({ error: 'Not a subscription priceId' }, { status: 400 });

  const data = await getUserData(userId);
  const subId = data.subscription?.stripeSubscriptionId;
  if (!subId) return NextResponse.json({ error: 'No active subscription' }, { status: 400 });

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);
  const item = sub.items.data[0];
  if (!item) return NextResponse.json({ error: 'Subscription has no items' }, { status: 500 });

  const oldPriceId = item.price.id;
  if (oldPriceId === newPriceId) return NextResponse.json({ error: 'Already on this plan' }, { status: 400 });

  const oldEntry = map[oldPriceId];
  const oldTier = oldEntry?.tier ?? 'free';
  const oldAllowance = TIER_MONTHLY_CREDITS[oldTier] ?? 0;
  const newAllowance = TIER_MONTHLY_CREDITS[entry.tier] ?? 0;

  // Ask Stripe to preview the invoice that would result from this change.
  let amountDueCents = 0;
  try {
    const preview = await stripe.invoices.createPreview({
      subscription: subId,
      subscription_details: {
        items: [{ id: item.id, price: newPriceId }],
        proration_behavior: 'always_invoice',
      },
    });
    amountDueCents = preview.amount_due ?? 0;
  } catch (err) {
    // Some Stripe accounts may not have createPreview enabled. Fall back to
    // a manual proration estimate based on remaining days.
    console.warn('[billing/preview-switch] createPreview failed, using fallback:', err instanceof Error ? err.message : err);
    const periodStart = item.current_period_start;
    const periodEnd = item.current_period_end;
    if (periodStart && periodEnd) {
      const nowSec = Math.floor(Date.now() / 1000);
      const ratio = Math.max(0, Math.min(1, (periodEnd - nowSec) / (periodEnd - periodStart)));
      const newPrice = await stripe.prices.retrieve(newPriceId);
      const oldUnit = item.price.unit_amount ?? 0;
      const newUnit = newPrice.unit_amount ?? 0;
      amountDueCents = Math.max(0, Math.round((newUnit - oldUnit) * ratio));
    }
  }

  // Mirror the proration ratio from the webhook handler so the credit-delta
  // estimate matches what the user actually receives.
  const periodStart = item.current_period_start;
  const periodEnd = item.current_period_end;
  let creditDelta = 0;
  if (periodStart && periodEnd && newAllowance > oldAllowance) {
    const nowSec = Math.floor(Date.now() / 1000);
    const ratio = Math.max(0, Math.min(1, (periodEnd - nowSec) / (periodEnd - periodStart)));
    creditDelta = Math.max(0, Math.round((newAllowance - oldAllowance) * ratio));
  }

  return NextResponse.json({
    fromTier: oldTier,
    toTier: entry.tier,
    amountDueCents,
    creditDelta,
    newMonthlyCredits: newAllowance,
    isUpgrade: newAllowance > oldAllowance,
    periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  });
}
