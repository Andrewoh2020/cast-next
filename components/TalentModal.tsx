'use client';

import { useState, useEffect } from 'react';
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

  const tags = [
    SEX_LABELS[talent.sex],
    AGE_LABELS[talent.ageRange],
    ...talent.ethnicities.map((e) => ETHNICITY_LABELS[e]),
  ];

  const handleBuy = () => { setEmailStep(true); setSendError(''); };

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
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative flex flex-col sm:flex-row"
        style={{ height: 'min(88vh, 680px)' }}
      >
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

          {/* Roles */}
          <div className="flex flex-wrap gap-1 mb-3">
            {talent.roles.map((r) => (
              <span key={r} className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                {ROLE_LABELS[r]}
              </span>
            ))}
          </div>

          {/* Vibe */}
          <p className="text-xs text-gray-500 leading-relaxed mb-5">{talent.vibe}</p>

          {/* Extra attrs */}
          <div className="space-y-2 mb-5">
            {[
              { label: 'Build', value: BUILD_LABELS[talent.build] },
              { label: 'Height', value: HEIGHT_LABELS[talent.height] },
              { label: 'Languages', value: talent.languages.join(', ') || '—' },
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
        <div className="flex-1 overflow-y-auto bg-gray-100 order-1 sm:order-2 min-h-[240px]">
          {activeImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImg}
              alt={talent.name}
              className="w-full h-auto block transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>

        {/* ── RIGHT COLUMN — license + buy ─────────────── */}
        <div className="w-full sm:w-56 md:w-64 flex-shrink-0 flex flex-col border-l border-gray-100 p-6 order-3">
          {!emailStep ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Choose License</p>

              <div className="flex flex-col gap-3 mb-6">
                {talent.prices.map((p, i) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedIdx(i)}
                    className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                      selectedIdx === i
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-1">{p.name}</div>
                    <div className="text-2xl font-black text-black tracking-tight">{p.price}</div>
                    <div className="text-[10px] text-gray-400 mt-1">One-time · all rights</div>
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed mb-6">
                Commercial &amp; broadcast rights included. Reference sheet emailed instantly.
              </p>

              <button
                onClick={handleBuy}
                className="mt-auto w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 text-sm"
              >
                Buy License — {talent.prices[selectedIdx].price}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEmailStep(false)}
                className="self-start text-xs text-gray-400 hover:text-gray-700 mb-5 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>

              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Almost there</p>
              <h3 className="text-xl font-black tracking-tighter text-black mb-2 leading-tight">
                Where should we send your files?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Your reference sheet for <strong>{talent.name}</strong> ({talent.prices[selectedIdx].name}) will be emailed instantly.
              </p>

              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex justify-between text-sm font-semibold">
                <span className="text-gray-700 truncate mr-2">{talent.name}</span>
                <span className="text-indigo-600 flex-shrink-0">{talent.prices[selectedIdx].price}</span>
              </div>

              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSendError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmPurchase(); }}
                placeholder="you@studio.com"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all mb-2"
              />
              {sendError && <p className="text-xs text-red-500 mb-3">{sendError}</p>}

              <button
                onClick={handleConfirmPurchase}
                disabled={sending}
                className="mt-auto w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none text-sm"
              >
                {sending ? 'Sending...' : `Confirm & Send — ${talent.prices[selectedIdx].price}`}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2">Files delivered to your inbox.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
