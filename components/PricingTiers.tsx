'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SubscriptionTier } from '@/lib/credit-costs';
import SwitchPlanModal from './SwitchPlanModal';
import CancelSubscriptionModal from './CancelSubscriptionModal';

type Cadence = 'monthly' | 'annual';

interface Tier {
  id: SubscriptionTier;
  name: string;
  monthly: number;
  annual: number;
  credits: number;
  perCredit: string;
  blurb: string;
  highlights: string[];
  recommended?: boolean;
  // Stripe Price IDs (must be literal process.env.NEXT_PUBLIC_* refs so Next
  // statically replaces them in the client bundle).
  monthlyPriceId: string | undefined;
  annualPriceId: string | undefined;
}

const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19,
    annual: 190,
    credits: 400,
    perCredit: '$0.0475',
    blurb: 'For solo creators and hobbyists',
    highlights: ['80 outfits or scenes', '16 character generations', 'No attribution required', 'Cancel anytime'],
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
  },
  {
    id: 'studio',
    name: 'Studio',
    monthly: 49,
    annual: 490,
    credits: 1200,
    perCredit: '$0.041',
    blurb: 'Freelance creatives + small studios',
    highlights: ['240 outfits or scenes', '48 character generations', 'Commercial license — rights persist after cancel', 'Full roster access'],
    recommended: true,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_MONTHLY,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_ANNUAL,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 129,
    annual: 1290,
    credits: 4000,
    perCredit: '$0.032',
    blurb: 'For power users + high volume',
    highlights: ['800 outfits or scenes', '160 character generations', 'Commercial license — rights persist after cancel', 'Founder Slack + early access to betas'],
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
  },
];

const TOPUPS = [
  { name: 'Boost', credits: 500, price: 25, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_BOOST, perCredit: '$0.05' },
  { name: 'Power', credits: 1500, price: 60, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_POWER, perCredit: '$0.04' },
];

