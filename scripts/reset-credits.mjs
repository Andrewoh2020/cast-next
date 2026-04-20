/**
 * Reset a single user's credit balance to a known value. Appends an
 * admin-grant ledger entry so the reset is auditable.
 *
 * Usage:
 *   node scripts/reset-credits.mjs <email> <newBalance>
 */

import { put, get } from '@vercel/blob';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const email = process.argv[2];
const target = Number(process.argv[3]);
if (!email || !Number.isFinite(target) || target < 0) {
  console.error('Usage: node scripts/reset-credits.mjs <email> <newBalance>');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Find userId via Stripe customer metadata (same as resync-from-stripe.mjs)
const list = await stripe.customers.list({ email, limit: 10 });
const matches = list.data.filter((c) => !!c.metadata?.userId);
if (matches.length === 0) { console.error(`No Stripe customer with metadata.userId for ${email}`); process.exit(1); }
const customer = matches.sort((a, b) => b.created - a.created)[0];
const userId = customer.metadata.userId;

const blobPath = `users/${userId}/data.json`;
const result = await get(blobPath, { access: 'private', useCache: false });
if (!result?.stream) { console.error(`Blob not found: ${blobPath}`); process.exit(1); }
const data = JSON.parse(await new Response(result.stream).text());

const before = data.credits ?? 0;
const delta = target - before;

console.log(`User: ${userId} (${email})`);
console.log(`Before: ${before.toLocaleString()} credits`);
console.log(`After:  ${target.toLocaleString()} credits  (delta ${delta > 0 ? '+' : ''}${delta})`);

const entry = {
  ts: new Date().toISOString(),
  delta,
  reason: 'admin-grant',
  meta: { kind: 'manual-reset', from: before, to: target },
};

const updated = {
  ...data,
  credits: target,
  ledger: [entry, ...(data.ledger ?? [])].slice(0, 200),
};

await put(blobPath, JSON.stringify(updated, null, 2), {
  access: 'private',
  contentType: 'application/json',
  addRandomSuffix: false,
  allowOverwrite: true,
});

console.log('✓ Reset applied');
