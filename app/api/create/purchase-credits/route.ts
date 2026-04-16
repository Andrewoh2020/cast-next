import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

const CREDIT_PACKAGES = [
  { credits: 1, amount: 1000, label: '1 Character' },         // $10
  { credits: 7, amount: 5000, label: '7 Characters Bundle' }, // $50
];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { packageIndex, draftId, returnUrl } = await req.json();
    const pkg = CREDIT_PACKAGES[packageIndex];
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.castability.ai';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: pkg.amount,
          product_data: {
            name: `Cast — ${pkg.label}`,
            description: `Generate ${pkg.credits} custom AI character${pkg.credits > 1 ? 's' : ''} with hi-res profile + reference sheet`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        type: 'credits',
        userId,
        credits: String(pkg.credits),
        amount: String(pkg.amount),
        draftId: draftId || '',
      },
      success_url: returnUrl
        ? `${origin}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}credits=purchased&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/create?credits=purchased&session_id={CHECKOUT_SESSION_ID}${draftId ? `&draft=${draftId}` : ''}`,
      cancel_url: returnUrl
        ? `${origin}${returnUrl}`
        : `${origin}/create${draftId ? `?draft=${draftId}` : ''}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Credit purchase error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
