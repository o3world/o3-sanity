import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CORPUS_DIRS } from './lib/corpus'

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
    const offenders: string[] = []
    for (const root of CORPUS_DIRS) {
      if (!existsSync(root)) continue
      for (const type of readdirSync(root)) {
        for (const file of readdirSync(join(root, type)).filter((f) => f.endsWith('.json'))) {
          const doc = JSON.parse(readFileSync(join(root, type, file), 'utf8')) as {
            seo?: { noIndex?: boolean; noFollow?: boolean }
          }
          if (doc.seo?.noIndex || doc.seo?.noFollow) offenders.push(`${root}/${type}/${file}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
