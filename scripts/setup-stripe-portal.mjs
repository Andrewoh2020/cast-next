/**
 * Configure the Stripe Customer Portal so users can switch plans, cancel,
 * update payment methods, and view invoice history without leaving Stripe.
 *
 * The portal does NOT expose plan switching by default — you have to register
 * each Product + its allowed Prices in the portal configuration. Without this,
 * /api/billing/portal opens a session that only shows cancel + payment method.
 *
 * Idempotent: updates the existing default portal configuration if one exists,
 * otherwise creates a new one and sets it as default.
 *
 * Usage:
 *   node scripts/setup-stripe-portal.mjs
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') && process.env.ALLOW_LIVE !== '1') {
  console.error('Refusing to run against LIVE key without ALLOW_LIVE=1.');
  process.exit(1);
}
if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) console.log('⚠️  Running against LIVE Stripe.');

const SUB_PRICE_ENVS = [
  'STRIPE_PRICE_STARTER_MONTHLY', 'STRIPE_PRICE_STARTER_ANNUAL',
  'STRIPE_PRICE_STUDIO_MONTHLY', 'STRIPE_PRICE_STUDIO_ANNUAL',
  'STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_ANNUAL',
];

const priceIds = SUB_PRICE_ENVS.map((env) => process.env[env]).filter(Boolean);
if (priceIds.length === 0) {
  console.error('No STRIPE_PRICE_* env vars set. Run setup-stripe-products.mjs first.');
  process.exit(1);
}

console.log(`Resolving products for ${priceIds.length} prices…`);
const productGroups = new Map(); // productId -> Set<priceId>
for (const id of priceIds) {
  const price = await stripe.prices.retrieve(id);
  const productId = typeof price.product === 'string' ? price.product : price.product.id;
  if (!productGroups.has(productId)) productGroups.set(productId, new Set());
  productGroups.get(productId).add(id);
}

const products = Array.from(productGroups.entries()).map(([product, prices]) => ({
  product,
  prices: Array.from(prices),
}));
for (const p of products) console.log(`  ${p.product}: ${p.prices.length} price(s)`);

const config = {
  business_profile: {
    headline: 'Manage your Cast subscription',
    privacy_policy_url: 'https://www.castability.ai/privacy-policy',
    terms_of_service_url: 'https://www.castability.ai/license-terms',
  },
  features: {
    customer_update: {
      enabled: true,
      allowed_updates: ['email', 'address', 'tax_id', 'name'],
    },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: 'at_period_end',
      proration_behavior: 'none',
      cancellation_reason: {
        enabled: true,
        options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'customer_service', 'too_complex', 'low_quality', 'other'],
      },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products,
    },
  },
};

// Check for an existing default config
const existing = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
let result;
if (existing.data.length > 0) {
  const id = existing.data[0].id;
  console.log(`\nUpdating existing default portal configuration: ${id}`);
  await stripe.billingPortal.configurations.update(id, config);
  result = await stripe.billingPortal.configurations.retrieve(id, { expand: ['features.subscription_update.products'] });
} else {
  console.log('\nCreating new portal configuration as default');
  const created = await stripe.billingPortal.configurations.create({ ...config, default_return_url: 'https://www.castability.ai/account' });
  result = await stripe.billingPortal.configurations.retrieve(created.id, { expand: ['features.subscription_update.products'] });
}

const reg = result.features.subscription_update.products ?? [];
console.log(`\n✓ Portal configuration ${result.id}`);
console.log(`  is_default: ${result.is_default}`);
console.log(`  subscription_update.enabled: ${result.features.subscription_update.enabled}`);
console.log(`  subscription_update registered products: ${reg.length}`);
for (const p of reg) console.log(`    ${p.product} → ${p.prices.length} price(s)`);
console.log(`  subscription_cancel.enabled: ${result.features.subscription_cancel.enabled}`);
console.log(`  payment_method_update.enabled: ${result.features.payment_method_update.enabled}`);
console.log(`  invoice_history.enabled: ${result.features.invoice_history.enabled}`);
