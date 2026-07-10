import { AvailableBalance, AvailableBalanceByCurrency, AvailableBalanceBucket } from '@/lib/types/advance';

/**
 * Reads the available-balance bucket for a given advance type + currency from the
 * `/advance/dashboard/available` response, which is nested as
 * `{ personal: { USD: {...}, NGN: {...} }, marketting: {...} }`.
 *
 * Falls back to a legacy flat shape (`{ personal: { available } }`) so the UI keeps
 * working if the API ever returns the un-nested form.
 */
export function getAvailableBucket(
  balance: AvailableBalance | undefined,
  type: 'personal' | 'marketting',
  currency = 'USD'
): AvailableBalanceBucket | undefined {
  const group = balance?.[type] as
    | (AvailableBalanceByCurrency & AvailableBalanceBucket)
    | undefined;
  if (!group) return undefined;

  const code = (currency || 'USD').toUpperCase();
  const nested = group[code];
  if (nested && typeof nested === 'object') return nested;

  // Legacy flat shape: the group itself carries the numeric fields.
  if (typeof group.available === 'number') return group as AvailableBalanceBucket;
  return undefined;
}

export function getAvailableAmount(
  balance: AvailableBalance | undefined,
  type: 'personal' | 'marketting',
  currency = 'USD'
): number {
  return Number(getAvailableBucket(balance, type, currency)?.available ?? 0);
}