interface Props {
  currentTier?: SubscriptionTier;
  hasActiveSub?: boolean;
  isSignedIn?: boolean;
  currentCredits?: number;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export default function PricingTiers({
  currentTier = 'free',
  hasActiveSub = false,
  isSignedIn = false,
  currentCredits = 0,
  currentPeriodEnd = null,
  cancelAtPeriodEnd = false,
}: Props) {
  const [cadence, setCadence] = useState<Cadence>('monthly');
  const [pending, setPending] = useState<string | null>(null);
  const [switchModal, setSwitchModal] = useState<null | { tier: SubscriptionTier; priceId: string; monthly: number; label: string }>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const currentMonthlyCredits = currentTier === 'starter' ? 400
    : currentTier === 'studio' ? 1200
    : currentTier === 'pro' ? 4000
    : 0;

  const handleSubscribe = async (priceId: string | undefined, label: string, tier?: SubscriptionTier, monthly?: number) => {
    if (!isSignedIn) { window.location.assign('/sign-up'); return; }
    if (!priceId) { alert(`${label} not yet configured`); return; }

    // Existing subscriber → open polished SwitchPlanModal with live preview
    if (hasActiveSub && tier && monthly !== undefined) {
      setSwitchModal({ tier, priceId, monthly, label });
      return;
    }

    // New subscriber → Checkout flow
    setPending(label);
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ priceId, returnUrl: '/account' }),
    });
    const data = await res.json();
    if (data.url) window.location.assign(data.url);
    else { alert(data.error || 'Checkout failed'); setPending(null); }
  };

  const confirmSwitch = async () => {
    if (!switchModal) return;
    setPending(switchModal.label);
    const res = await fetch('/api/billing/switch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ newPriceId: switchModal.priceId }),
    });
    const data = await res.json();
    if (res.ok) {
      window.location.assign('/account?billing=success');
    } else {
      alert(data.error || 'Plan switch failed');
      setPending(null);
      setSwitchModal(null);
    }
  };

  const confirmCancel = async () => {
    setPending('cancel');
    const res = await fetch('/api/billing/cancel', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      window.location.assign('/account?billing=success');
    } else {
      alert(data.error || 'Cancel failed');
      setPending(null);
      setCancelModalOpen(false);
    }
  };

  return (
    <div>
      {/* Cadence toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          {(['monthly', 'annual'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCadence(c)}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all capitalize ${
                cadence === c ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              {c}{c === 'annual' && <span className="ml-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500">Save 17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Free + paid tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {/* Free */}
        {(() => {
          // "Current plan" only applies when signed in. For signed-out
          // visitors the Free card must remain a clickable Sign-Up CTA.
          const isFreeCurrent = isSignedIn && ((currentTier === 'free' && !hasActiveSub) || (cancelAtPeriodEnd && hasActiveSub));
          let freeLabel: string;
          if (!isSignedIn) freeLabel = 'Sign up free';
          else if (cancelAtPeriodEnd) freeLabel = 'Cancellation scheduled';
          else if (hasActiveSub) freeLabel = 'Switch to Free';
          else freeLabel = 'Current plan';
          const freeOnClick = () => {
            if (!isSignedIn) { window.location.assign('/sign-up'); return; }
            if (hasActiveSub && !cancelAtPeriodEnd) setCancelModalOpen(true);
          };
          return (
            <TierCard
              name="Free"
              price="$0"
              cadenceLabel=""
              credits="35 to start + 10/day"
              subline="Capped at 25 balance"
              blurb="Try it out, no card required"
              highlights={['Enough for 1 character + 1 scene', '10 credits added daily', 'Must credit Cast in your project']}
              ctaLabel={freeLabel}
              ctaDisabled={isFreeCurrent && !hasActiveSub}
              onCta={freeOnClick}
              isCurrent={isFreeCurrent}
            />
          );
        })()}

        {TIERS.map((tier) => {
          const price = cadence === 'monthly' ? tier.monthly : tier.annual;
          const cadenceLabel = cadence === 'monthly' ? '/mo' : '/yr';
          const priceId = cadence === 'monthly' ? tier.monthlyPriceId : tier.annualPriceId;
          const isCurrent = currentTier === tier.id && hasActiveSub;
          return (
            <TierCard
              key={tier.id}
              name={tier.name}
              price={`$${price}`}
              cadenceLabel={cadenceLabel}
              credits={`${tier.credits.toLocaleString()} credits/mo`}
              subline={`${tier.perCredit} per credit`}
              blurb={tier.blurb}
              highlights={tier.highlights}
              recommended={tier.recommended}
              ctaLabel={isCurrent ? 'Current plan' : hasActiveSub ? 'Switch plan' : 'Choose plan'}
              ctaLoading={pending === tier.name}
              ctaDisabled={isCurrent || pending !== null}
              onCta={() => handleSubscribe(priceId, tier.name, tier.id, price)}
              isCurrent={isCurrent}
            />
          );
        })}

      </div>

      {/* Teams — contact-sales banner, not a productized tier yet */}
      <div className="mt-10 max-w-6xl mx-auto">
        <div className="relative bg-black text-white rounded-3xl p-8 md:p-10 overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-10 pointer-events-none bg-gradient-to-l from-indigo-400 to-transparent" aria-hidden="true" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Teams</p>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight">For ad agencies + in-house creative teams</h3>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                Shared brand kits, per-character compliance dossiers, exclusive character licensing, seat-based billing, and founder-led onboarding.
                Priced per engagement — usually annual, starting around $5k/yr.
              </p>
            </div>
            <Link
              href="/contact?topic=teams"
              className="shrink-0 inline-flex items-center justify-center bg-white text-black font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Contact sales →
            </Link>
          </div>
        </div>
      </div>

      {/* Top-up packs */}
      <div className="mt-16 max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Need a one-time boost?</p>
          <h3 className="text-2xl font-black tracking-tight text-black">Top-up packs</h3>
          <p className="text-sm text-gray-500 mt-1">Buy extra credits without changing your plan. Never expires.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOPUPS.map((pack) => (
            <button
              key={pack.name}
              disabled={pending !== null}
              onClick={() => handleSubscribe(pack.priceId, pack.name)}
              className="text-left bg-white border-2 border-gray-100 hover:border-indigo-300 rounded-2xl p-5 transition-all"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-lg font-black text-black">{pack.name}</p>
                  <p className="text-xs text-gray-500">{pack.credits.toLocaleString()} credits · {pack.perCredit}/credit</p>
                </div>
                <span className="text-2xl font-black text-black">${pack.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-12 text-center text-xs text-gray-500 max-w-xl mx-auto">
        Studio &amp; Pro include a commercial license — the rights to work you produce while subscribed persist after you cancel.
        Sub credits roll over one cycle. Top-up credits never expire. Upgrade prorates immediately; downgrade applies next cycle.
        Questions? <Link href="/contact" className="text-indigo-600 underline">Contact us</Link>.
      </p>

      {hasActiveSub && (
        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              const res = await fetch('/api/billing/portal', { method: 'POST' });
              const data = await res.json();
              if (data.url) window.location.assign(data.url);
              else alert(data.error || 'Could not open billing portal');
            }}
            className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
          >
            Manage billing & invoices →
          </button>
        </div>
      )}

      {switchModal && (
        <SwitchPlanModal
          toTier={switchModal.tier}
          toPriceId={switchModal.priceId}
          toMonthlyPrice={switchModal.monthly}
          confirming={pending !== null}
          onClose={() => { if (pending === null) setSwitchModal(null); }}
          onConfirm={confirmSwitch}
        />
      )}

      {cancelModalOpen && (
        <CancelSubscriptionModal
          currentTier={currentTier}
          currentMonthlyCredits={currentMonthlyCredits}
          remainingCredits={currentCredits}
          periodEndIso={currentPeriodEnd}
          confirming={pending === 'cancel'}
          onClose={() => { if (pending === null) setCancelModalOpen(false); }}
          onConfirm={confirmCancel}
        />
      )}
    </div>
  );
}

