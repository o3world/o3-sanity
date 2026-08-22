import { JSDOM } from 'jsdom'

import type { FramerAccordionRow } from './framerAccordion'
import { SOURCE, assetUrl } from './framer'

/**
 * o3xo.ai's marketing pages, as the site serves them — the second shape the
 * Framer source comes in.
 *
 * `lib/framer.ts` parses a CMS item: one collection template, the same three
 * regions on all 40 insights, so the parse can name the region it wants. A
 * marketing page has no template. Each of the eleven is laid out band by band in
 * the design file, and Framer names those bands whatever the designer typed —
 * `Section`, `Section2`, `Section 5`, or nothing at all. So this parse hangs
 * off the one structure every page does share: **the container the bands are
 * children of**, and inside each band, the text containers in authored order.
 *
 * It maps nothing. A band arrives as its lines, its links and its images, and
 * `map/framerPage.ts` decides which block each band becomes — the same split
 * the WordPress side keeps between `lib/wp.ts` and its mappers.
 *
 * Three of Framer's habits shape everything below, and each one silently
 * corrupts a naive read:
 *
 * 1. **Every band is emitted once per breakpoint variant.** Read the DOM as
 *    written and each page says everything two or three times. Lines dedupe by
 *    their own text across the whole page: within one page a repeated sentence
 *    is a breakpoint, never a second authoring.
 * 2. **A text container holds one or more authored paragraphs.** The rail's
 *    label sits above its heading in one container, so gluing the container's
 *    text loses the boundary; a sentence the designer hard-wrapped over two
 *    lines is one paragraph, so splitting it loses the sentence. A line
 *    therefore carries both readings — `parts` and their `text`.
 * 3. **The footer arrives in the same container list the bands do.** Framer
 *    has no landmark elements, so the content ends where the copyright line
 *    starts, and everything from there is chrome.
 */

/** One authored text container: its paragraphs, and those paragraphs as a line. */
export interface FramerLine {
  /** The tag of the container's first paragraph — `h1`…`h4`, or `p`. */
  readonly tag: string
  /** The container's paragraphs joined with a space: what a reader sees. */
  readonly text: string
  /** Those paragraphs, unjoined, in authored order. */
  readonly parts: readonly string[]
}

/** A link, with the path the new site serves it at where it points inside. */
export interface FramerLink {
  readonly label: string
  readonly href: string
}

export interface FramerImage {
  readonly url: string
  readonly alt: string
  /**
   * The first line of the smallest region that holds both this picture and any
   * text — which, in a band of repeated cards, is the card's own heading.
   * Framer's alt text is often empty, so this is what says which item a
   * picture belongs to.
   */
  readonly near: string
}

/** One band of the page, as authored — not yet a block. */
export interface FramerBand {
  /** The `data-framer-name` the design file gave it, where it gave one. */
  readonly name: string | null
  readonly lines: readonly FramerLine[]
  readonly links: readonly FramerLink[]
  readonly images: readonly FramerImage[]
  /**
   * The band's accordion rows, where it is one.
   *
   * The one thing on these pages the DOM does not carry: Framer draws every row
   * closed and ships the answers as props in the page module, so the questions
   * are above in `lines` and the answers arrive from `lib/framerAccordion.ts`
   * through `withAccordionAnswers`. Absent on every other band, and absent here
   * too when the module has moved under the parse.
   */
  readonly faq?: readonly FramerAccordionRow[]
}

/**
 * Whether this page has an accordion whose answers have not been read yet.
 *
 * Two questions is the floor: one line ending in a question mark is a headline
 * asking something, and several in one band is the shape only an accordion has.
 * The extractor asks this before it goes looking for the page's JavaScript, so
 * the ten pages without one cost no extra requests.
 */
export function needsAccordionAnswers(page: FramerPage): boolean {
  return page.bands.some(
    (band) => !band.faq && band.lines.filter((line) => line.text.endsWith('?')).length >= 2,
  )
}

