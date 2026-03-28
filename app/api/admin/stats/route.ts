import { NextResponse } from 'next/server';
import { getPurchasesLog } from '@/lib/purchases-log.server';
import { getViewsLog } from '@/lib/views-log.server';
import { getGenerationLog } from '@/lib/generation-log.server';

export async function GET() {
  const [purchases, views, generations] = await Promise.all([
    getPurchasesLog(), getViewsLog(), getGenerationLog(),
  ]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Aggregate per character
  const byCharacter: Record<number, {
    purchases: number;
    revenue: number;
    byLicense: Record<string, { count: number; revenue: number }>;
    viewsThisWeek: number;
  }> = {};

  for (const p of purchases) {
    if (!byCharacter[p.characterId]) {
      byCharacter[p.characterId] = { purchases: 0, revenue: 0, byLicense: {}, viewsThisWeek: 0 };
    }
    byCharacter[p.characterId].purchases += 1;
    byCharacter[p.characterId].revenue += p.amount;
    const lic = byCharacter[p.characterId].byLicense;
    if (!lic[p.licenseName]) lic[p.licenseName] = { count: 0, revenue: 0 };
    lic[p.licenseName].count += 1;
    lic[p.licenseName].revenue += p.amount;
  }

  // Weekly unique views per character
  const weeklyViews = views.filter((v) => v.viewedAt >= sevenDaysAgo);
  for (const v of weeklyViews) {
    if (!byCharacter[v.characterId]) {
      byCharacter[v.characterId] = { purchases: 0, revenue: 0, byLicense: {}, viewsThisWeek: 0 };
    }
    byCharacter[v.characterId].viewsThisWeek += 1;
  }

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
  const totalPurchases = purchases.length;

  // Generation stats
  const successfulGens = generations.filter((g) => !g.failed);
  const failedGens = generations.filter((g) => g.failed);
  const totalImageCost = generations.reduce((sum, g) => sum + g.cost, 0);
  const totalClaudeCost = generations.reduce((sum, g) => sum + (g.claudeCost ?? 0), 0);
  const totalGenerationCost = totalImageCost + totalClaudeCost;

  // Per-provider breakdown
  const kieGens = generations.filter((g) => g.provider === 'kie');
  const falGens = generations.filter((g) => !g.provider || g.provider === 'fal');
  const totalKieCost = kieGens.reduce((sum, g) => sum + g.cost, 0);
  const totalFalCost = falGens.reduce((sum, g) => sum + g.cost, 0);

  const profileGens = successfulGens.filter((g) => g.type === 'profile');
  const refsheetGens = successfulGens.filter((g) => g.type === 'refsheet');
  const avgProfileCost = profileGens.length
    ? profileGens.reduce((s, g) => s + g.cost, 0) / profileGens.length : 0;
  const avgRefsheetCost = refsheetGens.length
    ? refsheetGens.reduce((s, g) => s + g.cost, 0) / refsheetGens.length : 0;

  // Per-character generation cost & regen count
  const genByCharacter: Record<string, { totalCost: number; count: number; slug?: string }> = {};
  for (const g of generations) {
    const key = g.characterName ?? 'Unknown';
    if (!genByCharacter[key]) genByCharacter[key] = { totalCost: 0, count: 0, slug: g.characterSlug };
    genByCharacter[key].totalCost += g.cost;
    genByCharacter[key].count += 1;
  }

  // Recent generation history (last 50, newest first) — include provider
  const generationHistory = [...generations].reverse().slice(0, 50).map((g) => ({
    characterName: g.characterName,
    characterSlug: g.characterSlug,
    type: g.type,
    cost: g.cost,
    generatedAt: g.generatedAt,
    url: g.url,
    failed: g.failed,
    error: g.error,
    provider: g.provider ?? 'fal',
  }));

  return NextResponse.json({
    totalRevenue, totalPurchases, byCharacter,
    generation: {
      totalCost: totalGenerationCost,
      totalImageCost,
      totalFalCost,
      totalKieCost,
      totalClaudeCost,
      totalSuccessful: successfulGens.length,
      totalFailed: failedGens.length,
      avgProfileCost,
      avgRefsheetCost,
      byCharacter: genByCharacter,
      history: generationHistory,
    },
  });
}
