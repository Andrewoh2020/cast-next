/**
 * End-to-end backend verification of the subscription + drip + top-up plumbing.
 *
 * What this exercises (against real test-mode Stripe + real Vercel Blob):
 *   1. Create Stripe customer with metadata.userId
 *   2. Create Studio Monthly subscription → webhook fires → user blob updated
 *   3. Verify tier/credits/ledger written correctly
 *   4. Replay the subscription event → verify idempotency (no double-grant)
 *   5. Inject a signed checkout.session.completed for Boost top-up → verify +500 credits
 *   6. Replay top-up event → verify session-id idempotency
 *   7. Cancel subscription → verify status=canceled, tier=free, credits preserved
 *   8. Cleanup: delete test Stripe customer + blob
 *
 * Uses a synthetic userId (`test_backend_verify_<timestamp>`) so no real user
 * blob is modified. Requires the dev server + `stripe listen` to be running.
 */

import Stripe from 'stripe';
import { get, del } from '@vercel/blob';
import { readFileSync } from 'node:fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Snapshot the dev server log so receipt-email assertions can grep for new
// "[stripe] ... receipt sent to ..." lines emitted during this test run.
const DEV_LOG_PATH = '/tmp/cast-dev.log';
let devLogStartOffset = 0;
try { devLogStartOffset = readFileSync(DEV_LOG_PATH, 'utf-8').length; } catch {}
function newDevLog() {
  try {
    const all = readFileSync(DEV_LOG_PATH, 'utf-8');
    return all.slice(devLogStartOffset);
  } catch { return ''; }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STUDIO_PRICE = process.env.STRIPE_PRICE_STUDIO_MONTHLY;
const BOOST_PRICE = process.env.STRIPE_PRICE_TOPUP_BOOST;
const PRO_PRICE = process.env.STRIPE_PRICE_PRO_MONTHLY;
const STARTER_PRICE = process.env.STRIPE_PRICE_STARTER_MONTHLY;

if (!WEBHOOK_SECRET || !STUDIO_PRICE || !BOOST_PRICE || !PRO_PRICE || !STARTER_PRICE) {
  console.error('Missing env: STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_STUDIO_MONTHLY / STRIPE_PRICE_TOPUP_BOOST / STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_STARTER_MONTHLY');
  process.exit(1);
}

const TEST_USER_ID = `test_backend_verify_${Date.now()}`;
const BLOB_PATH = `users/${TEST_USER_ID}/data.json`;

// Coloring for terminal pass/fail
const ok  = (s) => `\x1b[32m✓\x1b[0m ${s}`;
const bad = (s) => `\x1b[31m✗\x1b[0m ${s}`;
const dim = (s) => `\x1b[90m${s}\x1b[0m`;

let passed = 0, failed = 0;
function assert(name, cond, detail = '') {
  if (cond) { console.log(ok(name)); passed++; }
  else { console.log(bad(`${name}${detail ? ' — ' + detail : ''}`)); failed++; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readBlob() {
  const res = await get(BLOB_PATH, { access: 'private', useCache: false });
  if (!res?.stream) return null;
  const text = await new Response(res.stream).text();
  return JSON.parse(text);
}

async function postSignedEvent(eventObject) {
  const payload = JSON.stringify(eventObject);
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': header },
    body: payload,
  });
  return { status: res.status, body: await res.text() };
}

async function pollFor(predicate, { tries = 20, delay = 500, label } = {}) {
  for (let i = 0; i < tries; i++) {
    const data = await readBlob();
    if (data && predicate(data)) return data;
    await sleep(delay);
  }
  console.log(dim(`  (timed out waiting for: ${label ?? 'condition'})`));
  return await readBlob();
}

// Email sends are async + Resend latency varies. Poll the dev log for the
// expected line up to ~6s so we don't get flaky assertions.
async function waitForLog(regex, { tries = 8, delay = 750 } = {}) {
  for (let i = 0; i < tries; i++) {
    const m = newDevLog().match(regex);
    if (m) return m;
    await sleep(delay);
  }
  return null;
}

let customerId = null;
let subscriptionId = null;

console.log(`\n==== Backend verification: ${TEST_USER_ID} ====\n`);

try {
  // ──────── 1. Create test customer ────────
  console.log('1. Creating Stripe customer with userId metadata');
  const customer = await stripe.customers.create({
    email: `${TEST_USER_ID}@example.test`,
    metadata: { userId: TEST_USER_ID },
    payment_method: 'pm_card_visa',
    invoice_settings: { default_payment_method: 'pm_card_visa' },
  });
  customerId = customer.id;
  assert('customer created', !!customerId);
  assert('customer has userId metadata', customer.metadata.userId === TEST_USER_ID);

  // ──────── 2. Create Studio subscription ────────
  console.log('\n2. Creating Studio Monthly subscription (fires webhook)');
  // Default payment_behavior auto-charges the customer's default payment method
  // (pm_card_visa, set on the customer above), so the sub immediately becomes
  // active in test mode — same end state a real Checkout flow reaches.
  const sub = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: STUDIO_PRICE }],
  });
  subscriptionId = sub.id;
  assert('subscription created', !!subscriptionId);
  assert(`subscription is active (got ${sub.status})`, sub.status === 'active' || sub.status === 'trialing');

  // Wait for the webhook to land + apply
  console.log(dim('   waiting for webhook → applySubGrant…'));
  const afterSub = await pollFor(
    (d) => d?.subscription?.tier === 'studio' && (d?.credits ?? 0) >= 1200,
    { label: 'subscription tier=studio with 1200 credits' },
  );

  assert('blob created', !!afterSub);
  if (afterSub) {
    assert('subscription.tier === studio', afterSub.subscription?.tier === 'studio');
    assert('subscription.status active/trialing', ['active', 'trialing'].includes(afterSub.subscription?.status));
    assert('subscription.stripeCustomerId set', afterSub.subscription?.stripeCustomerId === customer.id);
    assert('subscription.stripeSubscriptionId set', afterSub.subscription?.stripeSubscriptionId === sub.id);
    assert('credits === 1200', afterSub.credits === 1200, `got ${afterSub.credits}`);
    const lastLedger = afterSub.ledger?.[0];
    assert("ledger top entry reason === 'sub-grant'", lastLedger?.reason === 'sub-grant');
    assert('ledger entry delta === 1200', lastLedger?.delta === 1200);
    assert('ledger entry has periodId', !!lastLedger?.meta?.periodId);
    // Email receipt assertion (server-side log)
    const sentLine = await waitForLog(/\[stripe\] new sub receipt sent to ([^\s]+)/);
    assert('subscription welcome receipt log line present', !!sentLine,
      `dev log missing "[stripe] new sub receipt sent to …" line`);
    if (sentLine) assert('receipt addressed to test customer', sentLine[1] === customer.email);
    const log = newDevLog();
    // Verify receipt amount was non-zero (regression: latest_invoice came as a
    // string ID in the webhook, not the expanded object — handler was reading
    // amount_paid off undefined and emailing $0).
    assert('webhook did not log a $0 amount fallback', !log.includes('failed to retrieve latest_invoice'));
    // Cross-check the actual invoice in Stripe to confirm a real charge happened.
    const invoices = await stripe.invoices.list({ customer: customer.id, limit: 1 });
    const lastInvoice = invoices.data[0];
    assert('first invoice paid > $0', (lastInvoice?.amount_paid ?? 0) > 0,
      `amount_paid=${lastInvoice?.amount_paid}`);
  }

  // ──────── 3. Idempotency: replay the subscription.updated event ────────
  console.log('\n3. Replaying subscription.updated event (idempotency)');
  // Fetch a recent event for this subscription
  const events = await stripe.events.list({ type: 'customer.subscription.updated', limit: 5 });
  const subEvent = events.data.find((e) => {
    const obj = e.data.object;
    return obj.object === 'subscription' && obj.id === sub.id;
  }) ?? events.data[0];

  if (subEvent) {
    const before = await readBlob();
    const before_credits = before.credits;
    const before_ledger_len = before.ledger?.length ?? 0;
    const replayResp = await postSignedEvent(subEvent);
    assert('replay returned 200', replayResp.status === 200, `got ${replayResp.status}: ${replayResp.body}`);
    await sleep(1000);
    const after = await readBlob();
    assert('credits unchanged after replay', after.credits === before_credits, `was ${before_credits}, now ${after.credits}`);
    assert('ledger unchanged after replay (no new sub-grant)', after.ledger.length === before_ledger_len);
  } else {
    console.log(dim('   no subscription.updated event found — skipping replay test'));
  }

  // ──────── 4. Top-up flow (signed checkout.session.completed) ────────
  console.log('\n4. Injecting signed checkout.session.completed (Boost top-up)');
  // Create an actual Stripe Checkout session so line_items.data[0].price.id resolves
  // when the handler retrieves the session via stripe.checkout.sessions.retrieve.
  const realSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customer.id,
    client_reference_id: TEST_USER_ID,
    line_items: [{ price: BOOST_PRICE, quantity: 1 }],
    success_url: 'https://example.test/success',
    cancel_url: 'https://example.test/cancel',
    metadata: { userId: TEST_USER_ID, kind: 'topup' },
  });
  // Stripe won't mark a Checkout session "complete" without a real browser flow,
  // so we synthesize a webhook event that references the real session and fire it.
  const completedSession = { ...realSession, payment_status: 'paid', amount_total: 2500 };
  const fakeEvent = {
    id: `evt_test_topup_${Date.now()}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: completedSession },
    created: Math.floor(Date.now() / 1000),
  };

  const beforeTopup = await readBlob();
  const beforeTopupCredits = beforeTopup.credits;

  // Note: handler will call stripe.checkout.sessions.retrieve(realSession.id, expand:['line_items'])
  // which works because the session is real (just unpaid in Stripe's eyes; the handler doesn't check)
  const topupResp = await postSignedEvent(fakeEvent);
  assert('top-up event returned 200', topupResp.status === 200, `got ${topupResp.status}: ${topupResp.body}`);
  await sleep(1500);
  const afterTopup = await readBlob();
  assert('credits += 500 after top-up', afterTopup.credits === beforeTopupCredits + 500,
    `was ${beforeTopupCredits}, now ${afterTopup.credits}`);
  const topupLedger = afterTopup.ledger?.[0];
  assert("top-up ledger entry reason === 'top-up'", topupLedger?.reason === 'top-up');
  assert('top-up ledger delta === 500', topupLedger?.delta === 500);
  assert('top-up ledger has sessionId', !!topupLedger?.meta?.sessionId);
  // Top-up receipt assertion
  const topupSent = await waitForLog(/\[stripe\] top-up receipt sent to ([^\s]+) \(500 credits\)/);
  assert('top-up receipt log line present', !!topupSent);
  if (topupSent) assert('top-up receipt addressed to test customer', topupSent[1] === customer.email);

  // ──────── 5. Idempotency on top-up: replay same session ────────
  console.log('\n5. Replaying top-up event (sessionId idempotency)');
  const beforeReplayCredits = afterTopup.credits;
  const beforeReplayLedger = afterTopup.ledger.length;
  const logBeforeReplay = newDevLog();
  const replayTopup = await postSignedEvent(fakeEvent);
  assert('top-up replay returned 200', replayTopup.status === 200);
  await sleep(1500);
  const afterReplay = await readBlob();
  assert('credits unchanged on top-up replay', afterReplay.credits === beforeReplayCredits,
    `was ${beforeReplayCredits}, now ${afterReplay.credits}`);
  assert('no new ledger entry on replay', afterReplay.ledger.length === beforeReplayLedger);
  // No new receipt email should have fired on replay
  const newLogSinceReplay = newDevLog().slice(logBeforeReplay.length);
  const extraReceipt = newLogSinceReplay.match(/top-up receipt sent/);
  assert('no duplicate receipt email on replay', !extraReceipt);

  // ──────── 5b. Upgrade Studio → Pro mid-cycle ────────
  console.log('\n5b. Upgrading Studio → Pro mid-cycle');
  const beforeUpgrade = await readBlob();
  const beforeUpgradeCredits = beforeUpgrade.credits;
  // Trigger the same Stripe API call that /api/billing/switch makes.
  const refreshedSub = await stripe.subscriptions.retrieve(sub.id);
  const itemId = refreshedSub.items.data[0].id;
  await stripe.subscriptions.update(sub.id, {
    items: [{ id: itemId, price: PRO_PRICE }],
    proration_behavior: 'always_invoice',
    cancel_at_period_end: false,
    payment_behavior: 'allow_incomplete',
  });
  console.log(dim('   waiting for customer.subscription.updated → applyTierUpgrade…'));
  // Tier updates and credit grant are two sequential writes from the webhook.
  // Wait until BOTH land (pollFor would otherwise catch the intermediate state).
  const afterUpgrade = await pollFor(
    (d) => d?.subscription?.tier === 'pro' && (d?.credits ?? 0) > beforeUpgradeCredits,
    { label: 'tier=pro AND credits bumped', tries: 30 },
  );
  assert('tier === pro after upgrade', afterUpgrade?.subscription?.tier === 'pro');
  // Prorated credits should land. Studio→Pro near start of cycle ≈ (4000-1200) × ~30/30 = ~2800.
  // Allow generous lower bound since exact ratio depends on test timing.
  const upgradeDelta = (afterUpgrade?.credits ?? 0) - beforeUpgradeCredits;
  assert(`prorated credits granted (~2800 expected, got ${upgradeDelta})`, upgradeDelta >= 2700 && upgradeDelta <= 2800);
  const upgradeLedger = afterUpgrade?.ledger?.find((e) => e.meta?.kind === 'upgrade-proration');
  assert("upgrade ledger entry present (kind='upgrade-proration')", !!upgradeLedger);
  assert('upgrade ledger meta.newTier === pro', upgradeLedger?.meta?.newTier === 'pro');
  // Switch receipt must fire — bug we just fixed.
  const switchReceipt = await waitForLog(/\[stripe\] switch sub receipt sent to ([^\s]+) \(pro\)/);
  assert('switch sub receipt log line present', !!switchReceipt,
    'webhook ran applyTierUpgrade but no switch receipt logged');
  if (switchReceipt) assert('switch receipt addressed to test customer', switchReceipt[1] === customer.email);
  // Stripe should have created an invoice for the prorated charge against the
  // saved card (no human re-enters card details on a switch).
  const switchInvoices = await stripe.invoices.list({ customer: customer.id, limit: 5 });
  const prorationInvoice = switchInvoices.data.find((i) =>
    i.parent?.subscription_details?.subscription === sub.id
    && (i.billing_reason === 'subscription_update' || (i.amount_paid ?? 0) > 1900),
  );
  assert('Stripe created a prorated invoice for the switch', !!prorationInvoice);
  assert('prorated invoice was paid by saved card (status=paid)', prorationInvoice?.status === 'paid');
  assert('prorated invoice amount > $0', (prorationInvoice?.amount_paid ?? 0) > 0);

  // ──────── 5c. Downgrade Pro → Starter mid-cycle (no charge, no clawback) ────────
  console.log('\n5c. Downgrading Pro → Starter mid-cycle');
  const beforeDowngrade = await readBlob();
  const beforeDowngradeCredits = beforeDowngrade.credits;
  const refreshedSub2 = await stripe.subscriptions.retrieve(sub.id);
  const itemId2 = refreshedSub2.items.data[0].id;
  await stripe.subscriptions.update(sub.id, {
    items: [{ id: itemId2, price: STARTER_PRICE }],
    proration_behavior: 'none', // downgrade: no immediate charge
  });
  console.log(dim('   waiting for tier=starter…'));
  const afterDowngrade = await pollFor(
    (d) => d?.subscription?.tier === 'starter',
    { label: 'tier=starter' },
  );
  assert('tier === starter after downgrade', afterDowngrade?.subscription?.tier === 'starter');
  assert('credits NOT clawed back on downgrade', afterDowngrade?.credits === beforeDowngradeCredits,
    `was ${beforeDowngradeCredits}, now ${afterDowngrade?.credits}`);
  // Downgrade email
  const downgradeReceipt = await waitForLog(/\[stripe\] downgrade sub receipt sent to ([^\s]+) \(starter\)/);
  assert('downgrade sub receipt log line present', !!downgradeReceipt);
  if (downgradeReceipt) assert('downgrade receipt addressed to test customer', downgradeReceipt[1] === customer.email);

  // ──────── 6a. Cancel-at-period-end (Switch to Free flow) ────────
  console.log('\n6a. Scheduling cancel-at-period-end (Switch to Free)');
  // Mirror what /api/billing/cancel does
  await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
  console.log(dim('   waiting for cancelAtPeriodEnd to land in blob…'));
  const afterScheduledCancel = await pollFor(
    (d) => d?.subscription?.cancelAtPeriodEnd === true,
    { label: 'cancelAtPeriodEnd=true' },
  );
  assert('cancelAtPeriodEnd=true after scheduled cancel', afterScheduledCancel?.subscription?.cancelAtPeriodEnd === true);
  assert("status still 'active' (sub doesn't end until period close)", afterScheduledCancel?.subscription?.status === 'active');
  assert('tier still starter until period end', afterScheduledCancel?.subscription?.tier === 'starter');
  // Cancel-scheduled email
  const scheduledReceipt = await waitForLog(/\[stripe\] cancel-scheduled sub receipt sent to ([^\s]+)/);
  assert('cancel-scheduled sub receipt log line present', !!scheduledReceipt);
  if (scheduledReceipt) assert('cancel-scheduled receipt addressed to test customer', scheduledReceipt[1] === customer.email);
  // Reactivation path: clicking a paid plan should clear cancel_at_period_end via /api/billing/switch.
  // Verify by un-canceling directly (same Stripe call /switch makes).
  await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
  const afterReactivate = await pollFor(
    (d) => d?.subscription?.cancelAtPeriodEnd === false,
    { label: 'cancelAtPeriodEnd=false (reactivated)' },
  );
  assert('cancelAtPeriodEnd=false after reactivate', afterReactivate?.subscription?.cancelAtPeriodEnd === false);

  // ──────── 6b. Hard cancel (full subscription deleted) ────────
  console.log('\n6b. Hard cancelling subscription');
  const beforeCancel = await readBlob();
  await stripe.subscriptions.cancel(sub.id);
  console.log(dim('   waiting for customer.subscription.deleted webhook…'));
  const afterCancel = await pollFor(
    (d) => d?.subscription?.status === 'canceled' && d?.subscription?.tier === 'free',
    { label: 'tier=free, status=canceled' },
  );
  assert("subscription.tier === 'free' after cancel", afterCancel.subscription?.tier === 'free');
  assert("subscription.status === 'canceled'", afterCancel.subscription?.status === 'canceled');
  assert('credits preserved after cancel', afterCancel.credits === beforeCancel.credits,
    `was ${beforeCancel.credits}, now ${afterCancel.credits}`);
  // Cancel-final email
  const finalReceipt = await waitForLog(/\[stripe\] cancel-final sub receipt sent to ([^\s]+) \(free\)/);
  assert('cancel-final sub receipt log line present', !!finalReceipt);
  if (finalReceipt) assert('cancel-final receipt addressed to test customer', finalReceipt[1] === customer.email);

} catch (err) {
  console.error(bad('FATAL:'), err.message);
  failed++;
} finally {
  // ──────── Cleanup ────────
  console.log('\nCleanup');
  if (customerId) {
    try {
      await stripe.customers.del(customerId);
      console.log(ok(`deleted Stripe customer ${customerId}`));
    } catch (e) {
      console.log(bad(`customer cleanup failed: ${e.message}`));
    }
  }
  try {
    await del(BLOB_PATH);
    console.log(ok(`deleted blob ${BLOB_PATH}`));
  } catch (e) {
    console.log(bad(`blob cleanup failed: ${e.message}`));
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}
