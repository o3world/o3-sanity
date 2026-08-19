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

/**
 * Case-study URLs the site serves that are not case studies.
 *
 * `redirect-input` 302s to `redirect-output`, and `redirect-output` is a
 * duplicate of the Buffalo Construction item — its `<title>` still reads
 * "…Copy Copy". They are a redirect rig somebody left in the collection, and
 * the sitemap advertises both. Excluded here, by name, because "which URLs are
 * junk" is a fact about the source site rather than a shape a parse can infer:
 * the pages are well-formed and would migrate cleanly into two case studies
 * nobody wrote. The launch-cutover redirect audit (#223) needs the same two
 * names, and this is where they are written down.
 */
export const JUNK_CASE_STUDY_SLUGS: readonly string[] = ['redirect-input', 'redirect-output']

/**
 * Every real case-study slug in the site's sitemap, in the order it lists them.
 *
 * The index page is `/case-studies/` with nothing after it, so the trailing
 * segment has to be non-empty; the junk above is dropped by name.
 */
export function caseStudySlugsInSitemap(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((match) => decodeURIComponent(match[1]!))
    .map((url) => /\/case-studies\/([^/]+)\/?$/.exec(url)?.[1])
    .filter((slug): slug is string => Boolean(slug))
    .filter((slug) => !JUNK_CASE_STUDY_SLUGS.includes(slug))
}

/**
 * One case study as the collection index draws it.
 *
 * The index is not a listing derived from the detail page: `client`, `subject`,
 * `headline`, the headline stat and the card photograph are authored on the CMS
 * item and appear on the index and nowhere else. Reading only the detail pages
 * would lose the client's name — the one field `caseStudy` requires that the
 * detail page never prints.
 */
