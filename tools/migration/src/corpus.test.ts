import { describe, expect, it } from 'vitest'

import { corpusPath, corpusTypeDirs, isInternalType, readCorpus } from './core/read'

/**
 * Invariants over the whole committed corpus — converted, seed and translated
 * together — that no single track's test file owns.
 */
describe('the committed corpus', () => {
  /**
   * The corpus half of #24's robots parity. `noIndex` and `noFollow` only
   * migrate when Yoast resolved them `true` (`map/seo.ts`), and on this site
   * exactly one document is noindexed — `error404`, a WordPress page that
   * does not migrate. So the honest parity claim is "nothing migrated is
   * noindexed", and it is worth asserting rather than assuming: a stray
   * `noIndex: true` in a committed document would silently delist a page and
   * nothing else would notice. The render half — that a served page actually
   * emits index/follow — is `seoParity.render.test.tsx` in `@o3/web`.
   */
  it('carries no noIndex or noFollow anywhere', () => {
    const offenders = readCorpus<{ seo?: { noIndex?: boolean; noFollow?: boolean } }>()
      .filter(({ document }) => document.seo?.noIndex || document.seo?.noFollow)
      .map(corpusPath)
    expect(offenders).toEqual([])
  })

  /**
   * `verify` reads the whole dataset, so a document this pipeline never wrote
   * would be reported as an orphan — a finding that exits non-zero and is
   * wrong. Briefs are exactly that: written by `brief:sync`, and outliving the
   * pipeline, which is deleted post-migration. `guidance` is named alongside
   * them because `production` still holds documents of a retired type (#192).
   */
  it('names the types a different tool owns, so verify can stay quiet about them', () => {
    expect(isInternalType('guidance')).toBe(true)
    expect(isInternalType('brief')).toBe(true)
    expect(isInternalType('page')).toBe(false)
    expect(isInternalType('insight')).toBe(false)
    expect(isInternalType('siteSettings')).toBe(false)
  })

  /**
   * And the corpus is the other side of it: a `brief` or `guidance` document
   * committed under `data/` would give that document a second writer —
   * `sync-docs` could replace what `brief:sync` wrote, and `verify` would
   * expect the corpus copy.
   */
  it('commits no document of a type a different tool owns', () => {
    // Directories, not documents: a `brief/` holding nothing but markdown
    // yields no corpus entries, and it is still the other tool's territory.
    const offenders = corpusTypeDirs()
      .filter(({ type }) => isInternalType(type))
      .map(({ tree, type }) => `${tree}/${type}`)
    expect(offenders).toEqual([])
  })
})
