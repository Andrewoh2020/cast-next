import { NextResponse } from 'next/server';
import { getGenerationLog } from '@/lib/generation-log.server';

// Fallback defaults (ms) used until enough real data accumulates
const DEFAULTS = { profile: 20000, refsheet: 35000 };
const MIN_SAMPLES = 3;
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET() {
  const log = await getGenerationLog();
  const cutoff = Date.now() - WINDOW_MS;

  const recent = log.filter(
    (e) => !e.failed && e.durationMs != null && new Date(e.generatedAt).getTime() > cutoff,
  );

  const avg = (type: 'profile' | 'refsheet'): number => {
    const entries = recent.filter((e) => e.type === type);
    if (entries.length < MIN_SAMPLES) return DEFAULTS[type];
    return Math.round(entries.reduce((sum, e) => sum + e.durationMs!, 0) / entries.length);
  };

  return NextResponse.json({
    profile: avg('profile'),
    refsheet: avg('refsheet'),
    sampleCounts: {
      profile: recent.filter((e) => e.type === 'profile').length,
      refsheet: recent.filter((e) => e.type === 'refsheet').length,
    },
  });
}
