/**
 * Pagination helpers shared by `buildListingRoute` and listing views.
 *
 * `searchParams.page` arrives as `string | string[] | undefined` from
 * Next.js. These helpers normalize that into the 1-indexed page number +
 * the GROQ slice indices (`[$offset...$end]`, exclusive end) the listing
 * queries consume.
 */

export function parsePage(input: string | string[] | undefined): number {
  const raw = Array.isArray(input) ? input[0] : input
  if (typeof raw !== 'string' || raw === '') return 1
  const parsed = Math.floor(Number(raw))
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export function clampPage(requested: number, totalPages: number): number {
  if (totalPages <= 0) return 1
  if (requested < 1) return 1
  if (requested > totalPages) return totalPages
  return requested
}

export function pageRange(
  page: number,
  pageSize: number,
): { readonly offset: number; readonly end: number } {
  const offset = (page - 1) * pageSize
  return { offset, end: offset + pageSize }
}
