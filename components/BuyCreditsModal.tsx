'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface Props {
  onClose: () => void;
}

interface Pack {
  name: string;
  credits: number;
  price: number;
  perCredit: string;
  priceId: string | undefined;
  highlighted?: boolean;
}

// Next.js statically replaces process.env.NEXT_PUBLIC_* only at literal access
// sites — dynamic lookups like process.env[varName] return undefined in the
// browser bundle. So bind each priceId here directly.
const PACKS: Pack[] = [
  { name: 'Boost', credits: 500, price: 25, perCredit: '$0.05', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_BOOST },
  { name: 'Power', credits: 1500, price: 60, perCredit: '$0.04', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_POWER, highlighted: true },
];

export default function BuyCreditsModal({ onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('free');
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/billing/state').then((r) => r.json()).then((d) => setTier(d.tier ?? 'free')).catch(() => {});
  }, []);

  const handleBuy = async (pack: Pack) => {
    setLoading(pack.name);
    try {
      const textarea = document.querySelector('textarea');
      if (textarea?.value) sessionStorage.setItem('workshop_prompt', textarea.value);
      const activeTab = document.querySelector('[class*="bg-white"][class*="text-black"][class*="shadow-sm"]');
      if (activeTab?.textContent) {
        sessionStorage.setItem('workshop_mode', activeTab.textContent.trim().toLowerCase().startsWith('scene') ? 'scene' : 'outfit');
      }
    } catch {}

    if (!pack.priceId) {
      alert(`${pack.name} pack not yet configured`);
      setLoading(null);
      return;
    }

    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ priceId: pack.priceId, returnUrl: pathname }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed');
      window.location.href = data.url;
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative bg-white rounded-3xl w-full max-w-md border border-gray-100 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black">Top up credits</h2>
              <p className="text-sm text-gray-500 mt-1">5 cr per outfit/scene · 25 cr per character.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {tier === 'free' && (
          <div className="mx-8 mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-sm font-bold text-indigo-900">A plan is usually a better deal</p>
            <p className="text-xs text-indigo-700 mt-1">Studio gets you 1,200 credits/mo for $49 — that&apos;s $0.041/credit vs $0.05 for top-ups.</p>
            <Link href="/pricing" onClick={onClose} className="inline-block mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline">
              See plans →
            </Link>
          </div>
        )}

        <div className="px-8 pb-4 space-y-3">
          {PACKS.map((pack) => (
            <button
              key={pack.name}
              onClick={() => handleBuy(pack)}
              disabled={loading !== null}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                pack.highlighted
                  ? 'border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 ring-1 ring-indigo-500/20'
                  : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-black">{pack.name}</span>
                    <span className="text-sm font-semibold text-gray-700">{pack.credits.toLocaleString()} credits</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{pack.perCredit} per credit · never expires</p>
                </div>
                <div className="flex items-center gap-2">
                  {loading === pack.name && <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />}
                  <span className="text-3xl font-black text-black">${pack.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-8 pb-8 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl transition-colors">
            Cancel
          </button>
          <Link
            href="/pricing"
            onClick={onClose}
            className="flex-[2] bg-black hover:bg-gray-800 text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center"
          >
            See subscription plans
          </Link>
        </div>
      </div>
    </div>
  );
}
