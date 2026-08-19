import { describe, expect, it } from 'vitest'

import { buttonDestination, resolveButtonHref } from './buttonDestination'

/**
 * The four arms, and the element that follows from each.
 *
 * This is the whole of the decision `ButtonLink` makes: a destination is a
 * link, no destination is a control. It is the highest seam available —
 * `ButtonLink`, the nav, the footer and the utility strip all read this one
 * function — so a case here covers every placement at once, and the stories
 * are left to answer what the element then looks like.
 */
describe('which arm a button is on', () => {
  it('is none when nothing is filled in — the submit button’s answer', () => {
    expect(buttonDestination({ label: 'Send message' })).toEqual({ kind: 'none' })
  })

  it('is none when the fields are present but empty', () => {
    expect(buttonDestination({ href: '', anchor: '   ', target: null })).toEqual({ kind: 'none' })
  })

  it('is internal when a reference is set, and the URL comes from the document', () => {
    expect(
      buttonDestination({ target: { _type: 'caseStudy', title: 'Caron', slug: 'caron' } }),
    ).toEqual({ kind: 'internal', href: '/work/caron' })
  })

  it('is external when a URL is set', () => {
    expect(buttonDestination({ href: 'https://www.o3xo.ai/' })).toEqual({
      kind: 'external',
      href: 'https://www.o3xo.ai/',
      offsite: true,
    })
  })

  it('is anchor when an anchor is set, and adds the # the editor does not type', () => {
    expect(buttonDestination({ anchor: 'how-we-work' })).toEqual({
      kind: 'anchor',
      href: '#how-we-work',
    })
  })
})

/**
 * A document can hold more than one arm — the form only ever hides the loser,
 * and a document written before a field existed was never gated at all. The
 * winner is the arm the form still shows, so clearing it brings the next one
 * back rather than stranding the editor with two hidden fields.
 */
describe('a document carrying more than one arm', () => {
  it('lets the reference win over a URL', () => {
    expect(
      buttonDestination({
        href: '/ignored',
        target: { _type: 'page', title: 'Contact', slug: 'contact' },
      }),
    ).toEqual({ kind: 'internal', href: '/contact' })
  })

  it('lets a URL win over an anchor', () => {
    expect(buttonDestination({ href: '/contact', anchor: 'ignored' })).toEqual({
      kind: 'external',
      href: '/contact',
      offsite: false,
    })
  })
})

/**
 * `offsite` is what earns a new tab, and it is narrower than "the external
 * arm". Half the seeded buttons point at `/contact` through `href`, which is
 * this site.
 */
describe('whether a URL leaves the site', () => {
  it.each([
    ['https://www.1682conference.com/', true],
    ['http://example.com', true],
    ['//cdn.example.com/file.pdf', true],
    ['/contact', false],
    ['mailto:hello@o3world.com', false],
  ])('%s → offsite %s', (href, offsite) => {
    expect(buttonDestination({ href })).toEqual({ kind: 'external', href, offsite })
  })
})

/**
 * Draft mode encodes invisible stega characters into every string from Sanity
 * so Presentation can map a rendered word back to the field that wrote it. An
 * href carrying them is not a URL, so they come off here — once, in the one
 * place that reads the union.
 */
describe('stega', () => {
  // The zero-width run Sanity appends, spelled in escapes: an editor's value
  // reaches the renderer looking exactly like this in draft mode.
  const encoded = (value: string) => `${value}\u200B\u2060\u2060\u200B`

  it('cleans the URL an editor sees in draft mode', () => {
    expect(buttonDestination({ href: encoded('https://www.o3xo.ai/') })).toEqual({
      kind: 'external',
      href: 'https://www.o3xo.ai/',
      offsite: true,
    })
  })

  it('cleans a slug on the way into the internal URL', () => {
    expect(
      buttonDestination({ target: { _type: 'insight', title: 'A post', slug: encoded('a-post') } }),
    ).toEqual({ kind: 'internal', href: '/insights/a-post' })
  })
})

describe('resolveButtonHref', () => {
  it('gives the chrome’s plain links an href for every arm', () => {
    expect(resolveButtonHref({ href: 'https://o3world.com' })).toBe('https://o3world.com')
    expect(resolveButtonHref({ anchor: 'top' })).toBe('#top')
    expect(resolveButtonHref({ target: { _type: 'page', slug: 'index' } })).toBe('/')
  })

  it('falls back to / for a button with nowhere to send anyone', () => {
    expect(resolveButtonHref({ label: 'Send message' })).toBe('/')
  })
})
