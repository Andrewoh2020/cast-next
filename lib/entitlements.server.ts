import type { UserData } from './user-data.server';
import type { SubscriptionTier } from './credit-costs';
import { TIER_STORAGE_LIMITS } from './credit-costs';

/**
 * Entitlements derived from a user's subscription state.
 *
 * Single source of truth for "is this user a paying subscriber" and what
 * gates apply (full-resolution image downloads, audio downloads, saved-
 * character storage cap). Used by both server routes and server components.
 */

export function effectiveTier(data: UserData): SubscriptionTier {
  const sub = data.subscription;
  if (!sub || sub.tier === 'free') return 'free';
  // Tier benefits only apply while the subscription is live. past_due,
  // canceled, incomplete all collapse to free for entitlement purposes —
  // billing-cycle credits remain on the balance but UI gates lock down.
  if (sub.status === 'active' || sub.status === 'trialing') return sub.tier;
  return 'free';
}

export function isSubscribed(data: UserData): boolean {
  return effectiveTier(data) !== 'free';
}

export function canDownloadFullRes(data: UserData): boolean {
  return isSubscribed(data);
}

export function canDownloadAudio(data: UserData): boolean {
  return isSubscribed(data);
}

export function getStorageLimit(data: UserData): number {
  return TIER_STORAGE_LIMITS[effectiveTier(data)];
}

export function getSavedCount(data: UserData): number {
  return (data.savedRosterCharacterIds ?? []).length;
}

export function canSaveAnotherCharacter(data: UserData): boolean {
  return getSavedCount(data) < getStorageLimit(data);
}

export interface EntitlementSummary {
  tier: SubscriptionTier;
  subscribed: boolean;
  fullRes: boolean;
  audio: boolean;
  savedCount: number;
  storageLimit: number;
  canSaveAnother: boolean;
}

export function summarize(data: UserData): EntitlementSummary {
  const tier = effectiveTier(data);
  const savedCount = getSavedCount(data);
  const storageLimit = getStorageLimit(data);
  return {
    tier,
    subscribed: tier !== 'free',
    fullRes: canDownloadFullRes(data),
    audio: canDownloadAudio(data),
    savedCount,
    storageLimit,
    canSaveAnother: savedCount < storageLimit,
  };
}
