'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Talent,

  SEX_LABELS,
  ETHNICITY_LABELS,
  AGE_LABELS,
  BUILD_LABELS,
  HEIGHT_LABELS,
  GENRE_LABELS,
} from '@/lib/talent';

const FREE_LICENSE_IDX = -1;

interface Props {
  talent: Talent | null;
  onClose: () => void;
  onPurchase: (talent: Talent, priceIdx: number) => void;
}

export default function TalentModal({ talent, onClose, onPurchase }: Props) {
  const { isSignedIn, user } = useUser();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeImg, setActiveImg] = useState('');
  const [emailStep, setEmailStep] = useState(false);
  const [attributionStep, setAttributionStep] = useState(false);
  const [attributionAgreed, setAttributionAgreed] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    setSelectedIdx(0);
    setEmailStep(false);
    setAttributionStep(false);
    setAttributionAgreed(false);
    setEmail('');
    setSendError('');
    setActiveImg(talent?.img ?? '');
    document.body.style.overflow = talent ? 'hidden' : '';

    if (talent) {
      // Track view — get or create a persistent anonymous session ID
      let sessionId = localStorage.getItem('cast_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('cast_session_id', sessionId);
      }
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: talent.id, sessionId }),
      }).catch(() => {});
    }

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

  const singleIdx = talent.prices.findIndex((p) => p.name === 'Single Project');
  const studioIdx = talent.prices.findIndex((p) => p.name === 'Studio License');
  const exclusiveIdx = talent.prices.findIndex((p) => p.name === 'Exclusive Rights');

  const tags = [
    SEX_LABELS[talent.sex],
    AGE_LABELS[talent.ageRange],
    ...talent.ethnicities.map((e) => ETHNICITY_LABELS[e]),
  ];

  const handleBuy = async () => {
    if (selectedIdx === FREE_LICENSE_IDX) {
      if (!isSignedIn) {
        window.location.href = '/sign-in';
        return;
      }
      setAttributionStep(true);
      return;
    }
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }
    setSending(true);
    const price = talent!.prices[selectedIdx];
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: talent!.id,
          characterName: talent!.name,
          characterSlug: talent!.slug,
          characterImg: talent!.img,
          licenseName: price.name,
          licensePrice: price.price,
          amount: price.amount,
          referenceSheetUrl: talent!.referenceSheetUrl ?? null,
          isExclusive: selectedIdx === exclusiveIdx,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setSendError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSending(false);
    }
  };

  const handleConfirmFree = async () => {
    if (!talent) return;
    setSending(true);
    // Record the free license as a purchase
    await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: talent.id,
        characterName: talent.name,
        characterSlug: talent.slug,
        characterImg: talent.img,
        licenseName: 'Free (Attribution)',
        licensePrice: 'Free',
        purchasedAt: new Date().toISOString(),
        referenceSheetUrl: talent.referenceSheetUrl ?? null,
      }),
    });
    // Trigger download of profile photo + reference sheet
    const downloads: { url: string; filename: string }[] = [];
    if (talent.img) {
      const sep = talent.img.includes('?') ? '&' : '?';
      downloads.push({ url: `${talent.img}${sep}download=1&filename=${talent.slug}-profile`, filename: `${talent.slug}-profile` });
    }
    if (talent.referenceSheetUrl) {
      const sep = talent.referenceSheetUrl.includes('?') ? '&' : '?';
      downloads.push({ url: `${talent.referenceSheetUrl}${sep}download=1&filename=${talent.slug}-reference-sheet`, filename: `${talent.slug}-reference-sheet` });
    }
    downloads.forEach(({ url, filename }, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }, i * 800);
    });
    setSending(false);
    onPurchase(talent, FREE_LICENSE_IDX);
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
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative flex flex-col sm:flex-row items-stretch" style={{ height: 'min(88vh, 700px)' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white text-lg transition-colors"
        >
          ×
        </button>

        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div className="w-full sm:w-56 md:w-64 flex-shrink-0 flex flex-col overflow-y-auto border-r border-gray-100 p-6 order-2 sm:order-1">
          {/* Attribute tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tags.map((t) => (
              <span key={t} className="text-[10px] font-bold uppercase tracking-wider border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>

          {/* Name */}
          <h2 className="text-3xl font-black tracking-tighter text-black mb-2 leading-none">
            {talent.name}
          </h2>


          {/* Vibe */}
          <p className="text-xs text-gray-500 leading-relaxed mb-5">{talent.vibe}</p>

          {/* Extra attrs */}
          <div className="space-y-2 mb-5">
            {[
              { label: 'Build', value: BUILD_LABELS[talent.build] },
              { label: 'Height', value: HEIGHT_LABELS[talent.height] },
            ].map((a) => (
              <div key={a.label} className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">{a.label}</span>
                <span className="text-gray-800 font-semibold">{a.value}</span>
              </div>
            ))}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mb-5">
            {talent.genres.map((g) => (
              <span key={g} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {GENRE_LABELS[g]}
              </span>
            ))}
          </div>

          {/* Gallery thumbnails */}
          {allImages.length > 1 && (
            <div className="mt-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Looks</p>
              <div className="grid grid-cols-3 gap-1.5">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(url)}
                    className={`relative overflow-hidden rounded-lg transition-all ${
                      activeImg === url ? 'ring-2 ring-indigo-500 ring-offset-1' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ aspectRatio: '1' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Look ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER COLUMN — main image ───────────────── */}
        <div className="flex-1 relative bg-gray-100 order-1 sm:order-2 min-h-[240px]">
          {activeImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImg}
              alt={talent.name}
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200" />
          )}
        </div>

        {/* ── RIGHT COLUMN — license + buy ─────────────── */}
        <div className="w-full sm:w-56 md:w-64 flex-shrink-0 flex flex-col border-l border-gray-100 p-6 order-3">
          {!sending && !attributionStep ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Choose License</p>

              <div className="flex flex-col gap-2 mb-5">
                {/* Free */}
                <button
                  onClick={() => setSelectedIdx(FREE_LICENSE_IDX)}
                  className={`w-full text-left border-2 rounded-xl p-3.5 transition-all ${
                    selectedIdx === FREE_LICENSE_IDX
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-400 bg-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">Free (Attribution)</div>
                  <div className="text-xl font-black text-black tracking-tight">Free</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Credit Cast. in your production</div>
                </button>

                {/* Single Project */}
                {singleIdx !== -1 && (
                  <button
                    onClick={() => setSelectedIdx(singleIdx)}
                    className={`w-full text-left border-2 rounded-xl p-3.5 transition-all ${
                      selectedIdx === singleIdx
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-0.5">Single Project</div>
                    <div className="text-xl font-black text-black tracking-tight">{talent.prices[singleIdx].price}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">One production · 12 months</div>
                  </button>
                )}

                {/* Studio License */}
                {studioIdx !== -1 && (
                  <button
                    onClick={() => setSelectedIdx(studioIdx)}
                    className={`w-full text-left border-2 rounded-xl p-3.5 transition-all ${
                      selectedIdx === studioIdx
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-0.5">Studio License</div>
                    <div className="text-xl font-black text-black tracking-tight">{talent.prices[studioIdx].price}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Unlimited productions · 12 months</div>
                  </button>
                )}

                {/* Exclusive Rights */}
                {exclusiveIdx !== -1 && (
                  <button
                    onClick={() => setSelectedIdx(exclusiveIdx)}
                    className={`w-full text-left border-2 rounded-xl p-3.5 transition-all ${
                      selectedIdx === exclusiveIdx
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-gray-500">Exclusive Rights</span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Exclusive</span>
                    </div>
                    <div className="text-xl font-black text-black tracking-tight">{talent.prices[exclusiveIdx].price}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">You own this character exclusively</div>
                  </button>
                )}
              </div>

              {selectedIdx === exclusiveIdx && exclusiveIdx !== -1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-[11px] text-amber-800 leading-relaxed">
                  ⚠️ Once purchased, <strong>{talent.name}</strong> will be removed from the marketplace and exclusive to you.
                </div>
              )}

              {sendError && (
                <p className="text-xs text-red-500 text-center mb-2">{sendError}</p>
              )}

              <button
                onClick={handleBuy}
                className={`mt-auto w-full font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm ${
                  selectedIdx === FREE_LICENSE_IDX
                    ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-green-200'
                    : selectedIdx === exclusiveIdx
                    ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-200'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-indigo-200'
                }`}
              >
                {selectedIdx === FREE_LICENSE_IDX
                  ? 'Get Free License'
                  : selectedIdx === exclusiveIdx
                  ? `Claim Exclusively — ${talent.prices[exclusiveIdx].price}`
                  : `Buy License — ${talent.prices[selectedIdx]?.price}`}
              </button>
            </>
          ) : attributionStep ? (
            <>
              <button
                onClick={() => setAttributionStep(false)}
                className="self-start text-xs text-gray-400 hover:text-gray-700 mb-5 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>

              <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">Free License</p>
              <h3 className="text-xl font-black tracking-tighter text-black mb-2 leading-tight">
                One condition applies
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">
                You can use <strong>{talent.name}</strong> for free in any production as long as you credit Cast. visibly — in the video description, end credits, or as on-screen text.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 text-[11px] text-gray-600 leading-relaxed border border-gray-200">
                <strong className="block text-gray-800 mb-1">Example credit:</strong>
                "AI characters provided by <span className="text-indigo-600 font-semibold">Cast.</span> — cast.ai"
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={attributionAgreed}
                  onChange={(e) => setAttributionAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-500 flex-shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I agree to credit Cast. visibly in every production I use this character in.
                </span>
              </label>

              <button
                onClick={handleConfirmFree}
                disabled={!attributionAgreed || sending}
                className="mt-auto w-full bg-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none text-sm"
              >
                {sending ? 'Processing...' : 'Agree & Download Free'}
              </button>
              {!isSignedIn && (
                <p className="text-[10px] text-gray-400 text-center mt-2">You&apos;ll be asked to sign in first.</p>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Redirecting to checkout…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
