export const CREDIT_COSTS = {
  outfit: 5,
  shot: 5,
  character: 25,
  refSheetRegen: 10,
  voice: 100,
  videoShort: 200,
  videoLong: 500,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export const DRIP_PER_DAY = 10;
export const DRIP_BALANCE_CAP = 25;
export const SIGNUP_BONUS = 35;

export const TIER_MONTHLY_CREDITS = {
  free: 0,
  starter: 400,
  studio: 1200,
  pro: 4000,
} as const;

export type SubscriptionTier = keyof typeof TIER_MONTHLY_CREDITS;
