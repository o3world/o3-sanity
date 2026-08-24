import { describe, expect, it } from 'vitest'

import { caseStudySlugsInSitemap, parseCaseStudy, parseCaseStudyIndex } from './framer'

/**
 * The case-study half of the O3XO source. Same discipline as `framer.test.ts`:
 * the fixtures are the shapes o3xo.ai actually serves, cut down to the regions
 * the parse depends on.
 */

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://www.o3xo.ai/case-studies/</loc></url>
  <url><loc>https://www.o3xo.ai/insights/some-article</loc></url>
  <url><loc>https://www.o3xo.ai/case-studies/redirect-output</loc></url>
  <url><loc>https://www.o3xo.ai/case-studies/redirect-input</loc></url>
  <url><loc>https://www.o3xo.ai/case-studies/buffalo-construction</loc></url>
  <url><loc>https://www.o3xo.ai/case-studies/tyndale</loc></url>
</urlset>`

describe('caseStudySlugsInSitemap', () => {
  it('lists the case studies, not the index and not the insights', () => {
    expect(caseStudySlugsInSitemap(SITEMAP)).toEqual(['buffalo-construction', 'tyndale'])
  })
})

/**
 * The collection index, which is a second region of the same CMS item rather
 * than a listing derived from the detail page: the client's name, the subject
 * label, the card sentence and the headline stat appear here and nowhere else
 * on the site. Framer renders the same card once per breakpoint variant and
 * the collection holds a duplicate item for one slug, so a card list is
 * deduplicated by slug before anything counts it.
 */
const INDEX = `<!DOCTYPE html><html><body>
<a href="./buffalo-construction">
  <div data-framer-component-type="RichTextContainer"><p>Buffalo Construction</p></div>
  <div data-framer-component-type="RichTextContainer"><h3>AI-powered construction operations</h3></div>
  <div data-framer-component-type="RichTextContainer"><p>From “where do we start?” to AI across the project lifecycle</p></div>
  <div data-framer-component-type="RichTextContainer"><p>2X</p></div>
  <div data-framer-component-type="RichTextContainer"><p>Revenue capacity from 3 AI solutions</p></div>
  <img src="https://framerusercontent.com/images/card1.webp?scale-down-to=512" alt="A construction team">
</a>
<a href="./healthcare-tech-leader">
  <div data-framer-component-type="RichTextContainer"><p>Healthcare tech leader</p></div>
  <div data-framer-component-type="RichTextContainer"><h3>AI strategy acceleration</h3></div>
  <div data-framer-component-type="RichTextContainer"><p>See how we identified dozens of use cases</p></div>
  <div data-framer-component-type="RichTextContainer"><p>&lt;3 weeks</p></div>
  <div data-framer-component-type="RichTextContainer"><p>From strategy to prioritized AI roadmap</p></div>
  <img src="https://framerusercontent.com/images/card2.webp" alt="A healthcare professional">
</a>
<a href="./healthcare-tech-leader">
  <div data-framer-component-type="RichTextContainer"><p>Healthcare tech leader</p></div>
  <div data-framer-component-type="RichTextContainer"><h3>AI strategy acceleration</h3></div>
  <div data-framer-component-type="RichTextContainer"><p>See how we identified dozens of use cases</p></div>
  <div data-framer-component-type="RichTextContainer"><p>&lt;3 weeks</p></div>
  <div data-framer-component-type="RichTextContainer"><p>From strategy to prioritized AI roadmap</p></div>
  <img src="https://framerusercontent.com/images/card2.webp" alt="A healthcare professional">
