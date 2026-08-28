/**
 * The GROQ slice a page of a collection index is.
 *
 * The page number itself comes from the path (`indexPaths.ts`), already
 * validated — a segment that is not a page is a 404 rather than a value to
 * round — so all that is left here is turning it into the `[$offset...$end]`
 * (exclusive end) the index queries consume.
 */
export function pageRange(
  page: number,
  pageSize: number,
): { readonly offset: number; readonly end: number } {
  const offset = (page - 1) * pageSize
  return { offset, end: offset + pageSize }
}
