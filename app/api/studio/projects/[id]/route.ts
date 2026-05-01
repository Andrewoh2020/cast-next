import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readProject, renameProject, deleteProject } from '@/lib/studio.server';

/**
 * GET — read a Studio project + its assets (newest-first).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const project = await readProject(userId, id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json({ project });
}

/**
 * PATCH — rename a Studio project.
 * Body: { name: string }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const project = await readProject(userId, id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: 'Name too long (80 chars max)' }, { status: 400 });

  await renameProject(userId, id, name);
  return NextResponse.json({ ok: true, name });
}

/**
 * DELETE — soft-delete a project (removes from index, leaves blobs in place).
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const project = await readProject(userId, id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  await deleteProject(userId, id);
  return NextResponse.json({ ok: true });
}
