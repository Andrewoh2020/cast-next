'use client';

import { useEffect, useState } from 'react';

interface Preview {
  fromTier: string;
  toTier: string;
  amountDueCents: number;
  creditDelta: number;
  newMonthlyCredits: number;
  isUpgrade: boolean;
  periodEnd: string | null;
}

interface Props {
  toTier: string;
  toPriceId: string;
  toMonthlyPrice: number;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirming?: boolean;
}

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  studio: 'Studio',
  pro: 'Pro',
};

export default function SwitchPlanModal({ toTier, toPriceId, toMonthlyPrice, onClose, onConfirm, confirming }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/billing/preview-switch?priceId=${encodeURIComponent(toPriceId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(data.error || 'Could not load preview'); return; }
        setPreview(data);
      } catch {
        if (!cancelled) setError('Could not load preview');
      }
    })();
    return () => { cancelled = true; };
  }, [toPriceId]);

  const fmtUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const renewalLabel = preview?.periodEnd
    ? new Date(preview.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative bg-white rounded-3xl w-full max-w-md border border-gray-100 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">
                {preview?.isUpgrade === false ? 'Downgrade plan' : 'Switch plan'}
              </p>
              <h2 className="text-2xl font-black tracking-tight text-black">
                Switch to {TIER_LABEL[toTier] ?? toTier}
              </h2>
              <p className="text-sm text-gray-500 mt-1">${toMonthlyPrice}/mo going forward</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {error ? (
          <div className="mx-8 my-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
            {error}
          </div>
        ) : !preview ? (
          <div className="mx-8 my-6 bg-gray-50 rounded-2xl p-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin shrink-0" />
            <p className="text-sm text-gray-500">Calculating your prorated charge…</p>
          </div>
        ) : preview.isUpgrade ? (
          <div className="px-8 py-2">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Charged today</p>
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-gray-700">Prorated for the rest of this cycle</p>
                <p className="text-3xl font-black tracking-tight text-black">{fmtUsd(preview.amountDueCents)}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">You get</p>
              <Row label="Additional credits now" value={`+${preview.creditDelta.toLocaleString()}`} valueClass="text-green-600" />
              <Row label="Monthly allowance going forward" value={`${preview.newMonthlyCredits.toLocaleString()} cr/mo`} />
              {renewalLabel && <Row label="Next renewal" value={renewalLabel} />}
            </div>
          </div>
        ) : (
          <div className="px-8 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Heads up — this is a downgrade</p>
              <p className="text-sm text-gray-700">
                You&apos;ll keep your current credits through {renewalLabel ?? 'the end of this cycle'}. The smaller {preview.newMonthlyCredits.toLocaleString()}-credit allowance lands at next renewal. No charge today.
              </p>
            </div>
          </div>
        )}

        <div className="px-8 pt-4 pb-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming || !!error}
            className="flex-[2] bg-black hover:bg-gray-800 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Switching…</>
            ) : preview?.isUpgrade === false ? (
              `Schedule downgrade`
            ) : (
              `Confirm switch — ${preview ? fmtUsd(preview.amountDueCents) : '…'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${valueClass ?? 'text-black'}`}>{value}</p>
    </div>
  );
}
