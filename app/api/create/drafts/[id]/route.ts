import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraft, saveDraft, deleteDraft } from '@/lib/custom-characters.server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const draft = await getDraft(userId, id);
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(draft);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const draft = await getDraft(userId, id);
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates = await req.json();
  const updated = { ...draft, ...updates, id: draft.id, userId: draft.userId, updatedAt: new Date().toISOString() };
  await saveDraft(userId, updated);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteDraft(userId, id);
  return NextResponse.json({ ok: true });
}
