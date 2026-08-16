import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CORPUS_DIRS, isInternalType, isPipelineOwned } from './lib/corpus'

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

  /**
   * The ownership contract `load` retires against. A drift here silently
   * turns retirement off (nothing deleted) or on for documents the pipeline
   * does not own — both are dataset damage, so the boundary is pinned.
   */
  it('recognizes pipeline-owned ids and nothing else', () => {
    expect(isPipelineOwned('caseStudy-wp-10028')).toBe(true)
    expect(isPipelineOwned('page-seed-contact')).toBe(true)
    expect(isPipelineOwned('drafts.insight-wp-123')).toBe(true)
    expect(isPipelineOwned('siteSettings')).toBe(false)
    expect(isPipelineOwned('64cd37cf-1a2b-4c3d-8e9f-000000000000')).toBe(false)
    expect(isPipelineOwned('drafts.64cd37cf-1a2b-4c3d-8e9f-000000000000')).toBe(false)
  })

  /**
   * The other half of the same contract, for the two types a different tool
   * owns (ADR 0027, ADR 0024). Internal types are excluded by name rather
   * than by id shape: a corpus key is any kebab string, so `brief-wp-notes`
   * is a legal brief id that the bare `<type>-(wp|seed)-` pattern would
   * claim — and a claimed id is one `load` may retire.
   */
  it('leaves guidance and brief ids outside the ownership contract', () => {
    expect(isPipelineOwned('guidance-o3-voice')).toBe(false)
    expect(isPipelineOwned('brief-sanity-partner-page')).toBe(false)
    expect(isPipelineOwned('drafts.brief-sanity-partner-page')).toBe(false)
    expect(isPipelineOwned('brief-wp-migration-notes')).toBe(false)
    expect(isPipelineOwned('brief-seed-notes')).toBe(false)
    expect(isPipelineOwned('guidance-wp-era-style')).toBe(false)
  })

  /**
   * `verify` reads the whole dataset, so a document this pipeline never wrote
   * would be reported as an orphan — a finding that exits non-zero and is
   * wrong. Guidance and briefs are exactly that: written by `guidance:sync`
   * and `brief:sync`, and outliving the pipeline, which is deleted
   * post-migration.
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
   * committed under `data/` would be written by `load` and then retired by the
   * next sync, with the two tools overwriting each other every run.
   */
  it('commits no document of a type a different tool owns', () => {
    const offenders: string[] = []
    for (const root of CORPUS_DIRS) {
      if (!existsSync(root)) continue
      for (const type of readdirSync(root)) {
        if (isInternalType(type)) offenders.push(`${root}/${type}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
