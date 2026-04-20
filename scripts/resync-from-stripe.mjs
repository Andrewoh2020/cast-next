/**
 * Re-derive a user's subscription state from Stripe (source of truth) and
 * write it back to the user blob. Use this to repair drift caused by
 * read-modify-write races between webhook handlers and concurrent reads.
 *
 * Usage:
 *   node scripts/resync-from-stripe.mjs <email>             # find by email
 *   node scripts/resync-from-stripe.mjs --user-id <userId>  # known userId
 *   DRY_RUN=1 node scripts/resync-from-stripe.mjs <email>   # preview only
 */

import Stripe from 'stripe';
import { put, get } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const DRY_RUN = !!process.env.DRY_RUN;

// Mirror priceMap() from lib/stripe.server.ts so this script doesn't need a
// running dev server.
function priceMap() {
  const map = {};
  const add = (env, entry) => { if (process.env[env]) map[process.env[env]] = entry; };
  add('STRIPE_PRICE_STARTER_MONTHLY', { tier: 'starter', monthlyCredits: 400 });
  add('STRIPE_PRICE_STARTER_ANNUAL',  { tier: 'starter', monthlyCredits: 400 });
  add('STRIPE_PRICE_STUDIO_MONTHLY',  { tier: 'studio',  monthlyCredits: 1200 });
  add('STRIPE_PRICE_STUDIO_ANNUAL',   { tier: 'studio',  monthlyCredits: 1200 });
  add('STRIPE_PRICE_PRO_MONTHLY',     { tier: 'pro',     monthlyCredits: 4000 });
  add('STRIPE_PRICE_PRO_ANNUAL',      { tier: 'pro',     monthlyCredits: 4000 });
  return map;
}

const arg = process.argv[2];
if (!arg) { console.error('Usage: node scripts/resync-from-stripe.mjs <email|--user-id userId>'); process.exit(1); }

let targetUserId = null;
let customer = null;

if (arg === '--user-id') {
  targetUserId = process.argv[3];
  if (!targetUserId) { console.error('--user-id requires a value'); process.exit(1); }
  // find customer by metadata.userId
  for await (const c of stripe.customers.list({ limit: 100 })) {
    if (c.metadata?.userId === targetUserId) { customer = c; break; }
  }
  if (!customer) { console.error(`No Stripe customer with metadata.userId=${targetUserId}`); process.exit(1); }
} else {
  // search by email
  const email = arg;
  const list = await stripe.customers.list({ email, limit: 10 });
  if (list.data.length === 0) { console.error(`No Stripe customer with email ${email}`); process.exit(1); }
  // pick the most recent that has userId metadata
  const matches = list.data.filter((c) => !!c.metadata?.userId);
  if (matches.length === 0) { console.error(`Found ${list.data.length} customer(s) for ${email} but none have metadata.userId`); process.exit(1); }
  customer = matches.sort((a, b) => b.created - a.created)[0];
  targetUserId = customer.metadata.userId;
  if (matches.length > 1) console.log(`Note: ${matches.length} customers for ${email}, picking newest: ${customer.id}`);
}

console.log(`Resyncing user ${targetUserId} (Stripe customer ${customer.id})`);

// Find current subscription
const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 10 });
const activeSub = subs.data.find((s) => ['active', 'trialing', 'past_due'].includes(s.status));
const map = priceMap();

const blobPath = `users/${targetUserId}/data.json`;
const result = await get(blobPath, { access: 'private', useCache: false });
if (!result?.stream) { console.error(`Blob not found: ${blobPath}`); process.exit(1); }
const data = JSON.parse(await new Response(result.stream).text());

console.log(`\nBlob before:`);
console.log(`  credits: ${data.credits ?? 0}`);
console.log(`  subscription: ${JSON.stringify(data.subscription ?? null)}`);

let newSubState;
if (activeSub) {
  const priceId = activeSub.items.data[0]?.price?.id;
  const entry = priceId ? map[priceId] : null;
  const tier = entry?.tier ?? 'free';
  const periodStart = activeSub.items.data[0]?.current_period_start;
  const periodEnd = activeSub.items.data[0]?.current_period_end;
  newSubState = {
    stripeCustomerId: customer.id,
    stripeSubscriptionId: activeSub.id,
    tier,
    status: activeSub.status,
    currentPeriodStart: periodStart ? new Date(periodStart * 1000).toISOString() : undefined,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined,
    cancelAtPeriodEnd: activeSub.cancel_at_period_end,
    lastGrantedPeriodId: periodStart ? `${activeSub.id}:${periodStart}` : undefined,
    priorPeriodCreditsExpireAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined,
  };
} else {
  newSubState = {
    stripeCustomerId: customer.id,
    tier: 'free',
    status: 'none',
  };
}

console.log(`\nBlob after (proposed):`);
console.log(`  subscription: ${JSON.stringify(newSubState, null, 2)}`);

const updated = { ...data, subscription: newSubState };

if (DRY_RUN) {
  console.log('\n[DRY RUN] no write');
} else {
  await put(blobPath, JSON.stringify(updated, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  console.log('\n✓ Wrote updated blob');
}
