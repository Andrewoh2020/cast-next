import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getUserData } from '@/lib/user-data.server';

/**
 * GET /api/admin/credit-history?email=<email> | ?userId=<id>
 *
 * Returns the credit ledger for a specific user so we can trace exactly when
 * credits were granted, deducted, expired, or refunded — and why. Useful when
 * a user reports an unexpected balance change.
 */
export async function GET(req: NextRequest) {
  const session = req.cookies.get('cast-admin-session')?.value;
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const userIdParam = url.searchParams.get('userId');
  if (!email && !userIdParam) {
    return NextResponse.json({ error: 'email or userId required' }, { status: 400 });
  }

  let userId = userIdParam ?? '';
  let resolvedEmail = email ?? '';

  if (!userId && email) {
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    if (!users.data.length) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }
    userId = users.data[0].id;
  } else if (userId && !resolvedEmail) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      resolvedEmail = user.emailAddresses[0]?.emailAddress ?? '';
    } catch {}
  }

  const data = await getUserData(userId);
  const ledger = data.ledger ?? [];

  return NextResponse.json({
    userId,
    email: resolvedEmail,
    currentBalance: data.credits ?? 0,
    subscription: data.subscription ?? null,
    ledger,
    creditPurchases: data.creditPurchases ?? [],
  });
}
