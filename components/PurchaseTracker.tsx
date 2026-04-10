'use client';

import { useEffect } from 'react';
import { trackPurchase } from '@/lib/analytics';

interface Props {
  transactionId: string;
  characterId: number;
  characterName: string;
  licenseName: string;
  amount: number;
}

export default function PurchaseTracker({ transactionId, characterId, characterName, licenseName, amount }: Props) {
  useEffect(() => {
    trackPurchase(transactionId, characterId, characterName, licenseName, amount);
    // Only fire once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
