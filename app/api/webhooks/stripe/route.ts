import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, priceMap, periodIdFor } from '@/lib/stripe.server';
import {
  applySubGrant,
  applySubscriptionStateChange,
  applyTierUpgrade,
  applyTopUp,
  getUserData,
  tryClaimNotificationEvent,
  type SubscriptionStatus,
} from '@/lib/user-data.server';
import { TIER_MONTHLY_CREDITS, type SubscriptionTier } from '@/lib/credit-costs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function customerForId(customerId: string): Promise<Stripe.Customer | null> {
  const customer = await getStripe().customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer as Stripe.Customer;
}

async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const customer = await customerForId(customerId);
  return customer?.metadata?.userId ?? null;
}

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
function fmtDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function sendTopUpReceipt(opts: { email: string; credits: number; amountCents: number; sessionId: string }) {
  if (!process.env.RESEND_API_KEY) { console.warn('[stripe] RESEND_API_KEY missing — skipping top-up receipt'); return; }
  try {
    const { Resend } = await import('resend');
    const { default: CreditPurchaseReceipt } = await import('@/emails/CreditPurchaseReceipt');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Cast <no-reply@castability.ai>',
      to: opts.email,
      subject: `Receipt — ${fmtUsd(opts.amountCents)} for ${opts.credits.toLocaleString()} credits`,
      react: CreditPurchaseReceipt({
        credits: opts.credits,
        amountPaid: fmtUsd(opts.amountCents),
        orderId: opts.sessionId,
        purchaseDate: fmtDate(new Date()),
        packageLabel: `${opts.credits.toLocaleString()} credits`,
      }),
    });
    console.log(`[stripe] top-up receipt sent to ${opts.email} (${opts.credits} credits)`);
  } catch (err) {
    console.error('[stripe] top-up receipt failed:', err instanceof Error ? err.message : err);
  }
}

async function sendSubscriptionReceipt(opts: {
  email: string;
  tier: SubscriptionTier;
  monthlyCredits: number;
  amountCents: number;
  orderId: string;
  renewalIso: string | null;
  kind: 'new' | 'renewal' | 'switch' | 'downgrade' | 'cancel-scheduled' | 'cancel-final';
  fromTier?: SubscriptionTier;
  proratedCreditsAdded?: number;
}) {
  if (!process.env.RESEND_API_KEY) { console.warn('[stripe] RESEND_API_KEY missing — skipping sub receipt'); return; }
  // For cancel-final the user is dropping to free — we still want to notify.
  // Otherwise, paid tiers only.
  if (opts.tier === 'free' && opts.kind !== 'cancel-final') return;
  try {
    const { Resend } = await import('resend');
    const { default: SubscriptionReceipt } = await import('@/emails/SubscriptionReceipt');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const tierName = opts.tier.charAt(0).toUpperCase() + opts.tier.slice(1);
    const fromName = opts.fromTier ? opts.fromTier.charAt(0).toUpperCase() + opts.fromTier.slice(1) : null;
    let subject: string;
    switch (opts.kind) {
      case 'new':
        subject = `Welcome to Cast ${tierName} — receipt for ${fmtUsd(opts.amountCents)}`; break;
      case 'switch':
        subject = `Switched to Cast ${tierName} — receipt for ${fmtUsd(opts.amountCents)}`; break;
      case 'renewal':
        subject = `Cast ${tierName} renewed — receipt for ${fmtUsd(opts.amountCents)}`; break;
      case 'downgrade':
        subject = `Cast plan changing to ${tierName}${opts.renewalIso ? ` on ${fmtDate(opts.renewalIso)}` : ''}`; break;
      case 'cancel-scheduled':
        subject = `Cast ${tierName} subscription scheduled to cancel`; break;
      case 'cancel-final':
        subject = `Your Cast ${fromName ?? tierName} subscription has ended`; break;
    }
    await resend.emails.send({
      from: 'Cast <no-reply@castability.ai>',
      to: opts.email,
      subject,
      react: SubscriptionReceipt({
        tier: opts.tier,
        monthlyCredits: opts.monthlyCredits,
        amountPaid: fmtUsd(opts.amountCents),
        amountCents: opts.amountCents,
        orderId: opts.orderId,
        purchaseDate: fmtDate(new Date()),
        renewalDate: opts.renewalIso ? fmtDate(opts.renewalIso) : null,
        kind: opts.kind,
        fromTier: opts.fromTier as 'starter' | 'studio' | 'pro' | undefined,
        proratedCreditsAdded: opts.proratedCreditsAdded,
      }),
    });
    console.log(`[stripe] ${opts.kind} sub receipt sent to ${opts.email} (${opts.tier})`);
  } catch (err) {
    console.error('[stripe] sub receipt failed:', err instanceof Error ? err.message : err);
  }
}

