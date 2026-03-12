'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Talent } from '@/lib/talent';
import { PurchaseRecord } from '@/lib/user-data.server';

interface Props {
  initialFavorites: Talent[];
  initialPurchases: PurchaseRecord[];
  allCharacters: Talent[];
}

export default function AccountClient({ initialFavorites, initialPurchases }: Props) {
  const [tab, setTab] = useState<'favorites' | 'purchases'>('favorites');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-8">
        {(['favorites', 'purchases'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Favorites */}
      {tab === 'favorites' && (
        initialFavorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🤍</div>
            <p className="font-semibold text-gray-600 mb-1">No favorites yet</p>
            <p className="text-sm text-gray-400 mb-5">Browse the roster and heart characters you love.</p>
            <Link href="/#roster" className="text-sm font-semibold text-indigo-500 hover:underline">
              Browse Talent →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {initialFavorites.map((talent) => (
              <Link key={talent.id} href={`/#roster`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={talent.img} alt={talent.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm text-black">{talent.name}</p>
                  <p className="text-xs text-gray-400">From {talent.prices[0]?.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Purchases */}
      {tab === 'purchases' && (
        initialPurchases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🎬</div>
            <p className="font-semibold text-gray-600 mb-1">No purchases yet</p>
            <p className="text-sm text-gray-400 mb-5">License a character to get started.</p>
            <Link href="/#roster" className="text-sm font-semibold text-indigo-500 hover:underline">
              Browse Talent →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {initialPurchases.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.characterImg} alt={p.characterName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-black">{p.characterName}</p>
                  <p className="text-sm text-gray-500">{p.licenseName} License · {p.licensePrice}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(p.purchasedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                {p.referenceSheetUrl && (
                  <a
                    href={`${p.referenceSheetUrl}${p.referenceSheetUrl.includes('?') ? '&' : '?'}download=1`}
                    className="flex-shrink-0 text-xs font-semibold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
