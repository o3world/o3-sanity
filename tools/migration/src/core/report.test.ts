import { describe, expect, it } from 'vitest'

import { BLOCK_KNOBS } from '@o3/sanity/knobs'

import { report } from './report'

/** A committed document, with only the fields the checks have opinions about. */
function doc(id: string, type = 'page', fields: Record<string, unknown> = {}) {
  return {
    _id: id,
    _type: type,
    migration: { locked: false, sourceId: `wp:page:${id}` },
    ...fields,
  }
}

function checkLines(result: ReturnType<typeof report>, check: string): readonly string[] {
  const found = result.checks.find((c) => c.check === check)
  if (!found) throw new Error(`no check named "${check}"`)
  return found.lines
}

describe('the checks', () => {
  // The verify adapter prints the counts table under the first check, by
  // position — so the order the checks come back in is part of the interface.
  it('come back in the order verify prints them', () => {
    expect(report([], [], []).checks.map((c) => c.check)).toEqual([
      'every committed document is in the dataset',
      'every reference resolves',
      'every image field holds an image asset',
      'every image resolved to an asset',
      'every document validates against its schema gate',
      'every document type is in the schema',
      'no two documents claim the same slug',
      'every document is committed under data/',
    ])
  })
})

describe('every committed document is in the dataset', () => {
  it('names a committed document the dataset does not hold', () => {
    const result = report([doc('page-wp-1')], [], [])

    expect(checkLines(result, 'every committed document is in the dataset')).toEqual([
      'page-wp-1 not loaded',
    ])
  })

  it('counts documents per type, committed and live', () => {
    const result = report(
      [doc('page-wp-1'), doc('insight-wp-1', 'insight')],
      [doc('page-wp-1')],
      [],
    )

    expect(result.counts).toEqual([
      ['insight', { committed: 1, live: 0 }],
      ['page', { committed: 1, live: 1 }],
    ])
  })
})

describe('every reference resolves', () => {
  it('names a reference to a document the dataset does not hold', () => {
    const holder = doc('page-wp-1', 'page', {
      related: { _type: 'reference', _ref: 'insight-wp-9' },
    })
    const result = report([], [holder], [])

    expect(checkLines(result, 'every reference resolves')).toEqual(['page-wp-1 → insight-wp-9'])
  })

  it('accepts asset and brief references without resolving them', () => {
    const holder = doc('page-wp-1', 'page', {
      image: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc123-100x100-jpg' } },
      briefs: [{ _type: 'reference', _ref: 'brief-agent-tooling', _weak: true }],
    })
    const result = report([], [holder], [])

    expect(checkLines(result, 'every reference resolves')).toEqual([])
  })
})

describe('every image field holds an image asset', () => {
  it('names an image field holding a file asset, with the path that reached it', () => {
    const holder = doc('page-wp-1', 'page', {
      hero: { _type: 'image', asset: { _type: 'reference', _ref: 'file-abc123-pdf' } },
    })
    const result = report([], [holder], [])

    expect(checkLines(result, 'every image field holds an image asset')).toEqual([
      'page-wp-1 → hero = file-abc123-pdf',
    ])
  })
})

describe('every image resolved to an asset', () => {
  it('names a document still carrying a _wpSrc marker', () => {
    const holder = doc('page-wp-1', 'page', {
      hero: { _type: 'image', _wpSrc: 'https://old.example/img.jpg' },
    })
    const result = report([], [holder], [])

    expect(checkLines(result, 'every image resolved to an asset')).toEqual([
      'page-wp-1 still carries an unresolved image marker',
    ])
  })
})

describe('every document validates against its schema gate', () => {
  it('names a gated document that fails its gate', () => {
    const result = report([], [doc('insight-wp-1', 'insight')], [])

    expect(checkLines(result, 'every document validates against its schema gate')).toEqual([
      'insight-wp-1 fails the insight gate',
    ])
  })

  it('checks an ungated type structurally only', () => {
    const result = report([], [doc('client-seed-acme', 'client')], [])

    expect(checkLines(result, 'every document validates against its schema gate')).toEqual([])
  })
})

describe('every document type is in the schema', () => {
  it('names a document whose type the Studio schema does not define', () => {
    const result = report([], [doc('guidance-old-1', 'bogusType')], [])

    expect(checkLines(result, 'every document type is in the schema')).toEqual([
      'guidance-old-1 has unknown _type "bogusType"',
    ])
  })
})

describe('no two documents claim the same slug', () => {
  it('names two documents claiming one slug', () => {
    const a = doc('page-wp-1', 'page', { slug: { current: 'about' } })
    const b = doc('page-seed-about', 'page', { slug: { current: 'about' } })
    const result = report([], [a, b], [])

    expect(checkLines(result, 'no two documents claim the same slug')).toEqual([
      'page:about → page-wp-1, page-seed-about',
    ])
  })
})

describe('every document is committed under data/', () => {
  it('reports a plain orphan exactly as before, routable suffix and all', () => {
    const result = report([], [doc('page-old-home', 'page')], [])

    expect(checkLines(result, 'every document is committed under data/')).toEqual([
      'page-old-home (page) — routable, so it can shadow a seed',
    ])
  })

  it('reports a locked orphan as skipped, not as a document to investigate', () => {
    const result = report(
      [],
      [doc('page-old-home', 'page')],
      [{ _id: 'page-old-home', locked: true }],
    )

    expect(checkLines(result, 'every document is committed under data/')).toEqual([
      'page-old-home (page) — skipped: locked',
    ])
  })

  it('reads a lock sitting on the draft copy as locking the pair', () => {
    const result = report(
      [],
      [doc('page-old-home', 'page')],
      [{ _id: 'drafts.page-old-home', locked: true }],
    )

    expect(checkLines(result, 'every document is committed under data/')).toEqual([
      'page-old-home (page) — skipped: locked',
    ])
  })

  it('never counts an internal type as an orphan', () => {
    const result = report([], [doc('brief-agent-tooling', 'brief')], [])

    expect(checkLines(result, 'every document is committed under data/')).toEqual([])
  })
})

describe('warnings, not findings', () => {
  it('reports a provisional document with its note, outside the checks', () => {
    const provisional = doc('page-seed-live', 'page', {
      migration: { locked: false, provisional: true, provisionalNote: 'placeholder dates' },
    })
    const result = report([provisional], [provisional], [])

    expect(result.provisional).toEqual(['page-seed-live — placeholder dates'])
    expect(result.checks.flatMap((c) => c.lines)).toEqual([])
  })

  it('reports an untouched canvas placeholder, outside the checks', () => {
    const [type, spec] = Object.entries(BLOCK_KNOBS).find(([, s]) => s.placeholder) ?? []
    if (!type || !spec?.placeholder) throw new Error('no block declares a placeholder')
    const holder = doc('page-seed-index', 'page', {
      sections: [{ ...spec.placeholder, _type: type, _key: 'a' }],
    })
    const result = report([holder], [holder], [])

    expect(result.placeholders).toEqual([`page-seed-index — ${type} at sections[0]`])
    expect(result.checks.flatMap((c) => c.lines)).toEqual([])
  })
})
