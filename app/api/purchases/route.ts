import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserData, recordPurchase, PurchaseRecord } from '@/lib/user-data.server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await getUserData(userId);
  return NextResponse.json({ purchases: data.purchases });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const purchase = await req.json() as PurchaseRecord;
  await recordPurchase(userId, purchase);
  return NextResponse.json({ ok: true });
}