</a>
<a href="../contact/">Contact</a>
</body></html>`

describe('parseCaseStudyIndex', () => {
  const cards = parseCaseStudyIndex(INDEX)

  it('reads the card fields the detail page never shows', () => {
    expect(cards[0]).toEqual({
      slug: 'buffalo-construction',
      client: 'Buffalo Construction',
      subject: 'AI-powered construction operations',
      headline: 'From “where do we start?” to AI across the project lifecycle',
      stat: { value: '2X', label: 'Revenue capacity from 3 AI solutions' },
      image: { url: 'https://framerusercontent.com/images/card1.webp', alt: 'A construction team' },
    })
  })

  /**
   * The collection publishes seven items at six URLs — two are the same
   * healthcare engagement, byte for byte. Framer serves one page for the pair,
   * so a second card would only ever produce a slug collision.
   */
  it('keeps one card per slug, however many the collection publishes', () => {
    expect(cards.map((card) => card.slug)).toEqual([
      'buffalo-construction',
      'healthcare-tech-leader',
    ])
  })
})

/**
 * A detail page. Four `Section` regions in authored order — hero, narrative,
 * results, quote — and the discriminators the parse actually uses: the
 * narrative section is the one with `Margin` children, the results section the
 * one with `Article` children, and the quote section the remaining one.
 *
 * The hero carries two images. The first is the section's own backdrop, the
 * same file on every case study; the second is this engagement's photograph,
 * which the head also names as the OG image.
 */
const PAGE = `<!DOCTYPE html><html><head>
<title>Buffalo Construction Case Study: AI-powered construction operations | O3XO</title>
<meta name="description" content="See how Buffalo Construction went from AI ambition to three working solutions.">
<meta property="og:image" content="https://framerusercontent.com/images/hero.webp?width=394&amp;height=250">
<link rel="canonical" href="https://www.o3xo.ai/case-studies/buffalo-construction">
</head><body>
<div data-framer-name="Main">
  <div data-framer-name="Section">
    <img src="https://framerusercontent.com/images/backdrop.png?width=1440" alt="">
    <div data-framer-component-type="RichTextContainer"><h1>From “where do we start?” to AI across the project lifecycle</h1></div>
    <div class="ssr-variant"><div data-framer-component-type="RichTextContainer"><h1>From “where do we start?” to AI across the project lifecycle</h1></div></div>
    <div data-framer-component-type="RichTextContainer"><p>Buffalo Construction had the ambition, but no clear path to AI adoption.</p></div>
    <div data-framer-name="Container"><img src="https://framerusercontent.com/images/hero.webp?scale-down-to=512" alt="Construction team reviewing blueprints"></div>
  </div>
  <div data-framer-name="Section">
    <div data-framer-name="Margin">
      <div data-framer-component-type="RichTextContainer"><p>Opportunity</p></div>
      <div data-framer-component-type="RichTextContainer"><h2>Strong ambition, no clear starting point</h2></div>
    </div>
    <div data-framer-name="Margin"><div>
      <div data-framer-component-type="RichTextContainer"><p class="framer-text">Buffalo has built a solid reputation.</p></div>
      <div data-framer-component-type="RichTextContainer"><p class="framer-text">Teams across estimating each saw opportunities.</p></div>
    </div></div>
    <div data-framer-name="Margin">
      <div data-framer-component-type="RichTextContainer"><p>Solution</p></div>
      <div data-framer-component-type="RichTextContainer"><h2>Three AI solutions on the systems Buffalo already uses</h2></div>
    </div>
    <div data-framer-name="Margin"><div>
      <div data-framer-component-type="RichTextContainer"><p class="framer-text">O3XO built three distinct AI tools.</p></div>
    </div></div>
  </div>
  <div data-framer-name="Section">
    <div data-framer-component-type="RichTextContainer"><p>Results</p></div>
    <div data-framer-name="Article">
      <div data-framer-component-type="RichTextContainer"><p>2X</p></div>
      <div data-framer-component-type="RichTextContainer"><p>Revenue capacity from 3 AI solutions</p></div>
    </div>
    <div data-framer-name="Article"></div>
  </div>
  <div data-framer-name="Section">
    <div data-framer-component-type="RichTextContainer"><p>In their words</p></div>
    <div data-framer-component-type="RichTextContainer"><p>“I was expecting the ROI next year, but we see it now.”</p></div>
    <div data-framer-component-type="RichTextContainer"><p>Brett Norton, President, Buffalo Construction, Inc</p></div>
  </div>
</div>
<div data-x="&quot;collectionItemId&quot;:&quot;Mn2pQr8Ls&quot;"></div>
</body></html>`

const CARD = parseCaseStudyIndex(INDEX)[0]!

describe('parseCaseStudy', () => {
  const study = parseCaseStudy(PAGE, 'buffalo-construction', CARD)

  it('takes the headline and the deck from the hero, not the browser title', () => {
    expect(study.title).toBe('From “where do we start?” to AI across the project lifecycle')
    expect(study.deck).toBe(
      'Buffalo Construction had the ambition, but no clear path to AI adoption.',
    )
    expect(study.titleRendered).toBe(
      'Buffalo Construction Case Study: AI-powered construction operations | O3XO',
    )
  })

  /**
   * Two images sit in the hero and only one belongs to this engagement. The
   * head names it: `og:image` is the item's own picture, and the backdrop is a
   * layer the template paints on every case study.
   */
  it('takes the engagement’s own photograph, at full size, with its alt text', () => {
    expect(study.heroImage).toEqual({
      url: 'https://framerusercontent.com/images/hero.webp',
      alt: 'Construction team reviewing blueprints',
    })
  })

  /** Eyebrow, heading, prose — the pair of `Margin` rows each chapter occupies. */
  it('reads the narrative as chapters, keeping their body verbatim', () => {
    expect(study.chapters).toEqual([
      {
        kicker: 'Opportunity',
        title: 'Strong ambition, no clear starting point',
        bodyHtml:
          '<p class="framer-text">Buffalo has built a solid reputation.</p>' +
          '<p class="framer-text">Teams across estimating each saw opportunities.</p>',
      },
      {
        kicker: 'Solution',
        title: 'Three AI solutions on the systems Buffalo already uses',
        bodyHtml: '<p class="framer-text">O3XO built three distinct AI tools.</p>',
      },
    ])
  })

  /** The results band ships with an empty second slot on most pages. */
  it('reads the results band as stats, skipping the empty slots', () => {
    expect(study.stats).toEqual([{ value: '2X', label: 'Revenue capacity from 3 AI solutions' }])
  })

  it('reads the quote band and who said it', () => {
    expect(study.quote).toEqual({
      text: '“I was expecting the ROI next year, but we see it now.”',
      attribution: 'Brett Norton, President, Buffalo Construction, Inc',
    })
  })

  it('carries the index card, which holds the client name the page never prints', () => {
    expect(study.card.client).toBe('Buffalo Construction')
  })

  it('traces the record to the Framer collection item and the path the site serves', () => {
    expect(study.collectionItemId).toBe('Mn2pQr8Ls')
    expect(study.path).toBe('/case-studies/buffalo-construction')
    expect(study.seo.canonicalRendered).toBe(
      'https://www.o3xo.ai/case-studies/buffalo-construction',
    )
  })

  /**
   * Fail-loud (ADR 0002). A page whose narrative region has moved would
   * otherwise convert into a case study with no story in it.
   */
  it('refuses a page whose narrative region it does not recognise', () => {
    const moved = PAGE.replace(/data-framer-name="Margin"/g, 'data-framer-name="Gutter"')
    expect(() => parseCaseStudy(moved, 'buffalo-construction', CARD)).toThrow(/narrative/i)
  })
})
