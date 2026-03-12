import { NextRequest, NextResponse } from 'next/server';
import { readSeo, writeSeo, SeoSettings } from '@/lib/seo.server';

export async function GET() {
  return NextResponse.json(readSeo());
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as SeoSettings;
  writeSeo(body);
  return NextResponse.json(body);
}
