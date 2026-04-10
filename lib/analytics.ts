/**
 * Client-side analytics helper.
 * Wraps Google Analytics 4 (gtag) so we can track key conversion events.
 *
 * Safe to call even when GA is not loaded — it's a no-op in that case.
 */

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', event, params);
  } catch {
    // ignore
  }
}

// ── Marketplace events ─────────────────────────────────────────────────────

export function trackViewCharacter(characterId: number, characterName: string) {
  track('view_character', {
    item_id: String(characterId),
    item_name: characterName,
  });
}

export function trackSelectLicense(characterId: number, characterName: string, licenseName: string, priceUsd: number) {
  track('select_license', {
    item_id: String(characterId),
    item_name: characterName,
    license_name: licenseName,
    value: priceUsd,
    currency: 'USD',
  });
}

export function trackBeginCheckout(characterId: number, characterName: string, licenseName: string, priceUsd: number) {
  track('begin_checkout', {
    currency: 'USD',
    value: priceUsd,
    items: [
      {
        item_id: String(characterId),
        item_name: characterName,
        item_variant: licenseName,
        price: priceUsd,
        quantity: 1,
      },
    ],
  });
}

export function trackPurchase(transactionId: string, characterId: number, characterName: string, licenseName: string, priceUsd: number) {
  track('purchase', {
    transaction_id: transactionId,
    currency: 'USD',
    value: priceUsd,
    items: [
      {
        item_id: String(characterId),
        item_name: characterName,
        item_variant: licenseName,
        price: priceUsd,
        quantity: 1,
      },
    ],
  });
}

export function trackFreeDownload(characterId: number, characterName: string) {
  track('free_download', {
    item_id: String(characterId),
    item_name: characterName,
    value: 0,
  });
}

// ── Custom character creation events ───────────────────────────────────────

export function trackBeginCreate() {
  track('begin_create');
}

export function trackPurchaseCredits(transactionId: string, credits: number, amountUsd: number) {
  track('purchase_credits', {
    transaction_id: transactionId,
    currency: 'USD',
    value: amountUsd,
    credits,
  });
}
