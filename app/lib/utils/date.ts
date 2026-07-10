/**
 * True when `dateLike` falls in the given calendar year. A null/undefined `year`
 * means "no filter" and always matches. Used for client-side year filtering of
 * data whose API endpoint does not accept a year query param.
 */
export function isInYear(
  dateLike: string | number | Date | undefined | null,
  year: number | null | undefined
): boolean {
  if (year == null) return true;
  if (!dateLike) return false;
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getFullYear() === year;
}
