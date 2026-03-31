import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { addCredits } from '@/lib/user-data.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const m = session.metadata!;
    if (m.type !== 'credits' || m.userId !== userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const creditsToAdd = Number(m.credits);
    const amount = Number(m.amount);
    const newBalance = await addCredits(userId, creditsToAdd, amount, sessionId);

    return NextResponse.json({ credits: newBalance, added: creditsToAdd });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Credit confirmation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
