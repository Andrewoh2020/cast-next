import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId, characterName, characterSlug, characterImg, licenseName, licensePrice, amount, referenceSheetUrl, isExclusive } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount * 100,
            product_data: {
              name: `${characterName} — ${licenseName} License`,
              description: `Cast AI character license for ${characterName}`,
              images: characterImg?.startsWith('http') ? [characterImg] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        characterId: String(characterId),
        characterName,
        characterSlug,
        characterImg,
        licenseName,
        licensePrice,
        referenceSheetUrl: referenceSheetUrl ?? '',
        isExclusive: isExclusive ? 'true' : 'false',
      },
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/#roster`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
