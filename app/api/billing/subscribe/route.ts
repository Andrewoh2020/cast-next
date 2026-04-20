import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getStripe, getOrCreateCustomer, priceMap } from '@/lib/stripe.server';
import { getUserData, applySubscriptionStateChange } from '@/lib/user-data.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { priceId?: string; returnUrl?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const priceId = body.priceId;
  if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 });

  const map = priceMap();
  const entry = map[priceId];
  if (!entry) return NextResponse.json({ error: 'Unknown priceId' }, { status: 400 });

  const isSubscription = !!entry.tier;
  const stripe = getStripe();
  const data = await getUserData(userId);
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  // Reuse customer if previously created so subscription history stays attached.
  const customer = await getOrCreateCustomer({
    userId,
    email,
    existingCustomerId: data.subscription?.stripeCustomerId,
  });

  // Persist customer ID immediately so webhook can map back even if the user
  // bails before completing checkout.
  if (data.subscription?.stripeCustomerId !== customer.id) {
    await applySubscriptionStateChange(userId, { stripeCustomerId: customer.id });
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.castability.ai';
  const returnPath = body.returnUrl || '/account';

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    customer: customer.id,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${returnPath}?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${returnPath}?billing=cancelled`,
    metadata: {
      userId,
      priceId,
      kind: isSubscription ? 'subscription' : 'topup',
    },
  });

  return NextResponse.json({ url: session.url });
}
