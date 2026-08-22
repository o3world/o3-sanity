import { describe, expect, it } from 'vitest'

import { pagePathsInSitemap, parseChrome, parsePage } from './framerPage'

/**
 * The O3XO page source. o3xo.ai's marketing pages are Framer's other shape: no
 * CMS item behind them, no `Hero`/`Content` regions, just the bands the design
 * file lays out. So the parse hangs off the band container and reads what is
 * inside each band, and the fixture below is that structure cut down to the
 * parts the parse depends on.
 *
 * Three of Framer's habits are represented, because each one broke a naive
 * read: a band emitted once per breakpoint, a text container holding two
 * authored paragraphs (the rail label above its heading), and the footer —
 * chrome that arrives inside the same container list as the content.
 */
const PAGE = `<!DOCTYPE html><html><head>
<title>AI solutions built for construction | O3XO</title>
<meta name="description" content="The search-result sentence.">
<link rel="canonical" href="https://www.o3xo.ai/industries/construction">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"O3XO","url":"https://www.o3xo.ai/","sameAs":["https://www.linkedin.com/company/o3xo"]}</script>
</head><body>
<div data-framer-name="Main">
  <div data-framer-name="Section">
    <div data-framer-component-type="RichTextContainer"><h1 class="framer-text">AI solutions built for construction</h1></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Construction projects demand precision.</p></div>
    <img src="https://framerusercontent.com/images/hero.jpg?scale-down-to=512&amp;width=2160" alt="A site office">
  </div>
  <div data-framer-name="Section">
    <div data-framer-component-type="RichTextContainer"><h2 class="framer-text">Stop losing money</h2></div>
    <div class="ssr-variant"><div data-framer-component-type="RichTextContainer"><h2 class="framer-text">Stop losing money</h2></div></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">AI can solve these pain points.</p></div>
    <div class="card">
      <div data-framer-component-type="RichTextContainer"><p class="framer-text">Estimation</p></div>
      <div data-framer-component-type="RichTextContainer"><p class="framer-text">Weeks on complex bids.</p></div>
      <img src="https://framerusercontent.com/images/card.jpg?width=100" alt="">
    </div>
  </div>
  <div data-framer-name="Section3">
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Educate → Explore</p><p class="framer-text">AI strategy process</p></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Split over two lines</p><p class="framer-text">in the desktop variant.</p></div>
    <div class="ssr-variant"><div data-framer-component-type="RichTextContainer"><p class="framer-text">Split over two lines in the desktop variant.</p></div></div>
    <a href="../../contact/">Talk to us</a>
  </div>
  <div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Stop guessing, start discovering</p></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Identify the AI use cases that matter most.</p></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Get started: Schedule a consultation</p></div>
    <a href="../../contact/">Get started: Schedule a consultation</a>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">O3XO</p></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Transforming businesses through intelligent AI implementation.</p></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">© 2026 O3 World, LLC. All rights reserved.</p></div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">O3 World</p></div>
    <a href="https://www.o3world.com/">O3 World</a>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">1682</p></div>
    <a href="https://www.1682conference.com/">1682</a>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Privacy policy</p></div>
    <a href="https://www.o3world.com/privacy-policy/">Privacy policy</a>
  </div>
  <div>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Industries</p></div>
    <a href="../../industries/">Industries</a>
    <div data-framer-component-type="RichTextContainer"><p class="framer-text">Contact</p></div>
    <a href="../../contact/">Contact</a>
  </div>
</div>
</body></html>`

