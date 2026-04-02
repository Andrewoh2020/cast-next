'use client';

import { useEffect } from 'react';
import { Talent } from '@/lib/talent';

interface Props {
  talent: Talent | null;
  priceIdx: number;
  onClose: () => void;
}

const included = [
  '4K reference sheets',
  'Commercial & broadcast license',
  'Style guide & color palette',
  'Copyright clearance certificate',
];

export default function SuccessModal({ talent, priceIdx, onClose }: Props) {
  useEffect(() => {
    if (talent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [talent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!talent) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-10 shadow-2xl text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-lg transition-colors"
        >
          ×
        </button>

        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h2 className="text-3xl font-black tracking-tighter text-black mb-3">License Acquired!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-5">
          Your unwatermarked character reference sheet is being emailed to you now.
        </p>

        <div className="bg-gray-50 rounded-xl px-5 py-3.5 mb-6 text-sm font-semibold text-black">
          {talent.name} — {talent.prices[priceIdx].name} License · {talent.prices[priceIdx].price}
        </div>

        <div className="text-left flex flex-col gap-3 mb-8">
          {included.map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
              {item}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-colors"
        >
          Back to Roster
        </button>
      </div>
    </div>
  );
}
