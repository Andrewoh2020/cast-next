'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Talent } from '@/lib/talent';
import Link from 'next/link';

interface Props {
  character: Talent;
}

export default function CharacterPageClient({ character }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (character.exclusive) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-center">
        <p className="text-sm font-semibold text-amber-800">This character has been exclusively licensed.</p>
        <Link href="/" className="text-sm text-indigo-500 hover:underline mt-2 inline-block">
          Browse available characters
        </Link>
      </div>
    );
  }

  const tiers = [
    { name: 'Free (Attribution)', price: 'Free', amount: 0, desc: 'Must credit Cast in your project' },
    ...character.prices.map((p) => ({ name: p.name, price: p.price, amount: p.amount, desc: '' })),
  ];

  const handleTierClick = async (tier: typeof tiers[0]) => {
    setLoading(tier.name);
    try {
      if (tier.amount === 0) {
        // Free tier — record + go to workshop
        await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            characterId: character.id,
            characterName: character.name,
            characterSlug: character.slug,
            characterImg: character.img,
            licenseName: 'Free (Attribution)',
            licensePrice: 'Free',
            purchasedAt: new Date().toISOString(),
            referenceSheetUrl: character.referenceSheetUrl ?? null,
          }),
        });
        router.push(`/workshop/${character.slug}`);
      } else {
        // Paid tier — Stripe checkout
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            characterId: character.id,
            characterName: character.name,
            characterSlug: character.slug,
            characterImg: character.img,
            licenseName: tier.name,
            licensePrice: tier.price,
            amount: tier.amount,
            referenceSheetUrl: character.referenceSheetUrl ?? null,
            isExclusive: tier.name === 'Exclusive Rights',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed');
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  return (
    <div>
      <h2 className="text-sm font-bold text-black mb-4">License Options</h2>
      <div className="space-y-3 mb-6">
        {tiers.map((tier) => (
          <button
            key={tier.name}
            onClick={() => handleTierClick(tier)}
            disabled={loading !== null}
            className={`w-full flex items-center justify-between border rounded-xl px-5 py-4 transition-all text-left ${
              loading === tier.name
                ? 'bg-gray-50 border-gray-200'
                : tier.amount === 0
                  ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300'
                  : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div>
              <div className="text-sm font-semibold text-black">{tier.name}</div>
              {tier.desc && <div className="text-xs text-gray-400">{tier.desc}</div>}
            </div>
            <div className="flex items-center gap-2">
              {loading === tier.name && <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />}
              <span className="text-lg font-black text-black">{tier.price}</span>
            </div>
          </button>
        ))}
      </div>

      <Link
        href={`/workshop/${character.slug}`}
        className="block w-full bg-indigo-500 text-white font-bold text-center py-4 rounded-xl hover:bg-indigo-600 transition-colors text-sm"
      >
        Open in Workshop
      </Link>
      <p className="text-[10px] text-center text-gray-500 mt-2">
        All tiers include full Workshop access
      </p>
    </div>
  );
}
