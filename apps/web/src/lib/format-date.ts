/** "Jun 2026" — the prototype's insight-card meta format. */
export function formatMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * "7/27/26" — the insights-card meta row (`1683:2490`). Numeric and
 * two-digit year, exactly as the frame writes it; `en-US` because that is the
 * order the frame reads in (month first).
 */
export function formatNumericDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    timeZone: 'UTC',
  })
}
