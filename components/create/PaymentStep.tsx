'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CustomCharacterDraft } from '@/lib/custom-characters.server';
import { thumbUrl } from '@/lib/talent';
import { CREDIT_COSTS } from '@/lib/credit-costs';

interface Props {
  draft: CustomCharacterDraft;
  credits: number;
  onComplete: (draft: CustomCharacterDraft) => void;
  onBack: () => void;
}

export default function PaymentStep({ draft, credits, onComplete, onBack }: Props) {
  const [error, setError] = useState('');
  const characterCost = CREDIT_COSTS.character;
  const hasEnough = credits >= characterCost;

  const handleUseCredit = () => {
    // Go straight to download step — generation happens there
    onComplete(draft);
  };

  const handleBuyCredits = async (packageIndex: number) => {
    try {
      const res = await fetch('/api/create/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageIndex, draftId: draft.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: character card */}
      <div className="lg:w-[280px] flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {draft.previewImageUrl && (
            <Image
              src={thumbUrl(draft.previewImageUrl, 400)}
              alt={draft.name}
              width={400}
              height={600}
              className="w-full object-cover"
            />
          )}
          <div className="p-5">
            <h3 className="font-black text-black text-lg">{draft.name}</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{draft.description}</p>
          </div>
        </div>
      </div>

      {/* Right: purchase flow */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-xl font-black tracking-tight text-black mb-1">Unlock Full Package</h2>
          <p className="text-sm text-gray-400 mb-8">
            Generate the hi-res profile photo and 8-panel reference sheet for {draft.name}.
          </p>

          {/* What's included */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: 'Hi-res profile photo', desc: '4K resolution, no watermark' },
              { label: 'Reference sheet', desc: '8-panel character turnaround' },
              { label: 'Full ownership', desc: 'You own the character' },
              { label: 'Commercial license', desc: 'Use in any production' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-black">{item.label}</span>
                </div>
                <p className="text-xs text-gray-400 ml-6">{item.desc}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Payment options */}
          <div className="space-y-3">
            {hasEnough ? (
              <button
                onClick={handleUseCredit}
                className="w-full bg-indigo-500 text-white font-bold py-4 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
              >
                Generate Character ({characterCost} credits · {credits.toLocaleString()} available)
              </button>
            ) : (
              <>
                <p className="text-sm text-gray-500 text-center">
                  This character costs <span className="font-bold text-black">{characterCost} credits</span>. You have {credits.toLocaleString()}.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBuyCredits(0)}
                    className="flex-1 bg-indigo-500 text-white font-bold py-4 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
                  >
                    <span className="text-sm">Boost — 500 credits</span>
                    <span className="block text-lg mt-0.5">$25</span>
                  </button>
                  <button
                    onClick={() => handleBuyCredits(1)}
                    className="flex-1 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all hover:-translate-y-0.5 hover:shadow-lg relative"
                  >
                    <span className="absolute -top-2 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      BEST VALUE
                    </span>
                    <span className="text-sm">Power — 1,500 credits</span>
                    <span className="block text-lg mt-0.5">$60</span>
                  </button>
                </div>
                <Link
                  href="/pricing"
                  className="block text-center text-sm font-bold text-indigo-600 hover:text-indigo-700 py-2"
                >
                  Or subscribe for monthly credits →
                </Link>
              </>
            )}

            <button
              onClick={onBack}
              className="w-full text-sm text-gray-400 hover:text-gray-600 font-medium py-2 transition-colors"
            >
              Back to preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