/**
 * The page with each accordion row filed under the band that asks it.
 *
 * A band claims the rows whose question it already renders, which is the only
 * join available: the module knows what the rows say and the DOM knows where
 * they sit, and neither knows both.
 */
export function withAccordionAnswers(
  page: FramerPage,
  rows: readonly FramerAccordionRow[],
): FramerPage {
  if (rows.length === 0) return page
  return {
    ...page,
    bands: page.bands.map((band) => {
      const asked = new Set(band.lines.map((line) => line.text))
      const faq = rows.filter((row) => asked.has(row.question))
      return faq.length > 0 ? { ...band, faq } : band
    }),
  }
}

/** The site chrome, which is one record shared by every page (see `parseChrome`). */
export interface FramerChrome {
  readonly title: string
  readonly footerTagline: string
  readonly legalName: string
  readonly copyrightNote: string
  /** The brand-property row in the footer — O3 World, 1682. */
  readonly footerLinks: readonly FramerLink[]
  /** The small print beside the copyright. */
  readonly legalLinks: readonly FramerLink[]
  readonly socialLinks: readonly { readonly label: string; readonly url: string }[]
  /** The closing ask Framer keeps in the footer component. */
  readonly cta: {
    readonly heading: string
    readonly body: string
    readonly button: FramerLink
  } | null
}

/** One page, as the site serves it. Verbatim: no mapping, no defaults. */
export interface FramerPage {
  /** `index`, `about`, `industries/construction` — the new site's slug. */
  readonly slug: string
  /** The path the site serves it at, for the parity check `convert` runs. */
  readonly path: string
  /** The page's one `<h1>`. */
  readonly title: string
  /** What the browser tab says — the parity reference for the title suffix. */
  readonly titleRendered: string
  readonly bands: readonly FramerBand[]
  readonly chrome: FramerChrome
  readonly seo: {
    readonly canonicalRendered: string
    readonly descriptionOverride: string
    readonly ogImage: string | null
  }
}

/** `© 2026 O3 World, LLC. All rights reserved.` — the end of the content. */
const LEGAL_LINE = /^©\s*\d{4}\s+(.+?)\.\s*All rights reserved\.?\s*(.*)$/

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

/** Where the new site serves this page. The homepage's slug is `index`. */
export function pagePath(slug: string): string {
  return slug === 'index' ? '/' : `/${slug}`
}

/**
 * Every non-collection path in the site's sitemap, as a page slug.
 *
 * The sitemap is the inventory of what has to keep resolving. Insights and case
 * studies are collection members with their own routes and their own tickets,
 * and `/insights` and `/case-studies` are those collections' index routes
 * rather than documents — what is left is the page space this file covers.
 */
export function pagePathsInSitemap(xml: string): string[] {
  const collections = ['insights', 'case-studies']
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((match) => decodeURIComponent(match[1]!))
    .map((url) => new URL(url).pathname.replace(/^\/+|\/+$/g, ''))
    .filter((path) => !collections.some((c) => path === c || path.startsWith(`${c}/`)))
    .map((path) => path || 'index')
}

/**
 * A link's destination as the new site will hold it: a path when it points at
 * o3xo.ai, the URL as written when it points anywhere else.
 *
 * Framer writes internal links relative to the page they sit on, so one footer
 * says `../contact/` on `/about` and `../../contact/` on an industry page.
 * Resolving both against the page's own path is what makes them the one path
 * the new site serves — and a site-relative path is what `button.href` wants.
 * (Body links inside an insight are a different case, migrated as written:
 * see `map/framer.ts`.)
 */
function resolveHref(href: string, pagePathname: string): string | null {
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return href
  let url: URL
  try {
    url = new URL(href, `${SOURCE}${pagePathname === '/' ? '/' : `${pagePathname}/`}`)
  } catch {
    return null
  }
  if (url.host !== new URL(SOURCE).host) return url.toString()
  const path = url.pathname.replace(/\/+$/, '')
  return path === '' ? '/' : path
}

