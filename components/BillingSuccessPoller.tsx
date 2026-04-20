'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Bridges the gap between Stripe Checkout's instant success redirect and the
 * webhook that updates the user's blob (~1–3s later).
 *
 * Two cases to handle:
 *   1. Webhook landed BEFORE this page rendered → server already shows the
 *      post-purchase state. Just strip the ?billing=success param and stop.
 *   2. Webhook landed AFTER this page rendered → poll /api/billing/state
 *      until we see a change, then refresh so the server re-reads the blob.
 */
interface Props {
  initialTier: string;
  initialCredits: number;
}

export default function BillingSuccessPoller({ initialTier, initialCredits }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (params.get('billing') !== 'success') return;

    // Fast path: if the server-rendered initial state already reflects a paid
    // plan, the webhook landed first. Strip the param — the banner disappears
    // on the next render via the params check below.
    if (initialTier !== 'free') {
      window.dispatchEvent(new Event('cast:credits-refresh'));
      router.replace('/account');
      return;
    }

    // Otherwise the webhook hasn't landed yet — briefly poll for change.
    let cancelled = false;
    const start = Date.now();
    const TIMEOUT_MS = 8_000;
    const POLL_MS = 750;

    (async () => {
      while (!cancelled && Date.now() - start < TIMEOUT_MS) {
        try {
          const res = await fetch('/api/billing/state', { cache: 'no-store' });
          if (res.ok) {
            const d = await res.json();
            const tierChanged = d.tier && d.tier !== initialTier;
            const creditsChanged = (d.credits ?? 0) !== initialCredits;
            if (tierChanged || creditsChanged) {
              window.dispatchEvent(new Event('cast:credits-refresh'));
              router.replace('/account');
              router.refresh();
              return;
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      // Timed out — strip the param anyway so the banner goes away.
      if (!cancelled) {
        router.replace('/account');
      }
    })();

    return () => { cancelled = true; };
  }, [params, router, initialTier, initialCredits]);

  if (params.get('billing') !== 'success') return null;

  return (
    <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
      <p className="text-sm font-semibold text-indigo-900">Confirming your purchase…</p>
    </div>
  );
}
