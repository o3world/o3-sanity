/**
 * Normalize a route param to the percent-encoded form Sanity slugs store.
 *
 * Next.js is not consistent about this: for the same request it hands `Page`
 * the RAW segment (`solu%C3%A7%C3%B5es`) but `generateMetadata` the DECODED
 * one (`soluções`). Because slugs are stored encoded, the page would find its
 * doc while metadata silently missed.
 *
 * Only raw non-ASCII is re-encoded. Every ASCII byte passes through
 * untouched, so an already-encoded segment is a no-op and a literal `+`
 * stays `+` rather than becoming `%2B` — which is what a blanket
 * `encodeURIComponent(decodeURIComponent(s))` round-trip would do.
 */
export function encodePathParam(segment: string): string {
  // Iterated with for..of so astral-plane characters arrive as whole code
  // points rather than lone surrogates.
  let out = ''
  for (const ch of segment) {
    const codePoint = ch.codePointAt(0)
    out += codePoint !== undefined && codePoint > 0x7f ? encodeURIComponent(ch) : ch
  }
  return out
}