/** The paragraphs of one text container, as a line — or nothing if it is empty. */
function lineOf(container: Element): FramerLine | null {
  const children = container.children.length ? [...container.children] : [container]
  const parts = children.map((child) => clean(child.textContent)).filter(Boolean)
  if (parts.length === 0) return null
  return { tag: children[0]!.tagName.toLowerCase(), text: parts.join(' '), parts }
}

function linesIn(root: Element, seen: Set<string>): FramerLine[] {
  const lines: FramerLine[] = []
  for (const container of root.querySelectorAll(
    '[data-framer-component-type="RichTextContainer"]',
  )) {
    const line = lineOf(container)
    if (!line || seen.has(line.text)) continue
    seen.add(line.text)
    lines.push(line)
  }
  return lines
}

function linksIn(root: Element, pagePathname: string): FramerLink[] {
  const links: FramerLink[] = []
  const seen = new Set<string>()
  for (const anchor of root.querySelectorAll('a[href]')) {
    const href = resolveHref(anchor.getAttribute('href')!, pagePathname)
    if (!href || seen.has(href)) continue
    seen.add(href)
    links.push({ label: clean(anchor.textContent), href })
  }
  return links
}

/** The line a picture sits beside — see `FramerImage.near`. */
function nearestLine(img: Element, stopAt: Element): string {
  let node = img.parentElement
  while (node && node !== stopAt) {
    const first = node.querySelector('[data-framer-component-type="RichTextContainer"]')
    if (first) return clean(first.textContent)
    node = node.parentElement
  }
  return ''
}

function imagesIn(root: Element): FramerImage[] {
  const images: FramerImage[] = []
  const seen = new Set<string>()
  for (const img of root.querySelectorAll('img[src]')) {
    const url = assetUrl(img.getAttribute('src')!)
    if (seen.has(url)) continue
    seen.add(url)
    images.push({ url, alt: clean(img.getAttribute('alt')), near: nearestLine(img, root) })
  }
  return images
}

/**
 * The element the page's bands are children of.
 *
 * `Main` is the name the design file gives it on the pages that have one; the
 * rest number their bands from `Section1`, whose parent is the same container.
 * Required: a page whose bands cannot be found would otherwise convert to a
 * document with nothing in it.
 */
function bandRoot(doc: Document, slug: string): Element {
  const named = doc.querySelector('[data-framer-name="Main"]')
  if (named) return named
  const first = doc.querySelector('[data-framer-name="Section1"]')?.parentElement
  if (first) return first
  throw new Error(
    `o3xo.ai/${slug}: no band container — neither data-framer-name="Main" nor a Section1 to take ` +
      `the parent of. The Framer file's structure has moved, so this parse has to move with it`,
  )
}

/**
 * The footer, wherever it sits.
 *
 * It is a child of the band container on some pages and a sibling of it on
 * others, so it is found by its content rather than its position: **the widest
 * region around the copyright line that carries no heading.** Every page's own
 * content opens with an `<h1>`, and nothing in the chrome is a heading — not
 * the closing ask, not the brand name — so the first ancestor that contains
 * one is the page, and the chrome is everything below it.
 */
function footerRoot(doc: Document): Element | null {
  for (const container of doc.querySelectorAll(
    '[data-framer-component-type="RichTextContainer"]',
  )) {
    if (!LEGAL_LINE.test(clean(container.textContent))) continue
    let node = container.parentElement
    while (node?.parentElement && !node.parentElement.querySelector('h1, h2, h3')) {
      node = node.parentElement
    }
    return node
  }
  return null
}

/**
 * The site chrome — everything the footer says about the entity that owns the
 * site, which nothing in this repo had extracted (#217 left `siteSettings` a
 * hand-seeded bootstrap and said so).
 *
 * The footer's lines are in one order on every page, and the brand name is the
 * hinge: what follows it is the tagline and the copyright, what precedes it is
 * the closing ask, and what comes after the copyright are the link labels.
 * Contact is the one page whose footer carries no ask, which is why `cta` is
 * allowed to be absent.
 *
 * **The nav is deliberately not read here.** Framer renders three of the five
 * nav items as dropdown triggers with no `href` in the served HTML, so the
 * markup carries labels without destinations; `map/framerPage.ts` supplies the
 * destinations from the sitemap and says so.
 */
