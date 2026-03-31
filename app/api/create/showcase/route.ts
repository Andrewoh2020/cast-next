import { NextResponse } from 'next/server';
import { getShowcase } from '@/lib/custom-characters.server';

export async function GET() {
  const entries = await getShowcase();
  return NextResponse.json(entries);
}
