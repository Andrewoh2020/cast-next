import { NextRequest, NextResponse } from 'next/server';
import { readSeo, writeSeo, SeoSettings } from '@/lib/seo.server';

export async function GET() {
  const settings = await readSeo();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as SeoSettings;
  await writeSeo(body);
  return NextResponse.json(body);
}
