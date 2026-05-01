'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { SubscriptionTier } from '@/lib/credit-costs';
import { TIER_STORAGE_LIMITS } from '@/lib/credit-costs';

interface Props {
  open: boolean;
  onClose: () => void;
  savedCount: number;
  storageLimit: number;
  tier: SubscriptionTier;
}

const NEXT_TIER: Partial<Record<SubscriptionTier, SubscriptionTier>> = {
  free: 'starter',
  starter: 'studio',
  studio: 'pro',
};

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Starter',
  studio: 'Studio',
  pro: 'Pro',
};

/**
 * Simple modal shown when a user tries to save past their tier's storage cap.
 * Points to the upgrade flow on /account. Keeps tier-cap copy in one place.
 */
export default function UpgradeModal({ open, onClose, savedCount, storageLimit, tier }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const next = NEXT_TIER[tier];
  const nextLimit = next ? TIER_STORAGE_LIMITS[next] : storageLimit;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Storage limit reached"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
          Roster storage full
        </p>
        <h2 className="text-2xl font-black tracking-tight text-black mb-2">
          You&apos;ve saved {savedCount} of {storageLimit} characters.
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {tier === 'free'
            ? 'Subscribe to grow your roster, unlock full-resolution downloads, and get character voice access.'
            : `Upgrade to ${next ? TIER_LABEL[next] : tier} to save up to ${nextLimit} characters.`}
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/account?upgrade=1"
            className="bg-black hover:bg-gray-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors text-center"
          >
            See subscription plans
          </Link>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-500 hover:text-black px-3 py-2"
          >
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
