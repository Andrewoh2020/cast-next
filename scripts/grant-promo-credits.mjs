/**
 * Grant 10 workshop launch promo credits to ALL existing accounts.
 * This is a one-time grant for the Workshop launch celebration.
 *
 * Usage:
 *   node scripts/grant-promo-credits.mjs           (apply)
 *   DRY_RUN=1 node scripts/grant-promo-credits.mjs (preview)
 */

import { get, put, list } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CREDITS_TO_GRANT = 10;
const GRANT_SESSION_ID = 'workshop-launch-promo-2026-04-17';
const DRY_RUN = !!process.env.DRY_RUN;

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN missing');
    process.exit(1);
  }

  // Find all user data blobs
  let cursor;
  const userBlobs = [];
  do {
    const result = await list({ prefix: 'users/', mode: 'expanded', limit: 100, cursor });
    const dataBlobs = result.blobs.filter(b => b.pathname.endsWith('/data.json'));
    userBlobs.push(...dataBlobs);
    cursor = result.cursor;
  } while (cursor);

  console.log(`Found ${userBlobs.length} user accounts`);

  let granted = 0;
  let skipped = 0;

  for (const blob of userBlobs) {
    try {
      const res = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      });
      if (!res.ok) continue;
      const data = await res.json();

      // Skip if already granted this specific promo
      const alreadyGranted = (data.creditPurchases ?? []).some(
        p => p.sessionId === GRANT_SESSION_ID
      );
      if (alreadyGranted) {
        skipped++;
        continue;
      }

      const newBalance = (data.credits ?? 0) + CREDITS_TO_GRANT;
      const updated = {
        ...data,
        credits: newBalance,
        creditPurchases: [
          { credits: CREDITS_TO_GRANT, amount: 0, purchasedAt: new Date().toISOString(), sessionId: GRANT_SESSION_ID },
          ...(data.creditPurchases ?? []),
        ],
      };

      const userId = blob.pathname.split('/')[1];
      console.log(`  ${userId}: ${data.credits ?? 0} → ${newBalance} credits${DRY_RUN ? ' (dry run)' : ''}`);

      if (!DRY_RUN) {
        await put(blob.pathname, JSON.stringify(updated, null, 2), {
          access: 'private',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      }
      granted++;
    } catch (err) {
      console.error(`  Failed for ${blob.pathname}:`, err.message);
    }
  }

  console.log(`\n✓ Granted ${CREDITS_TO_GRANT} credits to ${granted} accounts (${skipped} already had it)${DRY_RUN ? ' — DRY RUN' : ''}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
