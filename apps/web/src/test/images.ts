/**
 * What a route's images tell the browser to download, made assertable (#268).
 *
 * A `sizes` list and a `priority` flag move nothing in the layout, so nothing
 * but the rendered markup can report on them — a story cannot say which image
 * a route preloads, and a screenshot cannot say what it declared.
 *
 * The invariant worth holding per route is that **at most one image is
 * preloaded**: the LCP candidate gets the head start and everything else
 * waits, because a second preload only takes bandwidth from the first.
 *
 * next/image marks that image by **omitting** `loading` (it carries the
 * urgency in a hoisted `<link rel="preload">` instead) and gives every other
 * image `loading="lazy"`. The absence is the signal, which is why these read
 * it that way rather than looking for an `eager`.
 */

/** Every `<img>` in a rendered document, as its raw tag text. */
export function imageTags(html: string): string[] {
  return html.match(/<img\b[^>]*>/g) ?? []
}

/** The `<img>`s the route asks the browser to fetch straight away. */
export function preloadedImageTags(html: string): string[] {
  return imageTags(html).filter((tag) => !tag.includes('loading="lazy"'))
}

/** The `sizes` each `<img>` declares, in document order; `null` where none. */
export function declaredSizes(html: string): Array<string | null> {
  return imageTags(html).map((tag) => /\ssizes="([^"]*)"/.exec(tag)?.[1] ?? null)
}
