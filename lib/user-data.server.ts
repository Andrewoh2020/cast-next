import { put, get } from '@vercel/blob';
import { appendPurchaseLog } from './purchases-log.server';
import {
  DRIP_BALANCE_CAP,
  DRIP_PER_DAY,
  SIGNUP_BONUS,
  TIER_MONTHLY_CREDITS,
  type SubscriptionTier,
} from './credit-costs';

export interface PurchaseRecord {
  characterId: number;
  characterName: string;
  characterSlug: string;
  characterImg: string;
  licenseName: string;
  licensePrice: string;
  purchasedAt: string;
  referenceSheetUrl?: string;
  sessionId?: string;
}

export interface CreditPurchaseRecord {
  credits: number;
  amount: number; // USD cents
  purchasedAt: string;
  sessionId: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'none';

export interface SubscriptionState {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  lastGrantedPeriodId?: string;
  priorPeriodCreditsExpireAt?: string;
  // Last priceId we observed for this sub. Used to detect plan switches in
  // customer.subscription.updated events (when this differs from the new
  // priceId, we treat it as an upgrade/downgrade and apply prorated credits).
  lastPriceId?: string;
  // Last ~20 Stripe event IDs we've sent transactional emails for. Used to
  // dedupe webhook replays so users don't get the same email twice.
  recentNotificationEvents?: string[];
}

export interface DripState {
  lastDripAt?: string;
  signupBonusGrantedAt?: string;
}

export type LedgerReason =
  | 'signup-bonus'
  | 'daily-drip'
  | 'sub-grant'
  | 'sub-rollover-expire'
  | 'top-up'
  | 'refund'
  | 'spend-outfit'
  | 'spend-shot'
  | 'spend-character'
  | 'spend-voice'
  | 'migration'
  | 'admin-grant';

export interface CreditLedgerEntry {
  ts: string;
  delta: number;
  reason: LedgerReason;
  meta?: Record<string, string | number>;
}

const LEDGER_MAX_ENTRIES = 200;

export interface UserData {
  favorites: number[]; // character IDs
  purchases: PurchaseRecord[];
  credits: number;
  creditPurchases: CreditPurchaseRecord[];
  subscription?: SubscriptionState;
  drip?: DripState;
  ledger?: CreditLedgerEntry[];
  schemaVersion?: number;
  /** True after the user has consumed their one free upload-to-character
   *  conversion. Subsequent uploads cost the regular character credit. */
  hasUsedFreeUpload?: boolean;
  /** Roster character IDs the user has saved to their personal Studio roster
   *  ("My Characters"). Distinct from `favorites` (legacy heart-icon bookmarks
   *  on the public landing roster) — saves are storage-tier-capped and are
   *  what populate the Studio My Characters tab. */
  savedRosterCharacterIds?: number[];
}

function userKey(userId: string, file: string) {
  return `users/${userId}/${file}`;
}

async function readUserBlob<T>(pathname: string, fallback: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;
  try {
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode === 304 || !result.stream) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeUserBlob(pathname: string, data: unknown): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getUserData(userId: string): Promise<UserData> {
  return readUserBlob<UserData>(userKey(userId, 'data.json'), { favorites: [], purchases: [], credits: 0, creditPurchases: [] });
}

function appendLedger(data: UserData, entry: Omit<CreditLedgerEntry, 'ts'> & { ts?: string }): void {
  const next: CreditLedgerEntry = { ts: entry.ts ?? new Date().toISOString(), delta: entry.delta, reason: entry.reason, meta: entry.meta };
  const existing = data.ledger ?? [];
  // Newest first; cap to LEDGER_MAX_ENTRIES
  data.ledger = [next, ...existing].slice(0, LEDGER_MAX_ENTRIES);
}

/**
 * Lazy-grant signup bonus + daily drip credits on read.
 *
 *  - Grants SIGNUP_BONUS once per account.
 *  - For free-tier accounts, drips DRIP_PER_DAY credits per elapsed day,
 *    capped so balance never exceeds DRIP_BALANCE_CAP via drip alone.
 *  - Paying subscribers (active|trialing on a non-free tier) skip drip —
 *    their monthly allowance covers usage.
 *
 * If a write is needed, the function re-reads the blob immediately before
 * writing and merges only the credit/drip/ledger fields it owns. This
 * prevents clobbering concurrent writes to subscription state from the
 * Stripe webhook (sub-create can race with the redirect's /api/create/credits
 * call, which triggers this function).
 */
export async function ensureDripApplied(userId: string): Promise<UserData> {
  const initial = await getUserData(userId);
  const now = new Date();
  const drip: DripState = { ...(initial.drip ?? {}) };

  let creditsDelta = 0;
  const ledgerEntriesToAppend: Array<Omit<CreditLedgerEntry, 'ts'>> = [];

  if (!drip.signupBonusGrantedAt) {
    creditsDelta += SIGNUP_BONUS;
    drip.signupBonusGrantedAt = now.toISOString();
    ledgerEntriesToAppend.push({ delta: SIGNUP_BONUS, reason: 'signup-bonus' });
  }

  const tier = initial.subscription?.tier ?? 'free';
  const status = initial.subscription?.status ?? 'none';
  const isPaid = tier !== 'free' && (status === 'active' || status === 'trialing');

  let advanceLastDripTo: string | null = null;
  if (!isPaid) {
    const last = drip.lastDripAt ? new Date(drip.lastDripAt) : null;
    if (!last) {
      drip.lastDripAt = now.toISOString();
      advanceLastDripTo = drip.lastDripAt;
    } else {
      const MS_PER_DAY = 86_400_000;
      const daysOwed = Math.floor((now.getTime() - last.getTime()) / MS_PER_DAY);
      if (daysOwed > 0) {
        const headroom = Math.max(0, DRIP_BALANCE_CAP - (initial.credits ?? 0));
        const grant = Math.min(DRIP_PER_DAY * daysOwed, headroom);
        if (grant > 0) {
          creditsDelta += grant;
          ledgerEntriesToAppend.push({ delta: grant, reason: 'daily-drip', meta: { daysOwed } });
        }
        // Advance baseline by full days consumed, preserving sub-day remainder.
        advanceLastDripTo = new Date(last.getTime() + daysOwed * MS_PER_DAY).toISOString();
      }
    }
  }

  const mutated = creditsDelta !== 0
    || ledgerEntriesToAppend.length > 0
    || drip.signupBonusGrantedAt !== initial.drip?.signupBonusGrantedAt
    || advanceLastDripTo !== null;
  if (!mutated) return initial;

  // Re-read fresh data right before write so we merge in any concurrent
  // updates (esp. the Stripe webhook setting subscription state).
  const fresh = await getUserData(userId);
  const merged: UserData = {
    ...fresh,
    credits: (fresh.credits ?? 0) + creditsDelta,
    drip: {
      ...(fresh.drip ?? {}),
      signupBonusGrantedAt: drip.signupBonusGrantedAt ?? fresh.drip?.signupBonusGrantedAt,
      lastDripAt: advanceLastDripTo ?? fresh.drip?.lastDripAt,
    },
  };
  for (const entry of ledgerEntriesToAppend) appendLedger(merged, entry);
  await writeUserBlob(userKey(userId, 'data.json'), merged);
  return merged;
}

export async function toggleFavorite(userId: string, characterId: number): Promise<number[]> {
  const data = await getUserData(userId);
  const already = data.favorites.includes(characterId);
  const next = already
    ? data.favorites.filter((id) => id !== characterId)
    : [...data.favorites, characterId];
  await writeUserBlob(userKey(userId, 'data.json'), { ...data, favorites: next });
  return next;
}

/** Read-only check: does the user still have their free upload conversion?
 *  Use peek + consume separately so a precheck doesn't burn the freebie. */
export async function peekFreeUpload(userId: string): Promise<boolean> {
  const data = await getUserData(userId);
  return !data.hasUsedFreeUpload;
}

/** Mark the free upload as consumed. Idempotent — re-calling is a no-op. */
export async function consumeFreeUpload(userId: string): Promise<void> {
  const data = await getUserData(userId);
  if (data.hasUsedFreeUpload) return;
  await writeUserBlob(userKey(userId, 'data.json'), { ...data, hasUsedFreeUpload: true });
}

/**
 * Add credits to a user with full ledger trail. Every call is logged to
 * `data.ledger` with the reason so credit history can be reconstructed.
 *
 * `reason` is required — there is no silent path. If you're tempted to skip it,
 * reach for the right specialized function instead (`applyTopUp`, `applySubGrant`,
 * `applyTierUpgrade`).
 */
export async function addCredits(
  userId: string,
  credits: number,
  amount: number,
  sessionId: string,
  reason: LedgerReason,
  meta?: Record<string, string | number>,
): Promise<number> {
  const data = await getUserData(userId);
  if ((data.creditPurchases ?? []).some((p) => p.sessionId === sessionId)) return data.credits ?? 0;
  const updated: UserData = {
    ...data,
    credits: (data.credits ?? 0) + credits,
    creditPurchases: [{ credits, amount, purchasedAt: new Date().toISOString(), sessionId }, ...(data.creditPurchases ?? [])],
  };
  appendLedger(updated, { delta: credits, reason, meta: { sessionId, ...(meta ?? {}) } });
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return updated.credits;
}

export async function getCredits(userId: string): Promise<number> {
  const data = await ensureDripApplied(userId);
  return data.credits ?? 0;
}

/**
 * Deduct N credits atomically. Used when an action costs more than a single
 * credit (e.g. locking in a voice). If the user doesn't have enough credits,
 * throws before touching the balance.
 */
export async function deductCredits(userId: string, n: number, reason: LedgerReason, meta?: Record<string, string | number>): Promise<number> {
  if (n <= 0) throw new Error('deductCredits(n>0) required');
  await ensureDripApplied(userId);
  const data = await getUserData(userId);
  const current = data.credits ?? 0;
  if (current < n) throw new Error(`Need ${n} credits, have ${current}`);
  const updated: UserData = { ...data, credits: current - n };
  appendLedger(updated, { delta: -n, reason, ...(meta ? { meta } : {}) });
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return updated.credits;
}

/**
 * Apply a one-off top-up purchase (Boost / Power packs). Idempotent on sessionId.
 * Returns `granted=false` when the sessionId was already credited (so the
 * caller can skip side effects like sending receipt emails on event replays).
 */
export async function applyTopUp(userId: string, opts: { credits: number; amount: number; sessionId: string }): Promise<{ credits: number; granted: boolean }> {
  const data = await getUserData(userId);
  if ((data.creditPurchases ?? []).some((p) => p.sessionId === opts.sessionId)) {
    return { credits: data.credits ?? 0, granted: false };
  }
  const updated: UserData = {
    ...data,
    credits: (data.credits ?? 0) + opts.credits,
    creditPurchases: [
      { credits: opts.credits, amount: opts.amount, purchasedAt: new Date().toISOString(), sessionId: opts.sessionId },
      ...(data.creditPurchases ?? []),
    ],
  };
  appendLedger(updated, { delta: opts.credits, reason: 'top-up', meta: { sessionId: opts.sessionId, amountCents: opts.amount } });
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return { credits: updated.credits, granted: true };
}

/**
 * Apply a subscription credit grant (initial sub or renewal). Idempotent on
 * the periodId (subscriptionId + ':' + periodStart). On renewal, expires any
 * unspent credits attributed to the prior period (one-cycle rollover policy)
 * before granting the new allowance.
 */
export async function applySubGrant(userId: string, opts: {
  tier: SubscriptionTier;
  periodId: string;
  periodStart: string;
  periodEnd: string;
  eventId?: string;
}): Promise<{ data: UserData; granted: boolean; allowance: number }> {
  const data = await getUserData(userId);
  const sub = data.subscription;
  // Idempotency: same periodId already granted
  if (sub?.lastGrantedPeriodId === opts.periodId) return { data, granted: false, allowance: 0 };
  // Event-level idempotency
  if (opts.eventId && (data.ledger ?? []).some((e) => e.meta?.eventId === opts.eventId)) return { data, granted: false, allowance: 0 };

  const allowance = TIER_MONTHLY_CREDITS[opts.tier] ?? 0;

  // Expire prior-period unspent sub credits (one-cycle rollover deadline already passed)
  let expiredAmount = 0;
  if (sub?.priorPeriodCreditsExpireAt) {
    const expireAt = new Date(sub.priorPeriodCreditsExpireAt).getTime();
    if (Date.now() >= expireAt) {
      // Conservative: any balance carried beyond the prior allowance is sub-leftover.
      // If we can't tell what's sub vs top-up, expire min(balance, lastAllowance).
      const lastAllowance = TIER_MONTHLY_CREDITS[sub.tier] ?? 0;
      expiredAmount = Math.min(data.credits ?? 0, lastAllowance);
    }
  }

  const newCredits = (data.credits ?? 0) - expiredAmount + allowance;

  const updated: UserData = {
    ...data,
    credits: newCredits,
    subscription: {
      ...(sub ?? { tier: 'free', status: 'none' }),
      tier: opts.tier,
      status: 'active',
      currentPeriodStart: opts.periodStart,
      currentPeriodEnd: opts.periodEnd,
      lastGrantedPeriodId: opts.periodId,
      priorPeriodCreditsExpireAt: opts.periodEnd, // expires at next renewal
    },
  };

  if (expiredAmount > 0) {
    appendLedger(updated, { delta: -expiredAmount, reason: 'sub-rollover-expire', meta: { fromTier: sub?.tier ?? 'free' } });
  }
  appendLedger(updated, {
    delta: allowance,
    reason: 'sub-grant',
    meta: { tier: opts.tier, periodId: opts.periodId, ...(opts.eventId ? { eventId: opts.eventId } : {}) },
  });

  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return { data: updated, granted: true, allowance };
}

/**
 * Apply a mid-cycle tier change. On upgrade (newAllowance > oldAllowance), grants
 * the prorated credit difference based on days remaining in the current period.
 * On downgrade, no clawback — user keeps the credits they paid for; the next
 * cycle just lands the smaller allowance.
 *
 * Idempotent on eventId so webhook replays don't double-grant.
 */
export async function applyTierUpgrade(userId: string, opts: {
  newTier: SubscriptionTier;
  oldAllowance: number;
  newAllowance: number;
  daysRemaining: number;
  totalDays: number;
  eventId: string;
}): Promise<{ granted: boolean; delta: number }> {
  const data = await getUserData(userId);
  if ((data.ledger ?? []).some((e) => e.meta?.eventId === opts.eventId && e.meta?.kind === 'upgrade-proration')) {
    return { granted: false, delta: 0 };
  }
  const ratio = opts.totalDays > 0 ? Math.max(0, Math.min(1, opts.daysRemaining / opts.totalDays)) : 0;
  const delta = Math.max(0, Math.round((opts.newAllowance - opts.oldAllowance) * ratio));
  if (delta <= 0) return { granted: false, delta: 0 };

  const updated: UserData = {
    ...data,
    credits: (data.credits ?? 0) + delta,
  };
  appendLedger(updated, {
    delta,
    reason: 'sub-grant',
    meta: { eventId: opts.eventId, kind: 'upgrade-proration', newTier: opts.newTier, ratio: Number(ratio.toFixed(3)) },
  });
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return { granted: true, delta };
}

/**
 * Reserve an event ID for sending a transactional email. Returns true if this
 * is the first time we've seen the event (caller should send the email),
 * false if a previous webhook fire already sent it.
 *
 * Best-effort dedupe — concurrent webhook replays could both pass the check
 * before either commits, but Stripe rarely fires the same event in parallel,
 * and a duplicate email is preferable to a missed one.
 */
export async function tryClaimNotificationEvent(userId: string, eventId: string): Promise<boolean> {
  const data = await getUserData(userId);
  const recent = data.subscription?.recentNotificationEvents ?? [];
  if (recent.includes(eventId)) return false;
  await applySubscriptionStateChange(userId, {
    recentNotificationEvents: [eventId, ...recent].slice(0, 20),
  });
  return true;
}

/**
 * Sync subscription state (status, period, cancelAtPeriodEnd, customer/sub IDs)
 * without touching credit balance. Used for non-renewal subscription.updated /
 * subscription.deleted events.
 */
export async function applySubscriptionStateChange(userId: string, patch: Partial<SubscriptionState>): Promise<UserData> {
  const data = await getUserData(userId);
  const updated: UserData = {
    ...data,
    subscription: {
      ...(data.subscription ?? { tier: 'free', status: 'none' }),
      ...patch,
    },
  };
  await writeUserBlob(userKey(userId, 'data.json'), updated);
  return updated;
}

/**
 * Check whether a user owns a license for a character. Considers Single Project
 * and Studio licenses valid for 1 year from purchase; Exclusive Rights never
 * expire. Used to gate workshop features on licensed characters only.
 */
export async function userOwnsCharacter(userId: string, characterId: number): Promise<boolean> {
  const data = await getUserData(userId);
  const now = Date.now();
  return (data.purchases ?? []).some((p) => {
    if (p.characterId !== characterId) return false;
    if (p.licenseName === 'Exclusive Rights') return true;
    // 1-year license window
    const purchased = new Date(p.purchasedAt).getTime();
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    return now - purchased < ONE_YEAR_MS;
  });
}

export async function recordPurchase(userId: string, purchase: PurchaseRecord): Promise<void> {
  const data = await getUserData(userId);
  if (purchase.sessionId && data.purchases.some((p) => p.sessionId === purchase.sessionId)) return;
  const updated = [purchase, ...data.purchases];
  await writeUserBlob(userKey(userId, 'data.json'), { ...data, purchases: updated });
  // Append to global analytics log (non-blocking)
  appendPurchaseLog({
    characterId: purchase.characterId,
    characterName: purchase.characterName,
    licenseName: purchase.licenseName,
    amount: Number(purchase.licensePrice.replace(/[^0-9.]/g, '')) || 0,
    purchasedAt: purchase.purchasedAt,
  }).catch(() => {});
}
