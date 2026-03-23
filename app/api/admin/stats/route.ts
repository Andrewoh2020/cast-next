import { NextResponse } from 'next/server';
import { getPurchasesLog } from '@/lib/purchases-log.server';
import { getViewsLog } from '@/lib/views-log.server';

export async function GET() {
  const [purchases, views] = await Promise.all([getPurchasesLog(), getViewsLog()]);

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

  return NextResponse.json({ totalRevenue, totalPurchases, byCharacter });
}
