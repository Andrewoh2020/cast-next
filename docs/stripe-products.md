# Stripe Products & Prices — Cast subscriptions + top-ups

This doc is the source of truth for what to create in the Stripe Dashboard
(test mode first, then live). Each row maps to one env var; the webhook and
billing routes resolve tier/credits via `lib/stripe.server.ts:priceMap()`.

## Subscription products (mode=subscription)

Create one Product per tier. Add **two recurring Prices** to each (monthly +
annual). Set Price `metadata`:
- `tier`: `starter | studio | pro`
- `monthlyCredits`: `400 | 1200 | 4000`
- `cadence`: `monthly | annual`

| Product | Cadence | Amount | Env var | Notes |
|---|---|---|---|---|
| Cast Starter | Monthly | $19.00 | `STRIPE_PRICE_STARTER_MONTHLY` | 400 credits/mo |
| Cast Starter | Annual | $190.00 | `STRIPE_PRICE_STARTER_ANNUAL` | ~17% off; credits granted monthly |
| Cast Studio | Monthly | $49.00 | `STRIPE_PRICE_STUDIO_MONTHLY` | 1,200 credits/mo (default tier) |
| Cast Studio | Annual | $490.00 | `STRIPE_PRICE_STUDIO_ANNUAL` | ~17% off |
| Cast Pro | Monthly | $129.00 | `STRIPE_PRICE_PRO_MONTHLY` | 4,000 credits/mo |
| Cast Pro | Annual | $1,290.00 | `STRIPE_PRICE_PRO_ANNUAL` | ~17% off |

Annual prices grant credits **monthly via the renewal webhook**, not all
upfront — protects against arbitrage and gives buffer for cancellation.

## Top-up products (mode=payment)

Create one Product per pack with a **one-time Price**. Set Price `metadata`:
- `topupCredits`: `500 | 1500`

| Product | Amount | Env var | Notes |
|---|---|---|---|
| Cast Boost (500 credits) | $25.00 | `STRIPE_PRICE_TOPUP_BOOST` | $0.05/cr |
| Cast Power (1,500 credits) | $60.00 | `STRIPE_PRICE_TOPUP_POWER` | $0.04/cr |

Pricing intentionally above Pro's $0.032/cr so top-ups never undercut subs.

## Webhook setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://www.castability.ai/api/webhooks/stripe`
   - Preview/test: `https://<preview-host>/api/webhooks/stripe` and use Stripe CLI
   - Events to subscribe to (minimum):
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
2. Copy the Signing Secret → `STRIPE_WEBHOOK_SECRET` env var.
3. For local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and use the temp signing secret it prints.

## Customer Portal

Configure once per environment (Test / Live):
1. Stripe Dashboard → Settings → Billing → Customer Portal.
2. Enable: switch plan, cancel subscription (immediate or end-of-cycle), update payment method, view invoices.
3. Allow customers to switch to any of the 6 sub Prices above.
4. Set return URL to `https://www.castability.ai/account` (or override per session in `app/api/billing/portal/route.ts`).

## Required env vars

```
STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_STARTER_MONTHLY=price_…
STRIPE_PRICE_STARTER_ANNUAL=price_…
STRIPE_PRICE_STUDIO_MONTHLY=price_…
STRIPE_PRICE_STUDIO_ANNUAL=price_…
STRIPE_PRICE_PRO_MONTHLY=price_…
STRIPE_PRICE_PRO_ANNUAL=price_…
STRIPE_PRICE_TOPUP_BOOST=price_…
STRIPE_PRICE_TOPUP_POWER=price_…
```

Add to `.env.local` for dev, Vercel project settings for preview/production.

## Verification (Stripe test mode)

1. **Subscribe**: hit `/api/billing/subscribe` with `STRIPE_PRICE_STUDIO_MONTHLY` → complete Checkout → verify webhook grants 1,200 credits and ledger entry.
2. **Renewal**: `stripe trigger invoice.payment_succeeded --override invoice:billing_reason=subscription_cycle` → verify second `sub-grant` ledger entry, prior unspent expired.
3. **Cancel via Portal**: `cancel_at_period_end=true` syncs in `subscription`. After period end, `customer.subscription.deleted` → tier drops to `free`, drip resumes.
4. **Top-up**: hit `/api/billing/subscribe` with `STRIPE_PRICE_TOPUP_BOOST` → complete Checkout → verify +500 credits, ledger `top-up`, idempotent on session.id replay.
5. **Replay any event** via `stripe events resend <event_id>` → no double-grant (eventId/periodId/sessionId dedupe).