export function parseChrome(html: string, pagePathname: string): FramerChrome {
  const doc = new JSDOM(html).window.document
  const organization = JSON.parse(
    doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}',
  ) as { name?: string; sameAs?: string[] }
  const title = organization.name ?? ''

  const root = footerRoot(doc)
  if (!root) {
    throw new Error(
      'o3xo.ai: no footer — the copyright line is the marker for it, and nothing on this page ' +
        'matches it. The Framer file has moved, so this parse has to move with it',
    )
  }

  const lines = linesIn(root, new Set()).map((line) => line.text)
  const links = linksIn(root, pagePathname)
  const brandAt = lines.indexOf(title)
  const legalAt = lines.findIndex((line) => LEGAL_LINE.test(line))
  const [, legalName = '', copyrightNote = ''] = LEGAL_LINE.exec(lines[legalAt] ?? '') ?? []

  const ask = brandAt === 3 ? lines.slice(0, 3) : []
  const cta =
    ask.length === 3
      ? {
          heading: ask[0]!,
          body: ask[1]!,
          button: links.find((link) => link.label === ask[2]) ?? { label: ask[2]!, href: '' },
        }
      : null

  // What is left after the copyright is the footer's link row. A link to a
  // privacy policy is small print; the rest are the other properties O3 runs,
  // which is what `utilityNavItems` holds.
  const rowLabels = new Set(lines.slice(legalAt + 1))
  const row = links.filter((link) => rowLabels.has(link.label))

  return {
    title,
    footerTagline: lines[brandAt + 1] ?? '',
    legalName,
    copyrightNote,
    footerLinks: row.filter((link) => !link.href.includes('privacy')),
    legalLinks: row.filter((link) => link.href.includes('privacy')),
    socialLinks: (organization.sameAs ?? []).map((url) => ({
      label: url.includes('linkedin') ? 'LinkedIn' : new URL(url).hostname,
      url,
    })),
    cta,
  }
}

/**
 * One page of served HTML → the record committed under `data-o3xo/extract/`.
 *
 * Pure and fail-loud, like `parseInsight`: it throws on a page whose structure
 * it does not recognise rather than returning a half-record, because a page
 * that parsed to no bands would convert into a document with a heading and
 * nothing under it.
 */
export function parsePage(html: string, slug: string): FramerPage {
  const doc = new JSDOM(html).window.document
  const path = pagePath(slug)
  const root = bandRoot(doc, slug)

  const seen = new Set<string>()
  const bands: FramerBand[] = []
  for (const child of root.children) {
    const lines = linesIn(child, seen)
    // Everything from the copyright line down is chrome, not this page.
    if (lines.some((line) => LEGAL_LINE.test(line.text))) break
    const images = imagesIn(child)
    if (lines.length === 0 && images.length === 0) continue
    bands.push({
      name: child.getAttribute('data-framer-name'),
      lines,
      links: linksIn(child, path),
      images,
    })
  }

  const title = bands.flatMap((band) => band.lines).find((line) => line.tag === 'h1')?.text
  if (!title) {
    throw new Error(
      `o3xo.ai${path}: no h1 in any band, so there is no document title to take. ` +
        `The Framer file's structure has moved, so this parse has to move with it`,
    )
  }
  if (bands.length < 2) {
    throw new Error(`o3xo.ai${path}: only ${bands.length} band(s) parsed — the page has more`)
  }

  const meta = (selector: string, attribute = 'content') =>
    doc.querySelector(selector)?.getAttribute(attribute) ?? null

  return {
    slug,
    path,
    title,
    titleRendered: clean(doc.querySelector('title')?.textContent),
    bands,
    chrome: parseChrome(html, path),
    seo: {
      canonicalRendered: meta('link[rel="canonical"]', 'href') ?? '',
      descriptionOverride: meta('meta[name="description"]') ?? '',
      ogImage: meta('meta[property="og:image"]'),
    },
  }
}
