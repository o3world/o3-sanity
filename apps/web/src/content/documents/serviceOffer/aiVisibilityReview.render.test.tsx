import { describe, expect, it } from 'vitest'

import { buildSingletonRoute } from '@o3/content-runtime/routes'
import { expectNotFound, renderRoute, siteSettings, withSettings } from '@/test'

import { aiVisibilityReview } from './entry'
import { aSeededServiceOffer } from './seedFixture'

const route = buildSingletonRoute(aiVisibilityReview)

function render(doc: unknown = aSeededServiceOffer()) {
  return renderRoute(route, { data: withSettings(doc, siteSettings({ title: 'O3 World' })) })
}

function jsonLdOf(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1]!) as Record<string, unknown>,
  )
}

/** Every `<a>` whose text includes `label`, as its opening tag. */
function linksLabelled(html: string, label: string): string[] {
  return [...html.matchAll(/<a\b([^>]*)>((?:(?!<\/a>)[\s\S])*)<\/a>/g)]
    .filter((match) => match[2]!.replace(/<[^>]+>/g, '').includes(label))
    .map((match) => match[1]!)
}

describe('the AI Visibility Review landing page', async () => {
  const { html, metadata, calls } = await render()

  it('reads the offer by the slug of its own route, tagged so a publish reaches it', () => {
    const read = calls.find((call) => (call.params as { slug?: string }).slug)
    expect(read?.params).toEqual({ slug: 'ai-visibility-review' })
    expect(read?.tags).toEqual(
      expect.arrayContaining(['sanity:serviceOffer', 'sanity:serviceOffer:ai-visibility-review']),
    )
  })

  it('draws every package from the document, the featured one with its label', () => {
    for (const text of ['AI Visibility Check', '$2,500', '$6,500', '$11,000', 'Most popular']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('Everything in the Check, plus:')
    expect(html).toContain('A 90-day roadmap')
  })

  it('numbers the packages by their order', () => {
    expect(html).toMatch(/Package 1[\s\S]*Package 2[\s\S]*Package 3/)
  })

  it('draws the add-ons and the FAQ, the first question open', () => {
    expect(html).toContain('5-hour blocks · $1,000')
    expect(html).toMatch(
      /<details[^>]*open=""[^>]*>\s*<summary[^>]*>What is an AI Visibility Review\?/,
    )
    expect(html.match(/<details/g)).toHaveLength(8)
    expect(html).toContain('<strong>Business Hub:</strong>')
  })

  it('sends every booking button to the contact band when no booking URL is set', () => {
    const booking = [
      ...linksLabelled(html, 'Let’s talk'),
      ...linksLabelled(html, 'Book a free 20-minute call'),
      ...linksLabelled(html, 'Get the Review'),
    ]
    expect(booking.length).toBeGreaterThanOrEqual(5)
    for (const tag of booking) expect(tag).toContain('href="#contact"')
  })

  it('marks each booking button with the conversion event GTM listens for', () => {
    for (const tag of linksLabelled(html, 'Book a free 20-minute call')) {
      expect(tag).toContain('data-event="book_call_click"')
    }
    for (const tag of linksLabelled(html, 'Let’s talk')) {
      expect(tag).toContain('data-event="book_call_click"')
    }
    const checks = linksLabelled(html, 'Start with a Check')
    expect(checks).toHaveLength(2)
    const tracked = checks.filter((tag) => tag.includes('data-event='))
    expect(tracked).toHaveLength(1)
    expect(tracked[0]).toContain('data-event="start_check_click"')
  })

  it('names the package on every package button’s event, the entry tier as start_check_click', () => {
    const [check] = linksLabelled(html, 'Start with a Check').filter((tag) =>
      tag.includes('data-package='),
    )
    expect(check).toContain('data-event="start_check_click"')
    expect(check).toContain('data-package="AI Visibility Check"')
    for (const [label, heading] of [
      ['Get the Review', 'AI Visibility Review'],
      ['Get the Boost', 'AI Visibility Boost'],
    ]) {
      const [tag] = linksLabelled(html, label!)
      expect(tag).toContain('data-event="book_call_click"')
      expect(tag).toContain(`data-package="${heading}"`)
    }
  })

  it('anchors the sections the nav links to', () => {
    for (const id of ['review', 'packages', 'how', 'faq', 'contact']) {
      expect(html).toContain(`id="${id}"`)
      expect(html).toContain(`href="#${id}"`)
    }
  })

  it('takes its title and description from the offer’s SEO, canonical at its own URL', () => {
    expect(metadata.title).toBe('AI Visibility Review: See How Your Brand Shows Up in ChatGPT')
    expect(metadata.description).toBe(
      'Find out how ChatGPT, Gemini and Perplexity describe your business, and get a clear plan to improve it. Packages from $2,500.',
    )
    expect(String(metadata.alternates?.canonical)).toMatch(/\/ai-visibility-review$/)
  })

  it('declares the service with each package as a USD offer', () => {
    const [node] = jsonLdOf(html).filter((n) => n['@type'] === 'Service')
    expect(node).toMatchObject({ name: 'AI Visibility Review' })
    expect(node?.url).toMatch(/\/ai-visibility-review$/)
    expect(node?.offers).toEqual([
      expect.objectContaining({ name: 'AI Visibility Check', price: 2500, priceCurrency: 'USD' }),
      expect.objectContaining({ name: 'AI Visibility Review', price: 6500, priceCurrency: 'USD' }),
      expect.objectContaining({ name: 'AI Visibility Boost', price: 11000, priceCurrency: 'USD' }),
    ])
  })

  it('declares the FAQ with plain-text answers, and O3 World as the organization', () => {
    const [faq] = jsonLdOf(html).filter((n) => n['@type'] === 'FAQPage')
    const questions = faq?.mainEntity as { name: string; acceptedAnswer: { text: string } }[]
    expect(questions).toHaveLength(8)
    expect(questions[4]!.acceptedAnswer.text).toMatch(/^Business Hub: A central place/)
    expect(jsonLdOf(html).filter((n) => n['@type'] === 'Organization')).toHaveLength(1)
  })
})

describe('a booking URL on the offer', () => {
  it('sends every booking and package button there instead', async () => {
    const bookingUrl = 'https://calendly.com/o3world/ai-visibility'
    const { html } = await render(aSeededServiceOffer({ bookingUrl }))
    for (const label of ['Let’s talk', 'Book a free 20-minute call', 'Start with a Check']) {
      for (const tag of linksLabelled(html, label)) {
        if (label === 'Start with a Check' && tag.includes('#packages')) continue
        expect(tag, label).toContain(`href="${bookingUrl}"`)
      }
    }
  })
})

describe('no offer in the dataset', () => {
  it('404s', async () => {
    await expectNotFound(route, { data: withSettings(null) })
  })
})
