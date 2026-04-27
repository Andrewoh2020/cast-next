/**
 * Grant credits to a user by email (admin operation).
 *
 * Mirrors `/api/admin/grant-credits` but runs locally against your
 * production Blob storage via `BLOB_READ_WRITE_TOKEN`. Idempotent per
 * sessionId.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/grant-credits.ts \
 *     --email nico@great.co --credits 600
 *
 * Optional:
 *   --note "onboarding credit — $30 equivalent"   # stored in sessionId tag
 *   --dry-run                                    # look up user + preview only
 */

import { clerkClient } from '@clerk/nextjs/server';
import { addCredits, getUserData } from '../lib/user-data.server';

function arg(flag: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return fallback;
  return process.argv[idx + 1];
}

async function main(): Promise<void> {
  const email = arg('--email');
  const creditsStr = arg('--credits');
  const note = arg('--note') ?? 'manual-grant';
  const dryRun = process.argv.includes('--dry-run');

  if (!email || !creditsStr) {
    console.error('Usage: grant-credits.ts --email <address> --credits <n> [--note "..."] [--dry-run]');
    process.exit(1);
  }
  const credits = parseInt(creditsStr, 10);
  if (!Number.isFinite(credits) || credits < 1) {
    console.error(`Invalid --credits value: ${creditsStr}`);
    process.exit(1);
  }

  const clerk = await clerkClient();
  const users = await clerk.users.getUserList({ emailAddress: [email] });
  if (!users.data.length) {
    console.error(`No Clerk user found for email: ${email}`);
    process.exit(1);
  }
  const user = users.data[0];
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '(unnamed)';

  const before = await getUserData(user.id);
  const currentCredits = before.credits ?? 0;

  console.log(`\nUser: ${name}  (${email})`);
  console.log(`Clerk ID: ${user.id}`);
  console.log(`Current credits: ${currentCredits}`);
  console.log(`Credits to add:  +${credits}`);
  console.log(`Projected total: ${currentCredits + credits}`);

  if (dryRun) {
    console.log(`\nDry run — nothing written.\n`);
    return;
  }

  const sessionId = `admin-grant-${note.replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}`;
  const newTotal = await addCredits(user.id, credits, 0, sessionId);

  console.log(`\n✅ Granted. New total: ${newTotal}`);
  console.log(`   Session tag: ${sessionId}\n`);
}

main().catch((err) => {
  console.error('Grant failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
