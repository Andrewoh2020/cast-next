'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  onClose: () => void;
}

export default function BuyCreditsModal({ onClose }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const pathname = usePathname();

  const packages = [
    { index: 0, credits: 1, price: 10, label: '1 credit', perCredit: '$10' },
    { index: 1, credits: 7, price: 50, label: '7 credits', perCredit: '$7.14', savings: '29% off' },
  ];

  const handleBuy = async (pkgIndex: number) => {
    setLoading(pkgIndex);
    // Save current workshop state so it can be restored after Stripe redirect
    try {
      const textarea = document.querySelector('textarea');
      if (textarea?.value) {
        sessionStorage.setItem('workshop_prompt', textarea.value);
      }
      const activeTab = document.querySelector('[class*="bg-white"][class*="text-black"][class*="shadow-sm"]');
      if (activeTab?.textContent) {
        sessionStorage.setItem('workshop_mode', activeTab.textContent.trim().toLowerCase().startsWith('scene') ? 'scene' : 'outfit');
      }
    } catch {}
    try {
      const res = await fetch('/api/create/purchase-credits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packageIndex: pkgIndex, returnUrl: pathname }),
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
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black">Top up credits</h2>
              <p className="text-sm text-gray-500 mt-1">Each credit generates one outfit or scene variant.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* Packages */}
        <div className="px-8 pb-4 space-y-3">
          {packages.map((pkg) => (
            <button
              key={pkg.index}
              onClick={() => handleBuy(pkg.index)}
              disabled={loading !== null}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                pkg.index === 1
                  ? 'border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 ring-1 ring-indigo-500/20'
                  : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-black">{pkg.label}</span>
                    {pkg.savings && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{pkg.savings}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{pkg.perCredit} per credit</p>
                </div>
                <div className="flex items-center gap-2">
                  {loading === pkg.index && <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />}
                  <span className="text-3xl font-black text-black">${pkg.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* What you get */}
        <div className="mx-8 mb-6 bg-gray-50 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Each credit lets you</p>
          <div className="space-y-2">
            {[
              'Generate a new outfit variant',
              'Place your character in any scene',
              'Upload a garment or scene photo as reference',
              'Export everything as a ready-to-use package',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5}><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={() => handleBuy(1)}
            disabled={loading !== null}
            className="flex-[2] bg-black hover:bg-gray-800 text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading !== null ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing…</>
            ) : (
              'Get 7 credits — $50'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
