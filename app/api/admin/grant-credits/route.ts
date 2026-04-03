import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { addCredits, getCredits } from '@/lib/user-data.server';

export async function POST(req: NextRequest) {
  // Admin auth check
  const session = req.cookies.get('cast-admin-session')?.value;
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, credits } = await req.json();
    if (!email || !credits || credits < 1) {
      return NextResponse.json({ error: 'email and credits (>= 1) are required' }, { status: 400 });
    }

    // Look up user by email via Clerk
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ emailAddress: [email] });

    if (!users.data.length) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

    const user = users.data[0];
    const sessionId = `admin-grant-${Date.now()}`;
    const newTotal = await addCredits(user.id, credits, 0, sessionId);

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      creditsAdded: credits,
      totalCredits: newTotal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Grant credits error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
