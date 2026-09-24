import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CONVERTED_DIR, EXTRACT_DIR, REPO_ROOT, SEED_DIR, TRANSLATED_DIR } from './paths'

/**
 * Committed seeds name their imagery by repo-relative path
 * (`_localSrc: "tools/migration/data/seed/assets/…"`), and `data/assets.json`
 * is keyed by those paths. The corpus root has to be exactly the directory
 * those strings name, or every seed image resolves to nothing.
 */
describe('the corpus tree', () => {
  const DATA = join(REPO_ROOT, 'tools', 'migration', 'data')

  it('keeps every tree under tools/migration/data', () => {
    for (const tree of [EXTRACT_DIR, CONVERTED_DIR, TRANSLATED_DIR, SEED_DIR]) {
      expect(dirname(tree)).toBe(DATA)
    }
  })
})
