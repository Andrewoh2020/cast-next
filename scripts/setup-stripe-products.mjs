/**
 * One-time Stripe setup: creates Cast subscription Products + Prices in TEST
 * mode using the API. Idempotent — re-running skips products that already
 * exist (matched by name). Prints env-var lines to paste into .env.local.
 *
 * Usage:
 *   node scripts/setup-stripe-products.mjs
 *
 * Uses STRIPE_SECRET_KEY from .env.local. Will refuse to run with a live key.
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error('STRIPE_SECRET_KEY missing'); process.exit(1); }
if (key.startsWith('sk_live_') && process.env.ALLOW_LIVE !== '1') {
  console.error('Refusing to run against LIVE key without ALLOW_LIVE=1.');
  console.error('Re-run: ALLOW_LIVE=1 STRIPE_SECRET_KEY=sk_live_… node scripts/setup-stripe-products.mjs');
  process.exit(1);
}
if (key.startsWith('sk_live_')) console.log('⚠️  Running against LIVE Stripe.');

const stripe = new Stripe(key);

// One Product per row. `prices` defines what to attach.
const PRODUCTS = [
  {
    name: 'Cast Starter',
    description: '400 credits per month — for solo creators and hobbyists',
    metadata: { tier: 'starter' },
    prices: [
      { envVar: 'STRIPE_PRICE_STARTER_MONTHLY', amount: 1900, interval: 'month', metadata: { tier: 'starter', monthlyCredits: '400', cadence: 'monthly' } },
      { envVar: 'STRIPE_PRICE_STARTER_ANNUAL',  amount: 19000, interval: 'year', metadata: { tier: 'starter', monthlyCredits: '400', cadence: 'annual'  } },
    ],
  },
  {
    name: 'Cast Studio',
    description: '1,200 credits per month — for indie studios and freelancers',
    metadata: { tier: 'studio' },
    prices: [
      { envVar: 'STRIPE_PRICE_STUDIO_MONTHLY', amount: 4900,  interval: 'month', metadata: { tier: 'studio', monthlyCredits: '1200', cadence: 'monthly' } },
      { envVar: 'STRIPE_PRICE_STUDIO_ANNUAL',  amount: 49000, interval: 'year',  metadata: { tier: 'studio', monthlyCredits: '1200', cadence: 'annual'  } },
    ],
  },
  {
    name: 'Cast Pro',
    description: '4,000 credits per month — for agencies and prosumers',
    metadata: { tier: 'pro' },
    prices: [
      { envVar: 'STRIPE_PRICE_PRO_MONTHLY', amount: 12900,  interval: 'month', metadata: { tier: 'pro', monthlyCredits: '4000', cadence: 'monthly' } },
      { envVar: 'STRIPE_PRICE_PRO_ANNUAL',  amount: 129000, interval: 'year',  metadata: { tier: 'pro', monthlyCredits: '4000', cadence: 'annual'  } },
    ],
  },
  {
    name: 'Cast Boost (top-up)',
    description: '500 credits — never expires',
    metadata: { kind: 'topup' },
    prices: [
      { envVar: 'STRIPE_PRICE_TOPUP_BOOST', amount: 2500, oneTime: true, metadata: { topupCredits: '500' } },
    ],
  },
  {
    name: 'Cast Power (top-up)',
    description: '1,500 credits — never expires',
    metadata: { kind: 'topup' },
    prices: [
      { envVar: 'STRIPE_PRICE_TOPUP_POWER', amount: 6000, oneTime: true, metadata: { topupCredits: '1500' } },
    ],
  },
];

async function findProductByName(name) {
  // Stripe doesn't have a direct name search; list active products and filter.
  for await (const product of stripe.products.list({ limit: 100, active: true })) {
    if (product.name === name) return product;
  }
  return null;
}

async function findPriceForProduct(productId, predicate) {
  for await (const price of stripe.prices.list({ product: productId, active: true, limit: 100 })) {
    if (predicate(price)) return price;
  }
  return null;
}

async function ensureProduct(spec) {
  let product = await findProductByName(spec.name);
  if (product) {
    console.log(`✓ Product exists: ${spec.name} (${product.id})`);
  } else {
    product = await stripe.products.create({
      name: spec.name,
      description: spec.description,
      metadata: spec.metadata,
    });
    console.log(`+ Product created: ${spec.name} (${product.id})`);
  }
  return product;
}

async function ensurePrice(product, priceSpec) {
  const matches = (p) => {
    if (p.unit_amount !== priceSpec.amount) return false;
    if (priceSpec.oneTime) return p.type === 'one_time';
    return p.type === 'recurring' && p.recurring?.interval === priceSpec.interval;
  };
  let price = await findPriceForProduct(product.id, matches);
  if (price) {
    console.log(`  ✓ Price exists: ${priceSpec.envVar} = ${price.id}`);
    return price;
  }
  const params = {
    product: product.id,
    unit_amount: priceSpec.amount,
    currency: 'usd',
    metadata: priceSpec.metadata,
    ...(priceSpec.oneTime ? {} : { recurring: { interval: priceSpec.interval } }),
  };
  price = await stripe.prices.create(params);
  console.log(`  + Price created: ${priceSpec.envVar} = ${price.id}`);
  return price;
}

const envLines = [];

for (const spec of PRODUCTS) {
  const product = await ensureProduct(spec);
  for (const priceSpec of spec.prices) {
    const price = await ensurePrice(product, priceSpec);
    envLines.push({ envVar: priceSpec.envVar, value: price.id });
  }
}

console.log('\nEnv vars to add to .env.local:');
console.log('─'.repeat(60));
for (const { envVar, value } of envLines) {
  console.log(`${envVar}=${value}`);
  console.log(`NEXT_PUBLIC_${envVar}=${value}`);
}
console.log('─'.repeat(60));

// Print a single block for easy redirect
console.log('\n# COPY-PASTE BLOCK:');
const block = envLines.map(({ envVar, value }) => `${envVar}=${value}\nNEXT_PUBLIC_${envVar}=${value}`).join('\n');
console.log(block);
