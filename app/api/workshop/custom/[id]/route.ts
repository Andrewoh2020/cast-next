import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readCustomWorkshop, renameCustomWorkshop } from '@/lib/custom-workshop.server';

/**
 * PATCH — rename a custom workshop.
 * Body: { name: string }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const workshop = await readCustomWorkshop(userId, id);
  if (!workshop) return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: 'Name too long (80 chars max)' }, { status: 400 });

  await renameCustomWorkshop(userId, id, name);
  return NextResponse.json({ ok: true, name });
}
