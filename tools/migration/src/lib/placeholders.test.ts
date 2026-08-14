import { BLOCK_KNOBS } from '@o3/sanity/knobs'
import { describe, expect, it } from 'vitest'

import { untouchedPlaceholders } from './placeholders'

/**
 * WHAT `verify` REPORTS AS AN UNWRITTEN PLACEHOLDER (#112).
 *
 * The fixtures are built from the real declarations rather than from literals,
 * because the whole mechanism is "does this still look like the thing we
 * shipped" — a hand-copied placeholder in a test would keep passing after the
 * declaration moved, which is the one failure this report cannot afford.
 */

const hero = BLOCK_KNOBS.heroSection!.placeholder!
const quote = BLOCK_KNOBS.quoteSection!.placeholder!

const page = (sections: unknown[]) => ({ _id: 'page-seed-home', _type: 'page', sections })

describe('untouchedPlaceholders', () => {
  it('reports a section nobody came back to, with its path', () => {
    expect(untouchedPlaceholders([page([{ _key: 'a', ...hero }])])).toEqual([
      'page-seed-home — heroSection at sections[0]',
    ])
  })

  it('says nothing once the copy has been written', () => {
    const written = { ...hero, headlineLines: ['We build what the strategy implies.'] }
    expect(untouchedPlaceholders([page([{ _key: 'a', ...written }])])).toEqual([])
  })

  // Subset match: the fields a placeholder could not supply are exactly the
  // ones an editor fills in first, and filling one in has not written the copy.
  it('still reports one whose surface was picked from the canvas', () => {
    expect(untouchedPlaceholders([page([{ _key: 'a', ...hero, surface: 'bone' }])])).toHaveLength(1)
  })

  it('reports each unwritten section once, at its own index', () => {
    expect(
      untouchedPlaceholders([
        page([
          { _key: 'a', ...hero },
          { _key: 'b', ...quote },
        ]),
      ]),
    ).toEqual([
      'page-seed-home — heroSection at sections[0]',
      'page-seed-home — quoteSection at sections[1]',
    ])
  })

  it('says nothing about a document with no blocks in it', () => {
    expect(
      untouchedPlaceholders([{ _id: 'person-wp-1', _type: 'person', name: 'A person' }]),
    ).toEqual([])
  })
})