export interface FramerCaseStudyCard {
  readonly slug: string
  /** Who the work was for, in the source's own words. */
  readonly client: string
  /** The capability label above the card sentence, e.g. "RFP automation". */
  readonly subject: string
  /** The card sentence, e.g. "See how we turned years of expert content into…". */
  readonly headline: string
  readonly stat: { readonly value: string; readonly label: string } | null
  readonly image: { readonly url: string; readonly alt: string } | null
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

/* ------------------------------------------------------------------ *
 * Case studies (#219)
 *
 * A second collection on the same site, parsed by the same discipline: the
 * structural `data-framer-name` regions the design file authors — `Section`,
 * `Margin`, `Article` — and never a generated class name. The RichTextContainer
 * regions on these pages are named after the master component's own default
 * copy ("AI solutions making finance + insurance more accessible" is the name
 * of the box the title sits in), so a name is read for structure and never for
 * meaning.
 * ------------------------------------------------------------------ */

/**
 * The rich-text lines under a node, in authored order, deduplicated.
 *
 * Framer emits one copy of a text block per breakpoint variant, so a line
 * appears two or three times depending on how many breakpoints restyle it.
 * Generalises what `heroLines` does for an insight hero; the two collapse into
 * one once #220 has landed and this file is no longer being written from both
 * ends.
 */
function richTextLines(root: Element): string[] {
  const lines = [...root.querySelectorAll('[data-framer-component-type="RichTextContainer"]')].map(
    (container) => text(container),
  )
  return lines.filter((line, i) => line !== '' && line !== lines[i - 1])
}

/** Where o3xo.ai serves a case study. The source site's path, not this app's. */
function caseStudyPath(slug: string): string {
  return `/case-studies/${slug}`
}

/**
 * The collection index → one card per case study.
 *
 * Each card is an anchor at `./<slug>` holding five rich-text lines in authored
 * order — client, subject, headline, stat value, stat label — and the card
 * photograph. Five is asserted rather than assumed: a sixth line means the card
 * gained a field this parse would otherwise file in the wrong place.
 */
export function parseCaseStudyIndex(html: string): FramerCaseStudyCard[] {
  const doc = new JSDOM(html).window.document
  const cards = new Map<string, FramerCaseStudyCard>()

  for (const anchor of doc.querySelectorAll('a[href^="./"]')) {
    const slug = anchor.getAttribute('href')!.replace(/^\.\//, '').replace(/\/$/, '')
    if (!slug || JUNK_CASE_STUDY_SLUGS.includes(slug) || cards.has(slug)) continue

    const lines = richTextLines(anchor)
    if (lines.length === 0) continue
    if (lines.length !== 5) {
      throw new Error(
        `o3xo.ai/case-studies: the card for "${slug}" has ${lines.length} lines, not the ` +
          `5 the collection authors (client, subject, headline, stat value, stat label): ` +
          JSON.stringify(lines),
      )
    }
    const [client, subject, headline, value, label] = lines as [
      string,
      string,
      string,
      string,
      string,
    ]
    const image = anchor.querySelector('img')
    const src = image?.getAttribute('src')

    cards.set(slug, {
      slug,
      client,
      subject,
      headline,
      stat: { value, label },
      image: src ? { url: assetUrl(src), alt: image?.getAttribute('alt') ?? '' } : null,
    })
  }

  return [...cards.values()]
}

/** One chapter of the narrative: its eyebrow, its heading and its prose. */
export interface FramerCaseStudyChapter {
  readonly kicker: string
  readonly title: string
  /** Verbatim HTML, converted by the mapper — never here. */
  readonly bodyHtml: string
}

/** One case study, as the site serves it. Verbatim: no mapping, no defaults. */
export interface FramerCaseStudy {
  readonly slug: string
  /** The path, for the parity check `convert` runs against the new route. */
  readonly path: string
  readonly collectionItemId: string | null
  /** The hero headline. */
  readonly title: string
  /** What the browser tab says — the parity reference for the title suffix. */
  readonly titleRendered: string
  /** The standfirst under the headline. Not the meta description. */
  readonly deck: string
  readonly heroImage: { readonly url: string; readonly alt: string } | null
  /** Opportunity, Solution — the bands between the hero and the results. */
  readonly chapters: readonly FramerCaseStudyChapter[]
  readonly stats: readonly { readonly value: string; readonly label: string }[]
  readonly quote: { readonly text: string; readonly attribution: string } | null
  /** The same item as the collection index draws it. */
  readonly card: FramerCaseStudyCard
  readonly seo: {
    readonly canonicalRendered: string
    readonly descriptionOverride: string
    readonly ogImage: string | null
  }
}

/**
 * The rich-text lines a node holds, asserted to be exactly `count`.
 *
 * Every band on these pages has a fixed number of lines, and the count is what
 * says which line is which. A band that grew one would otherwise file its new
 * copy under whatever field happens to sit at that index.
 */
function linesExactly(root: Element, count: number, what: string, slug: string): string[] {
  const lines = richTextLines(root)
  if (lines.length !== count) {
    throw new Error(
      `o3xo.ai/case-studies/${slug}: expected ${count} lines in ${what}, got ${lines.length}: ` +
        JSON.stringify(lines),
    )
  }
  return lines
}

/**
 * The prose in a body `Margin`: every rich text it holds, in authored order,
 * verbatim. Consecutive duplicates collapse for the same reason they do in a
 * hero — one copy per breakpoint variant.
 *
 * Two paragraphs side by side is a two-column row (`flex-flow: row`), so
 * document order is reading order and a single-column body loses nothing but
 * the columns.
 */
function marginHtml(margin: Element): string {
  const html = [...margin.querySelectorAll('[data-framer-component-type="RichTextContainer"]')].map(
    (container) => container.innerHTML.trim(),
  )
  return html.filter((piece, i) => piece !== '' && piece !== html[i - 1]).join('')
}

/**
 * One case-study page → the record committed under `data-o3xo/extract/`.
 *
 * The bands are told apart by the structural regions the Framer file authors,
 * never by the copy in them: the narrative band is the `Section` with `Margin`
 * children, the results band the one with `Article` children, and the quote
 * band the one with neither. Pure and fail-loud (ADR 0002): a page whose
 * structure it does not recognise throws rather than converting into a case
 * study with a hole where its story was.
 *
 * `card` comes from the collection index, which is the only place the client's
 * name is published — see `FramerCaseStudyCard`.
 */
export function parseCaseStudy(
  html: string,
  slug: string,
  card: FramerCaseStudyCard,
): FramerCaseStudy {
  const doc = new JSDOM(html).window.document
  const main = required(doc.querySelector('[data-framer-name="Main"]'), 'data-framer-name="Main"')
  const sections = [...main.querySelectorAll(':scope > [data-framer-name="Section"]')]
  if (sections.length < 2) {
    throw new Error(
      `o3xo.ai/case-studies/${slug}: found ${sections.length} Section regions under Main, ` +
        `so the page's band structure has moved`,
    )
  }

  const [hero, ...rest] = sections as [Element, ...Element[]]
  const [title, deck] = linesExactly(hero, 2, 'the hero (headline, deck)', slug) as [string, string]

  const narrative = rest.find((section) =>
    section.querySelector(':scope > [data-framer-name="Margin"]'),
  )
  if (!narrative) {
    throw new Error(
      `o3xo.ai/case-studies/${slug}: no narrative band — no Section under Main has Margin ` +
        `children, so the parse in lib/framer.ts has to move with the Framer file`,
    )
  }
  const results = rest.find((section) => section.querySelector('[data-framer-name="Article"]'))
  const quoteBand = rest.find((section) => section !== narrative && section !== results)

  const margins = [...narrative.querySelectorAll(':scope > [data-framer-name="Margin"]')]
  if (margins.length === 0 || margins.length % 2 !== 0) {
    throw new Error(
      `o3xo.ai/case-studies/${slug}: the narrative band holds ${margins.length} Margin rows; ` +
        `a chapter is a heading row followed by a prose row, so the count is always even`,
    )
  }
  const chapters: FramerCaseStudyChapter[] = []
  for (let i = 0; i < margins.length; i += 2) {
    const [kicker, chapterTitle] = linesExactly(
      margins[i]!,
      2,
      `chapter ${i / 2 + 1}'s heading row (eyebrow, title)`,
      slug,
    ) as [string, string]
    const bodyHtml = marginHtml(margins[i + 1]!)
    if (!bodyHtml) {
      throw new Error(`o3xo.ai/case-studies/${slug}: chapter "${chapterTitle}" has no prose`)
    }
    chapters.push({ kicker, title: chapterTitle, bodyHtml })
  }

  // The results band ships with an empty slot on most pages — the template
  // holds four and the engagements fill one. An empty one is not a finding.
  const stats: { value: string; label: string }[] = []
  for (const article of results?.querySelectorAll('[data-framer-name="Article"]') ?? []) {
    const lines = richTextLines(article)
    if (lines.length === 0) continue
    const [value, label] = linesExactly(article, 2, 'a results slot (figure, label)', slug) as [
      string,
      string,
    ]
    stats.push({ value, label })
  }

  const quoteLines = quoteBand
    ? (linesExactly(quoteBand, 3, 'the quote band (eyebrow, quote, attribution)', slug) as [
        string,
        string,
        string,
      ])
    : null

  const meta = (selector: string, attribute = 'content') =>
    doc.querySelector(selector)?.getAttribute(attribute) ?? null
  const ogImage = meta('meta[property="og:image"]')

  // Two images sit in the hero and only one belongs to this engagement: the
  // other is the backdrop the template paints on every case study. The head
  // settles it — `og:image` is the item's own picture — and the `<img>` serving
  // the same path supplies the alt text an editor wrote.
  const heroPath = ogImage ? assetUrl(ogImage) : null
  const heroImg = heroPath
    ? [...hero.querySelectorAll('img')].find(
        (image) => assetUrl(image.getAttribute('src') ?? '') === heroPath,
      )
    : undefined

  return {
    slug,
    path: caseStudyPath(slug),
    collectionItemId:
      /&quot;collectionItemId&quot;:&quot;([A-Za-z0-9_-]+)&quot;/.exec(html)?.[1] ?? null,
    title,
    titleRendered: text(doc.querySelector('title')),
    deck,
    heroImage: heroPath ? { url: heroPath, alt: heroImg?.getAttribute('alt') ?? '' } : null,
    chapters,
    stats,
    quote: quoteLines ? { text: quoteLines[1], attribution: quoteLines[2] } : null,
    card,
    seo: {
      canonicalRendered: meta('link[rel="canonical"]', 'href') ?? '',
      descriptionOverride: meta('meta[name="description"]') ?? '',
      ogImage,
    },
  }
}
