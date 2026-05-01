import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createProject, listProjects } from '@/lib/studio.server';

/**
 * GET — list the signed-in user's Studio projects.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const projects = await listProjects(userId);
  return NextResponse.json({ projects });
}

/**
 * POST — create a new Studio project.
 * Body: { name: string }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: 'Name too long (80 chars max)' }, { status: 400 });

  const project = await createProject(userId, name);
  return NextResponse.json({ project });
}
