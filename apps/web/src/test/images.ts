/**
 * What a route's images tell the browser to download, made assertable (#268).
 *
 * A `sizes` list and a `priority` flag move nothing in the layout, so nothing
 * but the rendered markup can report on them — a story cannot say which image
 * a route preloads, and a screenshot cannot say what it declared.
 * The one invariant worth holding per route is that **at most one image is
 * eager**: the LCP candidate is preloaded and everything else waits, because a
 * second preload only takes bandwidth from the first.
 */

/** Every `<img>` in a rendered document, as its raw tag text. */
export function imageTags(html: string): string[] {
  return html.match(/<img\b[^>]*>/g) ?? []
}

/** The `<img>`s that load before the browser knows they are needed. */
export function eagerImageTags(html: string): string[] {
  return imageTags(html).filter((tag) => tag.includes('loading="eager"'))
}

/** The `sizes` each `<img>` declares, in document order; `null` where none. */
export function declaredSizes(html: string): Array<string | null> {
  return imageTags(html).map((tag) => /\ssizes="([^"]*)"/.exec(tag)?.[1] ?? null)
}
