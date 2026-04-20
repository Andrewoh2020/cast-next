/**
 * Post-migration audit: scan all user blobs and report totals plus any
 * outliers (negative balances or balances above an expected ceiling).
 *
 * Usage:
 *   node scripts/audit-credits.mjs
 *   CEILING=10000 node scripts/audit-credits.mjs   (override outlier threshold)
 */

import { list } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CEILING = process.env.CEILING ? Number(process.env.CEILING) : 5000;

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN missing');
    process.exit(1);
  }

  let cursor;
  const userBlobs = [];
  do {
    const result = await list({ prefix: 'users/', mode: 'expanded', limit: 100, cursor });
    const dataBlobs = result.blobs.filter((b) => b.pathname.endsWith('/data.json'));
    userBlobs.push(...dataBlobs);
    cursor = result.cursor;
  } while (cursor);

  console.log(`Auditing ${userBlobs.length} accounts (outlier threshold: ${CEILING} credits)\n`);

  let totalCredits = 0;
  let totalUsers = 0;
  const tierCount = { free: 0, starter: 0, studio: 0, pro: 0 };
  const v1Count = { v1: 0, v2: 0 };
  const outliers = [];

  for (const blob of userBlobs) {
    try {
      const res = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const userId = blob.pathname.split('/')[1];

      const credits = data.credits ?? 0;
      totalCredits += credits;
      totalUsers++;

      const tier = data.subscription?.tier ?? 'free';
      if (tier in tierCount) tierCount[tier]++;

      const schemaVersion = data.schemaVersion ?? 1;
      v1Count[schemaVersion >= 2 ? 'v2' : 'v1']++;

      if (credits < 0 || credits > CEILING) {
        outliers.push({ userId, credits, tier, schemaVersion });
      }
    } catch (err) {
      console.error(`  Read failed for ${blob.pathname}:`, err.message);
    }
  }

  console.log('Summary');
  console.log(`  Total users:     ${totalUsers}`);
  console.log(`  Total credits:   ${totalCredits.toLocaleString()}`);
  console.log(`  Avg per user:    ${totalUsers ? Math.round(totalCredits / totalUsers) : 0}`);
  console.log(`  Schema versions: v1=${v1Count.v1}, v2=${v1Count.v2}`);
  console.log(`  Tier breakdown:  free=${tierCount.free}, starter=${tierCount.starter}, studio=${tierCount.studio}, pro=${tierCount.pro}`);

  if (outliers.length === 0) {
    console.log('\nNo outliers.');
  } else {
    console.log(`\n${outliers.length} outliers (balance < 0 or > ${CEILING}):`);
    for (const o of outliers.sort((a, b) => b.credits - a.credits)) {
      console.log(`  ${o.userId}  credits=${o.credits}  tier=${o.tier}  v${o.schemaVersion}`);
    }
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