describe('parsePage', () => {
  const page = parsePage(PAGE, 'industries/construction')

  it('takes the document title from the page’s one h1', () => {
    expect(page.title).toBe('AI solutions built for construction')
    expect(page.titleRendered).toBe('AI solutions built for construction | O3XO')
  })

  it('serves the page at the path its slug spells, and records the canonical', () => {
    expect(page.path).toBe('/industries/construction')
    expect(page.seo.canonicalRendered).toBe('https://www.o3xo.ai/industries/construction')
  })

  /**
   * Framer emits one copy of a band per breakpoint variant, so a page read
   * naively repeats every word two or three times. Deduplication is by the
   * line's own text across the whole page: a repeat inside one page is a
   * breakpoint, never a second authoring of the same sentence.
   */
  it('collapses the copies Framer emits per breakpoint', () => {
    const headings = page.bands.flatMap((band) =>
      band.lines.filter((line) => line.text === 'Stop losing money'),
    )
    expect(headings).toHaveLength(1)
  })

  /**
   * The chrome is not a page. Framer's footer arrives in the same container
   * list the bands do, so the parse ends the content at it — otherwise every
   * one of the eleven pages would carry the copyright line as a band.
   */
  it('ends the content at the footer, and keeps the footer as chrome', () => {
    expect(page.bands).toHaveLength(3)
    expect(JSON.stringify(page.bands)).not.toContain('All rights reserved')
    expect(page.chrome.legalName).toBe('O3 World, LLC')
  })

  it('names each band, so a mapper can say which one it composed', () => {
    expect(page.bands.map((band) => band.name)).toEqual(['Section', 'Section', 'Section3'])
  })

  /**
   * A text container holds one or more authored paragraphs. Both readings are
   * needed: the rail's label and its heading are two paragraphs in one
   * container and must not be glued, while a sentence the designer broke over
   * two lines is one paragraph and must not be split.
   */
  it('keeps a container’s paragraphs separately and joined', () => {
    const rail = page.bands[2]!.lines[0]!
    expect(rail.parts).toEqual(['Educate → Explore', 'AI strategy process'])
    expect(rail.text).toBe('Educate → Explore AI strategy process')
  })

  it('joins a hard-wrapped sentence, so its breakpoint twin dedupes away', () => {
    const texts = page.bands[2]!.lines.map((line) => line.text)
    expect(texts).toContain('Split over two lines in the desktop variant.')
    expect(texts.filter((t) => t.startsWith('Split over'))).toHaveLength(1)
  })

  it('records each line’s heading level, which is what says hero from band', () => {
    expect(page.bands[0]!.lines.map((line) => line.tag)).toEqual(['h1', 'p'])
    expect(page.bands[1]!.lines[0]!.tag).toBe('h2')
  })

  /**
   * Framer writes links relative to the page they sit on, so the same footer
   * says `../contact/` on `/about` and `../../contact/` on an industry page.
   * Resolved against the page's own path, both become the one path the new
   * site serves.
   */
  it('resolves a relative link to the path the new site serves', () => {
    expect(page.bands[2]!.links).toEqual([{ label: 'Talk to us', href: '/contact' }])
  })

  it('takes an image at its full size, with the resize query dropped', () => {
    expect(page.bands[0]!.images).toEqual([
      { url: 'https://framerusercontent.com/images/hero.jpg', alt: 'A site office', near: '' },
    ])
  })

  /**
   * `near` is what says which item a picture belongs to. Framer leaves these
   * alt attributes empty and emits a band of six cards as six pictures in one
   * list, so the card a picture sits inside is the only thing that pairs them.
   * A picture that belongs to the band rather than to an item — the hero's
   * background above — sits beside no line and says so.
   */
  it('names the line a card’s picture sits beside', () => {
    expect(page.bands[1]!.images).toEqual([
      { url: 'https://framerusercontent.com/images/card.jpg', alt: '', near: 'Estimation' },
    ])
  })

  it('fails loud when the band container it hangs off is not there', () => {
    expect(() => parsePage('<html><body><p>hi</p></body></html>', 'about')).toThrow(/band/)
  })

  it('fails loud when the page has no h1 to take a title from', () => {
    const noHeading = PAGE.replace(
      /<h1[^>]*>[^<]*<\/h1>/,
      '<p class="framer-text">not a heading</p>',
    )
    expect(() => parsePage(noHeading, 'industries/construction')).toThrow(/h1/)
  })

  it('serves the homepage at the site root', () => {
    expect(parsePage(PAGE, 'index').path).toBe('/')
  })
})

describe('parseChrome', () => {
  const chrome = parseChrome(PAGE, '/industries/construction')

  it('reads the entity that owns the site, which nothing had extracted', () => {
    expect(chrome.legalName).toBe('O3 World, LLC')
    expect(chrome.socialLinks).toEqual([
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/o3xo' },
    ])
  })

  it('reads the footer’s tagline and its links', () => {
    expect(chrome.footerTagline).toBe(
      'Transforming businesses through intelligent AI implementation.',
    )
    expect(chrome.footerLinks).toEqual([
      { label: 'O3 World', href: 'https://www.o3world.com/' },
      { label: '1682', href: 'https://www.1682conference.com/' },
    ])
    expect(chrome.legalLinks).toEqual([
      { label: 'Privacy policy', href: 'https://www.o3world.com/privacy-policy/' },
    ])
  })

  /**
   * The closing ask is part of Framer's footer component, not of any page —
   * the same three lines sit above the copyright on every page but Contact.
   * It is read here once so the mapper can put it where the shared model keeps
   * a closing ask, which is a band on the page.
   */
  it('reads the closing ask the footer carries on every page', () => {
    expect(chrome.cta).toEqual({
      heading: 'Stop guessing, start discovering',
      body: 'Identify the AI use cases that matter most.',
      button: { label: 'Get started: Schedule a consultation', href: '/contact' },
    })
  })

  it('names the brand the chrome belongs to', () => {
    expect(chrome.title).toBe('O3XO')
  })
})

describe('pagePathsInSitemap', () => {
  // The sitemap is the inventory of what has to keep resolving. Collection
  // members are other tickets' work; what is left is the page space.
  it('lists the non-collection paths, the homepage as "index"', () => {
    const xml = `<urlset>
      <url><loc>https://www.o3xo.ai/</loc></url>
      <url><loc>https://www.o3xo.ai/insights</loc></url>
      <url><loc>https://www.o3xo.ai/industries/construction/</loc></url>
      <url><loc>https://www.o3xo.ai/about/approach/</loc></url>
      <url><loc>https://www.o3xo.ai/case-studies/</loc></url>
      <url><loc>https://www.o3xo.ai/case-studies/tyndale</loc></url>
      <url><loc>https://www.o3xo.ai/insights/some-article</loc></url>
    </urlset>`
    expect(pagePathsInSitemap(xml)).toEqual(['index', 'industries/construction', 'about/approach'])
  })
})
