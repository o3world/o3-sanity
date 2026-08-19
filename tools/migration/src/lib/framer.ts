import { JSDOM } from 'jsdom'

/**
 * The O3XO extract source: o3xo.ai, a Framer site.
 *
 * This is to O3XO what `lib/wp.ts` is to o3, and the two share nothing but the
 * job. WordPress is read through its own API — `terminus wp eval` running ACF's
 * `get_fields()` — so the extract gets the editor's structured record. Framer
 * exposes no CMS API to a site's own owner, so the only record of an article is
 * the page it serves, and **extraction here is a parse**.
 *
 * That difference sets the discipline. The parse hangs off `data-framer-name`,
 * the region names authored in the Framer file, rather than off generated class
 * names (`framer-daqsm4`) which change on every publish. Every region it needs
 * is required: a missing one throws, because a parse that silently returns an
 * empty body would commit an empty document. And it converts nothing — the body
 * stays verbatim HTML in the extract snapshot, exactly as WordPress's
 * `text_editor` HTML does, so `convert` remains the only place a mapping
 * decision is made.
 */
export const SOURCE = 'https://www.o3xo.ai'

/** One article, as the site serves it. Verbatim: no mapping, no defaults. */
export interface FramerInsight {
  /** The slug the site serves it at, which is the CMS item's own slug field. */
  readonly slug: string
  /** The path, for the parity check `convert` runs against the new route. */
  readonly path: string
  /**
   * The Framer CMS item id. The only handle the site exposes that an editor
   * cannot change, so it is the provenance id rather than the slug.
   */
  readonly collectionItemId: string | null
  /** The hero headline. */
  readonly title: string
  /** What the browser tab says — the parity reference for the title suffix. */
  readonly titleRendered: string
  /** The eyebrow above the headline: this site's one taxonomy. */
  readonly category: string | null
  /** The standfirst under the headline. Not the meta description. */
  readonly deck: string
  readonly heroImage: { readonly url: string; readonly alt: string } | null
  /** The article body, verbatim. Converted by `map/framer.ts`, not here. */
  readonly bodyHtml: string
  readonly seo: {
    readonly canonicalRendered: string
    readonly descriptionOverride: string
    readonly ogImage: string | null
  }
}

/** Where o3xo.ai serves an insight. The source site's path, not this app's. */
function insightPath(slug: string): string {
  return `/insights/${slug}`
}

/**
 * A Framer asset's identity: the path, without the resize query.
 *
 * Every size of one picture is the same URL with different query parameters
 * (`?scale-down-to=512&width=2160&height=2160`), so the query is a rendering
 * instruction rather than part of the asset. `data/assets.json` is keyed by this
 * string, so keeping the query would upload one photograph once per srcset
 * entry; dropping it also gets the original rather than a downscale, which is
 * the same rule `normalizeUploadUrl` enforces for WordPress thumbnails.
 */
export function assetUrl(url: string): string {
  return url.split('?')[0]!
}

/** Every insight slug in the site's sitemap, in the order it lists them. */
export function insightSlugsInSitemap(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((match) => decodeURIComponent(match[1]!))
    .map((url) => /\/insights\/([^/]+)\/?$/.exec(url)?.[1])
    .filter((slug): slug is string => Boolean(slug))
}

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(
      `o3xo.ai page does not have ${what} — the Framer file's structure has moved, ` +
        `so the parse in lib/framer.ts has to move with it`,
    )
  }
  return value
}

function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * The hero's rich-text blocks, in authored order, deduplicated.
 *
 * Framer emits one copy of a text block per breakpoint variant (`ssr-variant`),
 * so the title appears twice or three times depending on how many breakpoints
 * restyle it. Consecutive duplicates collapse; the surviving order is the one
 * the design file declares: eyebrow, headline, deck.
 */
function heroLines(hero: Element): string[] {
  const lines = [...hero.querySelectorAll('[data-framer-component-type="RichTextContainer"]')].map(
    (container) => text(container),
  )
  return lines.filter((line, i) => line !== '' && line !== lines[i - 1])
}

/**
 * One page of served HTML → the record committed under `data-o3xo/extract/`.
 *
 * Pure and fail-loud: it throws on a page whose structure it does not
 * recognise, rather than returning a half-record that would convert into a
 * document with an empty body.
 */
export function parseInsight(html: string, slug: string): FramerInsight {
  const doc = new JSDOM(html).window.document

  const hero = required(doc.querySelector('[data-framer-name="Hero"]'), 'data-framer-name="Hero"')
  const content = required(
    doc.querySelector(
      '[data-framer-name="Content"] [data-framer-component-type="RichTextContainer"]',
    ),
    'a RichTextContainer inside data-framer-name="Content"',
  )
  if (!content.querySelector('p')) {
    throw new Error(`o3xo.ai/${slug}: the Content region's first rich text holds no paragraph`)
  }

  // eyebrow, headline, deck. Asserted rather than assumed: three is what every
  // insight page on the site emits, and a fourth line means the hero gained a
  // field this parse would otherwise put in the wrong place.
  const lines = heroLines(hero)
  if (lines.length !== 3) {
    throw new Error(
      `o3xo.ai/${slug}: expected 3 lines in the hero (eyebrow, headline, deck), got ${lines.length}: ` +
        JSON.stringify(lines),
    )
  }
  const [category, title, deck] = lines as [string, string, string]

  const image = hero.querySelector('img')
  const src = image?.getAttribute('src')

  const meta = (selector: string, attribute = 'content') =>
    doc.querySelector(selector)?.getAttribute(attribute) ?? null

  return {
    slug,
    path: insightPath(slug),
    // Framer serializes its per-page props as an HTML attribute value, so the
    // id arrives entity-encoded and is read off the raw markup rather than the
    // DOM. Absent is a legal answer: it is provenance, not identity.
    collectionItemId:
      /&quot;collectionItemId&quot;:&quot;([A-Za-z0-9_-]+)&quot;/.exec(html)?.[1] ?? null,
    title,
    titleRendered: text(doc.querySelector('title')),
    category: category || null,
    deck,
    heroImage: src ? { url: assetUrl(src), alt: image?.getAttribute('alt') ?? '' } : null,
    bodyHtml: content.innerHTML,
    seo: {
      canonicalRendered: meta('link[rel="canonical"]', 'href') ?? '',
      descriptionOverride: meta('meta[name="description"]') ?? '',
      ogImage: meta('meta[property="og:image"]'),
    },
  }
}

/** GET a page off the live site, following the apex → www redirect. */
export async function fetchPage(path: string): Promise<string> {
  const url = `${SOURCE}${path}`
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
  return res.text()
}