function TierCard({
  name, price, cadenceLabel, credits, subline, blurb, highlights, recommended,
  ctaLabel, ctaLoading, ctaDisabled, onCta, isCurrent,
}: {
  name: string;
  price: string;
  cadenceLabel: string;
  credits: string;
  subline: string;
  blurb: string;
  highlights: string[];
  recommended?: boolean;
  ctaLabel: string;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  onCta: () => void;
  isCurrent?: boolean;
}) {
  return (
    <div className={`relative bg-white rounded-3xl p-6 border-2 transition-all ${
      recommended ? 'border-indigo-500 shadow-xl' : 'border-gray-100 shadow-sm'
    } ${isCurrent ? 'ring-2 ring-green-400' : ''}`}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
          Most popular
        </div>
      )}
      <h3 className="text-lg font-black tracking-tight text-black">{name}</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">{blurb}</p>

      <div className="mb-4">
        <span className="text-4xl font-black tracking-tighter text-black">{price}</span>
        {cadenceLabel && <span className="text-sm font-medium text-gray-500 ml-1">{cadenceLabel}</span>}
      </div>

      <div className="mb-5 pb-5 border-b border-gray-100">
        <p className="text-sm font-bold text-black">{credits}</p>
        <p className="text-xs text-gray-500">{subline}</p>
      </div>

      <ul className="space-y-2 mb-6">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
            <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <button
        disabled={ctaDisabled}
        onClick={onCta}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
          isCurrent
            ? 'bg-green-50 text-green-700 cursor-default'
            : recommended
              ? 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50'
              : 'bg-black text-white hover:bg-gray-800 disabled:opacity-50'
        }`}
      >
        {ctaLoading ? 'Redirecting…' : ctaLabel}
      </button>
    </div>
  );
}
