'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Talent,
  ROLE_LABELS,
  SEX_LABELS,
  ETHNICITY_LABELS,
  AGE_LABELS,
  BUILD_LABELS,
  HEIGHT_LABELS,
  GENRE_LABELS,
} from '@/lib/talent';

interface Props {
  talent: Talent | null;
  onClose: () => void;
  onPurchase: (talent: Talent, priceIdx: number) => void;
}

export default function TalentModal({ talent, onClose, onPurchase }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeImg, setActiveImg] = useState('');
  const [emailStep, setEmailStep] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    setSelectedIdx(0);
    setEmailStep(false);
    setEmail('');
    setSendError('');
    setActiveImg(talent?.img ?? '');
    document.body.style.overflow = talent ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [talent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!talent) return null;

  const gallery = talent.gallery?.length ? talent.gallery : [];
  const allImages = [talent.img, ...gallery].filter(Boolean);

  const attrs = [
    { label: 'Sex', value: SEX_LABELS[talent.sex] },
    { label: 'Age Range', value: AGE_LABELS[talent.ageRange] },
    { label: 'Build', value: BUILD_LABELS[talent.build] },
    { label: 'Height', value: HEIGHT_LABELS[talent.height] },
    { label: 'Languages', value: talent.languages.join(', ') },
  ];

  const handleBuy = () => {
    setEmailStep(true);
    setSendError('');
  };

  const handleConfirmPurchase = async () => {
    if (!email.trim() || !email.includes('@')) {
      setSendError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/email/send-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), characterId: talent.id, licenseIndex: selectedIdx }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error ?? 'Failed to send email. Please try again.');
        setSending(false);
        return;
      }
    } catch {
      setSendError('Network error. Please try again.');
      setSending(false);
      return;
    }
    setSending(false);
    onPurchase(talent, selectedIdx);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-lg transition-colors"
        >
          ×
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image + gallery */}
          <div className="flex flex-col bg-gray-100 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none overflow-hidden">
            <div className="relative flex-1 min-h-[300px] sm:min-h-[420px]">
              {activeImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeImg}
                  alt={talent.name}
                  className="w-full h-full object-cover"
                  style={{ minHeight: 300 }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200" style={{ minHeight: 300 }} />
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-black/5">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(url)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImg === url ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Look ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-7 flex flex-col overflow-y-auto">
            {!emailStep ? (
              <>
                {/* Roles */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {talent.roles.map((r) => (
                    <span key={r} className="text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                      {ROLE_LABELS[r]}
                    </span>
                  ))}
                </div>

                <h2 className="text-3xl font-black tracking-tighter text-black mb-2">{talent.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{talent.vibe}</p>

                {/* Core attributes */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {attrs.map((a) => (
                    <div key={a.label} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{a.label}</div>
                      <div className="text-sm font-semibold text-black">{a.value}</div>
                    </div>
                  ))}
                </div>

                {/* Ethnicities */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Ethnicity</div>
                  <div className="flex flex-wrap gap-1.5">
                    {talent.ethnicities.map((e) => (
                      <span key={e} className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
                        {ETHNICITY_LABELS[e]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Genres */}
                <div className="mb-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Genres</div>
                  <div className="flex flex-wrap gap-1.5">
                    {talent.genres.map((g) => (
                      <span key={g} className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full capitalize">
                        {GENRE_LABELS[g]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* License picker */}
                <div className="border-t border-gray-100 pt-5 mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Choose License</div>
                  <div className="flex gap-2 mb-2">
                    {talent.prices.map((p, i) => (
                      <button
                        key={p.name}
                        onClick={() => setSelectedIdx(i)}
                        className={`flex-1 border-2 rounded-xl p-3 text-center transition-all ${
                          selectedIdx === i
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-xs font-semibold text-gray-600">{p.name}</div>
                        <div className="text-lg font-black text-black">{p.price}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">Commercial & broadcast rights included. One-time fee.</p>
                </div>

                <button
                  onClick={handleBuy}
                  className="mt-auto w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
                >
                  Buy License — {talent.prices[selectedIdx].price}
                </button>
              </>
            ) : (
              /* Email step */
              <div className="flex flex-col h-full justify-center">
                <button
                  onClick={() => setEmailStep(false)}
                  className="self-start text-xs text-gray-400 hover:text-gray-700 mb-6 flex items-center gap-1 transition-colors"
                >
                  ← Back
                </button>

                <div className="mb-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-2">Almost there</div>
                  <h3 className="text-2xl font-black tracking-tighter text-black mb-2">Where should we send your files?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Your reference sheet and license for <strong>{talent.name}</strong> ({talent.prices[selectedIdx].name}) will be emailed to you instantly.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-sm font-semibold text-gray-800 flex justify-between">
                  <span>{talent.name}</span>
                  <span className="text-indigo-600">{talent.prices[selectedIdx].price}</span>
                </div>

                <div className="space-y-3 mb-5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Your Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSendError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmPurchase(); }}
                    placeholder="you@studio.com"
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  {sendError && <p className="text-xs text-red-500">{sendError}</p>}
                </div>

                <button
                  onClick={handleConfirmPurchase}
                  disabled={sending}
                  className="w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                >
                  {sending ? 'Sending...' : `Confirm & Send Files — ${talent.prices[selectedIdx].price}`}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">Files delivered instantly to your inbox.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