function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  return sub.items.data[0]?.price?.id ?? null;
}

function periodFromSubscription(sub: Stripe.Subscription): { start?: number; end?: number } {
  // Stripe v20+: period fields live on the subscription item, not the subscription.
  const item = sub.items.data[0];
  return { start: item?.current_period_start, end: item?.current_period_end };
}

function subIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

function isoFromUnix(seconds: number | null | undefined): string | undefined {
  return seconds ? new Date(seconds * 1000).toISOString() : undefined;
}

function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case 'active': return 'active';
    case 'trialing': return 'trialing';
    case 'past_due': return 'past_due';
    case 'canceled': return 'canceled';
    case 'incomplete': return 'incomplete';
    case 'incomplete_expired': return 'canceled';
    case 'unpaid': return 'past_due';
    case 'paused': return 'past_due';
    default: return 'none';
  }
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[stripe webhook] signature verification failed:', msg);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[stripe webhook] handler error for ${event.type} (${event.id}):`, msg);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  const map = priceMap();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      if (!userId) { console.warn('[stripe] checkout.session.completed missing userId'); return; }

      if (session.mode === 'subscription') {
        // Subscription details land via customer.subscription.created/updated;
        // we just persist customer ID here so portal works immediately.
        if (typeof session.customer === 'string') {
          await applySubscriptionStateChange(userId, { stripeCustomerId: session.customer });
        }
        // First-period grant happens on customer.subscription.created (below).
      } else if (session.mode === 'payment') {
        // Top-up pack purchase: resolve pack via line item price.
        const stripe = getStripe();
        const expanded = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
        const priceId = expanded.line_items?.data[0]?.price?.id;
        const entry = priceId ? map[priceId] : undefined;
        const topupCredits = entry?.topupCredits;
        if (!topupCredits) { console.warn(`[stripe] top-up session has no credit mapping for price ${priceId}`); return; }
        const amountCents = session.amount_total ?? 0;
        const result = await applyTopUp(userId, {
          credits: topupCredits,
          amount: amountCents,
          sessionId: session.id,
        });
        // Only email on first apply — replays return granted=false.
        if (result.granted) {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
          const email = session.customer_details?.email
            ?? (customerId ? (await customerForId(customerId))?.email : null);
          if (email) {
            await sendTopUpReceipt({ email, credits: topupCredits, amountCents, sessionId: session.id });
          } else {
            console.warn(`[stripe] top-up granted but no email available for session ${session.id}`);
          }
        }
      }
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const customer = await customerForId(customerId);
      const userId = customer?.metadata?.userId ?? null;
      if (!userId) { console.warn(`[stripe] no userId for customer ${customerId}`); return; }

      const priceId = priceIdFromSubscription(sub);
      const entry = priceId ? map[priceId] : undefined;
      const status = mapStatus(sub.status);
      // If the sub is no longer paying us, the user has no plan — even if the
      // priceId on the sub still resolves to a tier. Otherwise a `.deleted` →
      // `.updated` race (or a never-paid `incomplete` sub) would mis-set tier.
      const accessGranted = status === 'active' || status === 'trialing' || status === 'past_due';
      const tier = accessGranted ? (entry?.tier ?? 'free') : 'free';
      const period = periodFromSubscription(sub);
      const periodStart = isoFromUnix(period.start);
      const periodEnd = isoFromUnix(period.end);

      // Capture pre-update state so we can detect a mid-cycle tier change
      // and cancel-scheduled toggles.
      const prior = await getUserData(userId);
      const priorTier = prior.subscription?.tier ?? 'free';
      const priorPriceId = prior.subscription?.lastPriceId;
      const priorCancelAtPeriodEnd = !!prior.subscription?.cancelAtPeriodEnd;

      // Sync state metadata
      await applySubscriptionStateChange(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: accessGranted ? sub.id : undefined,
        tier,
        status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        lastPriceId: priceId ?? undefined,
      });

      // Mid-cycle tier change detection: priceId changed within the same
      // active subscription. Apply prorated credits for upgrades.
      if (event.type === 'customer.subscription.updated'
          && accessGranted
          && entry?.tier
          && priorTier !== 'free'
          && priorPriceId
          && priorPriceId !== priceId
          && period.start && period.end) {
        const oldAllowance = TIER_MONTHLY_CREDITS[priorTier] ?? 0;
        const newAllowance = TIER_MONTHLY_CREDITS[entry.tier] ?? 0;
        if (newAllowance > oldAllowance) {
          const nowSec = Math.floor(Date.now() / 1000);
          const daysRemaining = Math.max(0, (period.end - nowSec) / 86400);
          const totalDays = Math.max(1, (period.end - period.start) / 86400);
          const upgrade = await applyTierUpgrade(userId, {
            newTier: entry.tier,
            oldAllowance,
            newAllowance,
            daysRemaining,
            totalDays,
            eventId: event.id,
          });
          if (upgrade.granted && customer?.email) {
            console.log(`[stripe] tier upgrade ${priorTier}→${entry.tier} granted ${upgrade.delta} prorated credits to ${customer.email}`);
            // Receipt for the prorated charge. Resolve the latest invoice for
            // the actual amount Stripe charged on this switch.
            let switchAmountCents = 0;
            if (sub.latest_invoice) {
              if (typeof sub.latest_invoice === 'string') {
                try {
                  const inv = await getStripe().invoices.retrieve(sub.latest_invoice);
                  switchAmountCents = inv.amount_paid ?? 0;
                } catch (e) {
                  console.error('[stripe] switch receipt: failed to retrieve latest_invoice:', e instanceof Error ? e.message : e);
                }
              } else {
                switchAmountCents = (sub.latest_invoice as Stripe.Invoice).amount_paid ?? 0;
              }
            }
            await sendSubscriptionReceipt({
              email: customer.email,
              tier: entry.tier,
              monthlyCredits: newAllowance,
              amountCents: switchAmountCents,
              orderId: sub.id,
              renewalIso: periodEnd ?? null,
              kind: 'switch',
              fromTier: priorTier as SubscriptionTier,
              proratedCreditsAdded: upgrade.delta,
            });
          }
        } else {
          console.log(`[stripe] tier downgrade ${priorTier}→${entry.tier} (no clawback; smaller allowance lands next cycle)`);
          if (customer?.email && await tryClaimNotificationEvent(userId, event.id)) {
            await sendSubscriptionReceipt({
              email: customer.email,
              tier: entry.tier,
              monthlyCredits: newAllowance,
              amountCents: 0, // no charge on downgrade
              orderId: sub.id,
              renewalIso: periodEnd ?? null,
              kind: 'downgrade',
              fromTier: priorTier as SubscriptionTier,
            });
          }
        }
      }

      // Cancel-at-period-end toggle: false → true. The user clicked "Switch
      // to Free" (or canceled via the Stripe portal). Send a confirmation.
      if (event.type === 'customer.subscription.updated'
          && accessGranted
          && entry?.tier
          && !priorCancelAtPeriodEnd
          && sub.cancel_at_period_end) {
        if (customer?.email && await tryClaimNotificationEvent(userId, event.id)) {
          await sendSubscriptionReceipt({
            email: customer.email,
            tier: entry.tier,
            monthlyCredits: TIER_MONTHLY_CREDITS[entry.tier] ?? 0,
            amountCents: 0,
            orderId: sub.id,
            renewalIso: periodEnd ?? null,
            kind: 'cancel-scheduled',
          });
        }
      }

      // First-period grant (idempotent on periodId). For a freshly-created
      // subscription Stripe also fires invoice.payment_succeeded with
      // billing_reason='subscription_create' which our handler dedupes via
      // lastGrantedPeriodId. We send the welcome receipt here (rather than
      // from the invoice handler) so the email goes out the moment the sub
      // becomes active.
      if (status === 'active' || status === 'trialing') {
        if (period.start && period.end && entry?.tier) {
          const grant = await applySubGrant(userId, {
            tier: entry.tier,
            periodId: periodIdFor(sub.id, period.start),
            periodStart: periodStart!,
            periodEnd: periodEnd!,
            eventId: event.id,
          });
          if (grant.granted && customer?.email) {
            // Webhook payloads ship latest_invoice as just the ID string —
            // resolve it to get the actual amount paid for the receipt.
            let amountCents = 0;
            if (sub.latest_invoice) {
              if (typeof sub.latest_invoice === 'string') {
                try {
                  const inv = await getStripe().invoices.retrieve(sub.latest_invoice);
                  amountCents = inv.amount_paid ?? 0;
                } catch (e) {
                  console.error('[stripe] failed to retrieve latest_invoice for receipt:', e instanceof Error ? e.message : e);
                }
              } else {
                amountCents = (sub.latest_invoice as Stripe.Invoice).amount_paid ?? 0;
              }
            }
            const isNew = event.type === 'customer.subscription.created';
            await sendSubscriptionReceipt({
              email: customer.email,
              tier: entry.tier,
              monthlyCredits: grant.allowance,
              amountCents,
              orderId: sub.id,
              renewalIso: periodEnd ?? null,
              kind: isNew ? 'new' : 'renewal',
            });
          }
        }
      }
      return;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const reason = invoice.billing_reason;
      // Only act on renewals here; subscription_create is handled via customer.subscription.created
      if (reason !== 'subscription_cycle' && reason !== 'subscription_update') return;

      const subId = subIdFromInvoice(invoice);
      if (!subId) return;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) return;
      const customer = await customerForId(customerId);
      const userId = customer?.metadata?.userId ?? null;
      if (!userId) { console.warn(`[stripe] no userId for invoice customer ${customerId}`); return; }

      const sub = await getStripe().subscriptions.retrieve(subId);
      const priceId = priceIdFromSubscription(sub);
      const entry = priceId ? map[priceId] : undefined;
      if (!entry?.tier) { console.warn(`[stripe] renewal has no tier mapping for price ${priceId}`); return; }

      const period = periodFromSubscription(sub);
      const periodStart = isoFromUnix(period.start);
      const periodEnd = isoFromUnix(period.end);
      if (!period.start || !periodStart || !periodEnd) return;

      const grant = await applySubGrant(userId, {
        tier: entry.tier,
        periodId: periodIdFor(sub.id, period.start),
        periodStart,
        periodEnd,
        eventId: event.id,
      });
      // Send renewal receipt only when this was a real grant. The initial
      // sub-create invoice's grant is already deduped by lastGrantedPeriodId
      // (the customer.subscription.created handler beats us to it), so we
      // won't double-send for new subs.
      if (grant.granted && customer?.email) {
        await sendSubscriptionReceipt({
          email: customer.email,
          tier: entry.tier,
          monthlyCredits: grant.allowance,
          amountCents: invoice.amount_paid ?? 0,
          orderId: invoice.id ?? sub.id,
          renewalIso: periodEnd,
          kind: 'renewal',
        });
      }
      return;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) return;
      const userId = await userIdFromCustomer(customerId);
      if (!userId) return;
      await applySubscriptionStateChange(userId, { status: 'past_due' });
      return;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const customer = await customerForId(customerId);
      const userId = customer?.metadata?.userId ?? null;
      if (!userId) return;
      // Capture the tier we're cancelling FROM before we overwrite it.
      const prior = await getUserData(userId);
      const priorTier = prior.subscription?.tier ?? 'free';
      await applySubscriptionStateChange(userId, {
        tier: 'free',
        status: 'canceled',
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: undefined,
      });
      if (customer?.email && priorTier !== 'free' && await tryClaimNotificationEvent(userId, event.id)) {
        await sendSubscriptionReceipt({
          email: customer.email,
          tier: 'free',
          monthlyCredits: 0,
          amountCents: 0,
          orderId: sub.id,
          renewalIso: null,
          kind: 'cancel-final',
          fromTier: priorTier as SubscriptionTier,
        });
      }
      return;
    }

    default:
      // Ignore other event types
      return;
  }
}
