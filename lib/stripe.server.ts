import Stripe from 'stripe';
import type { SubscriptionTier } from './credit-costs';

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY missing');
  _stripe = new Stripe(key);
  return _stripe;
}

export interface PriceMapEntry {
  tier?: SubscriptionTier;       // present for sub prices
  topupCredits?: number;          // present for one-off prices
  cadence?: 'monthly' | 'annual';
}

/**
 * Map Stripe Price IDs (set in env) to tier/credits/cadence so the webhook
 * can resolve any incoming price without a Stripe API roundtrip.
 *
 * Env vars are optional: if a Price isn't configured (e.g. only monthly created
 * yet), it simply won't appear here.
 */
export function priceMap(): Record<string, PriceMapEntry> {
  const map: Record<string, PriceMapEntry> = {};
  const add = (envVar: string, entry: PriceMapEntry) => {
    const id = process.env[envVar];
    if (id) map[id] = entry;
  };
  add('STRIPE_PRICE_STARTER_MONTHLY', { tier: 'starter', cadence: 'monthly' });
  add('STRIPE_PRICE_STARTER_ANNUAL', { tier: 'starter', cadence: 'annual' });
  add('STRIPE_PRICE_STUDIO_MONTHLY', { tier: 'studio', cadence: 'monthly' });
  add('STRIPE_PRICE_STUDIO_ANNUAL', { tier: 'studio', cadence: 'annual' });
  add('STRIPE_PRICE_PRO_MONTHLY', { tier: 'pro', cadence: 'monthly' });
  add('STRIPE_PRICE_PRO_ANNUAL', { tier: 'pro', cadence: 'annual' });
  add('STRIPE_PRICE_TOPUP_BOOST', { topupCredits: 500 });
  add('STRIPE_PRICE_TOPUP_POWER', { topupCredits: 1500 });
  return map;
}

/**
 * Resolve a Stripe customer for a userId. Reuses an existing customer if one
 * was already attached to a prior sub; otherwise creates a fresh one with
 * userId stored in metadata so webhooks can map back.
 */
export async function getOrCreateCustomer(opts: {
  userId: string;
  email?: string;
  existingCustomerId?: string;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();
  if (opts.existingCustomerId) {
    const c = await stripe.customers.retrieve(opts.existingCustomerId);
    if (!c.deleted) return c as Stripe.Customer;
  }
  return stripe.customers.create({
    email: opts.email,
    metadata: { userId: opts.userId },
  });
}

export function periodIdFor(subscriptionId: string, periodStart: number): string {
  return `${subscriptionId}:${periodStart}`;
}
