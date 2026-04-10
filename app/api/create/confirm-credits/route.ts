import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { addCredits } from '@/lib/user-data.server';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
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

    // Send receipt email (non-blocking — don't fail confirmation if email fails)
    try {
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (email && process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const { default: CreditPurchaseReceipt } = await import('@/emails/CreditPurchaseReceipt');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const amountUsd = (amount / 100).toFixed(2);
        const packageLabel = creditsToAdd === 1
          ? '1 Character Credit'
          : `${creditsToAdd} Character Credits Bundle`;
        await resend.emails.send({
          from: 'Cast <no-reply@castability.ai>',
          to: email,
          subject: `Receipt — $${amountUsd} for ${creditsToAdd} character ${creditsToAdd === 1 ? 'credit' : 'credits'}`,
          react: CreditPurchaseReceipt({
            credits: creditsToAdd,
            amountPaid: `$${amountUsd}`,
            orderId: sessionId,
            purchaseDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            packageLabel,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Credit receipt email error:', emailErr);
    }

    return NextResponse.json({ credits: newBalance, added: creditsToAdd });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Credit confirmation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
