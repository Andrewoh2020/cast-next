import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getStripe, getOrCreateCustomer, priceMap } from '@/lib/stripe.server';
import { getUserData, applySubscriptionStateChange } from '@/lib/user-data.server';

export const runtime = 'nodejs';

// In-app top-up entry-point used by /create flow. Maps packageIndex (0 = Boost,
// 1 = Power) onto Stripe Price IDs. The webhook is the sole source of truth
// for credit fulfillment — the success_url just signals the client to poll.
const PACKAGE_PRICE_ENVS = ['STRIPE_PRICE_TOPUP_BOOST', 'STRIPE_PRICE_TOPUP_POWER'];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { packageIndex, draftId, returnUrl } = await req.json();
    const priceEnv = PACKAGE_PRICE_ENVS[packageIndex];
    if (!priceEnv) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    const priceId = process.env[priceEnv];
    if (!priceId) return NextResponse.json({ error: `${priceEnv} not configured` }, { status: 500 });

    const map = priceMap();
    const entry = map[priceId];
    if (!entry?.topupCredits) return NextResponse.json({ error: 'Price not registered as a top-up pack' }, { status: 500 });

    const data = await getUserData(userId);
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    const customer = await getOrCreateCustomer({
      userId,
      email,
      existingCustomerId: data.subscription?.stripeCustomerId,
    });
    if (data.subscription?.stripeCustomerId !== customer.id) {
      await applySubscriptionStateChange(userId, { stripeCustomerId: customer.id });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.castability.ai';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer: customer.id,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: returnUrl
        ? `${origin}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}credits=purchased&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/create?credits=purchased&session_id={CHECKOUT_SESSION_ID}${draftId ? `&draft=${draftId}` : ''}`,
      cancel_url: returnUrl
        ? `${origin}${returnUrl}`
        : `${origin}/create${draftId ? `?draft=${draftId}` : ''}`,
      metadata: {
        userId,
        kind: 'topup',
        priceId,
        topupCredits: String(entry.topupCredits),
        draftId: draftId || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Credit purchase error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
