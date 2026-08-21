import { describe, expect, it } from 'vitest'

import { caseStudyDoc } from './caseStudy'

/**
 * The one arm of the `story` gate that can fail open (ADR 0018).
 *
 * `story` takes everything `page.sections` takes, and restating that list
 * here would be the second copy `sectionBlockMembers` exists to prevent — so
 * a block this file does not model passes on shape alone. The risk that
 * creates is a *modelled* block with a broken shape falling through to the
 * permissive arm and loading malformed, which is what these check.
 */

const doc = (story: unknown[]) => ({
  _id: 'caseStudy-wp-1',
  _type: 'caseStudy',
  title: 'A case study',
  slug: { _type: 'slug', current: 'a-case-study' },
  client: { _type: 'reference', _ref: 'client-seed-a' },
  narrativeHeadline: 'The problem, in one sentence.',
  story,
  migration: { locked: false, sourceId: 'wp:work:1' },
})

const figure = {
  _type: 'figure',
  image: { _type: 'image', _wpSrc: 'https://example.com/a.jpg' },
  alt: 'A screenshot',
}

const chapter = {
  _type: 'chapter',
  _key: 'chapter-0',
  kicker: 'Opportunity',
  title: 'The starting line',
  body: [{ _type: 'block', _key: 'k0000' }],
}

const accepts = (story: unknown[]) => caseStudyDoc.safeParse(doc(story)).success

describe('the story gate', () => {
  it('takes chapters and bands in one array', () => {
    expect(
      accepts([
        {
          ...chapter,
          details: [{ _type: 'detail', _key: 'd0', label: 'Strategy', body: 'A plan' }],
        },
        { _type: 'mediaSection', _key: 'm0', surface: 'white', variant: 'capture', media: figure },
        {
          _type: 'screenGridSection',
          _key: 's0',
          surface: 'white',
          screens: [{ _type: 'screen', _key: 'sc0', media: figure, tone: 'ink', span: 'wide' }],
        },
      ]),
    ).toBe(true)
  })

  // A block the pipeline does not write — registered, composable, unmodelled.
  it('takes a section block it does not model', () => {
    expect(
      accepts([{ _type: 'quoteSection', _key: 'q0', quote: 'x', decoration: 'molecule' }]),
    ).toBe(true)
  })

  it('refuses a modelled block that does not match its own shape', () => {
    expect(accepts([{ _type: 'mediaSection', _key: 'm0', surface: 'white' }])).toBe(false)
    expect(accepts([{ _type: 'screenGridSection', _key: 's0', screens: [] }])).toBe(false)
    expect(
      accepts([
        {
          _type: 'screenGridSection',
          _key: 's0',
          screens: [{ _type: 'screen', _key: 'sc0', media: figure, span: 'enormous' }],
        },
      ]),
    ).toBe(false)
  })

  it('refuses a detail row with no label', () => {
    expect(
      accepts([{ ...chapter, details: [{ _type: 'detail', _key: 'd0', body: 'A plan' }] }]),
    ).toBe(false)
  })
})

/**
 * A case study's own stricter reading of the shared `migration` fragment. The
 * translate track writes these, so the gate is what stops an agent's document
 * arriving already locked — a lock is an editor's to set — or claiming a
 * source that is not a WordPress work item.
 */
describe('the migration gate', () => {
  const withMigration = (migration: unknown) =>
    caseStudyDoc.safeParse({ ...doc([chapter]), migration }).success

  it('takes a wp:work source, unlocked', () => {
    expect(withMigration({ locked: false, sourceId: 'wp:work:12' })).toBe(true)
  })

  it('refuses a document that arrives locked', () => {
    expect(withMigration({ locked: true, sourceId: 'wp:work:12' })).toBe(false)
  })

  it('refuses a source that is not a work item', () => {
    expect(withMigration({ locked: false, sourceId: 'wp:post:12' })).toBe(false)
    expect(withMigration({ locked: false, sourceId: 'wp:work:' })).toBe(false)
  })

  it('refuses a document with no migration object at all', () => {
    expect(withMigration(undefined)).toBe(false)
  })
})
