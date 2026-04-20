/**
 * One-shot migration: convert old 1-credit-per-action balances into the new
 * hundreds-scale credit system (1 old credit → 50 new credits) and seed
 * subscription/drip state so existing users don't get a fresh signup bonus
 * on top of their migrated balance.
 *
 * Idempotent: skips users already at schemaVersion >= 2.
 *
 * Usage:
 *   DRY_RUN=1 node scripts/migrate-credits-to-subs.mjs           (preview)
 *   node scripts/migrate-credits-to-subs.mjs                     (apply, no cap)
 *   CAP=500 node scripts/migrate-credits-to-subs.mjs             (apply, cap migrated balance at 500)
 */

import { put, list } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CONVERSION_FACTOR = 50;
const DRY_RUN = !!process.env.DRY_RUN;
const CAP = process.env.CAP ? Number(process.env.CAP) : null;
const SCHEMA_VERSION = 2;

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN missing');
    process.exit(1);
  }
  if (CAP !== null && (!Number.isFinite(CAP) || CAP <= 0)) {
    console.error(`Invalid CAP: ${process.env.CAP}`);
    process.exit(1);
  }

  // Find all user data blobs
  let cursor;
  const userBlobs = [];
  do {
    const result = await list({ prefix: 'users/', mode: 'expanded', limit: 100, cursor });
    const dataBlobs = result.blobs.filter((b) => b.pathname.endsWith('/data.json'));
    userBlobs.push(...dataBlobs);
    cursor = result.cursor;
  } while (cursor);

  console.log(`Found ${userBlobs.length} user accounts`);
  if (CAP !== null) console.log(`Cap: ${CAP} credits per user`);
  if (DRY_RUN) console.log('DRY RUN — no writes');

  let migrated = 0;
  let skipped = 0;
  let cappedCount = 0;
  const now = new Date().toISOString();

  for (const blob of userBlobs) {
    try {
      const res = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      });
      if (!res.ok) continue;
      const data = await res.json();

      if ((data.schemaVersion ?? 1) >= SCHEMA_VERSION) {
        skipped++;
        continue;
      }

      const oldCredits = data.credits ?? 0;
      const rawNew = oldCredits * CONVERSION_FACTOR;
      const wasCapped = CAP !== null && rawNew > CAP;
      const newCredits = wasCapped ? CAP : rawNew;
      if (wasCapped) cappedCount++;

      const ledgerEntry = {
        ts: now,
        delta: newCredits,
        reason: 'migration',
        meta: { oldCredits, factor: CONVERSION_FACTOR, ...(wasCapped ? { cappedAt: CAP } : {}) },
      };

      const updated = {
        ...data,
        credits: newCredits,
        schemaVersion: SCHEMA_VERSION,
        subscription: data.subscription ?? { tier: 'free', status: 'none' },
        drip: data.drip ?? { signupBonusGrantedAt: now, lastDripAt: now },
        ledger: [ledgerEntry, ...(data.ledger ?? [])].slice(0, 200),
      };

      const userId = blob.pathname.split('/')[1];
      const tag = wasCapped ? ` (capped from ${rawNew})` : '';
      console.log(`  ${userId}: ${oldCredits} old → ${newCredits} new${tag}${DRY_RUN ? ' [dry]' : ''}`);

      if (!DRY_RUN) {
        await put(blob.pathname, JSON.stringify(updated, null, 2), {
          access: 'private',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      }
      migrated++;
    } catch (err) {
      console.error(`  Failed for ${blob.pathname}:`, err.message);
    }
  }

  console.log(
    `\n${DRY_RUN ? '[DRY RUN] ' : ''}Migrated ${migrated} accounts (${skipped} already at v${SCHEMA_VERSION})${
      cappedCount > 0 ? `, ${cappedCount} capped at ${CAP}` : ''
    }`
  );
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
