import { afterEach } from 'vitest'

import { __setDraftMode } from './stubs/next-headers'
import { resetDataset } from './stubs/sanity-live'

/**
 * Leak guard for the `render` layer: a test that forgets to install its own
 * dataset should fail loudly on the stub's "no dataset installed" error
 * rather than quietly inheriting the previous test's documents.
 */
afterEach(() => {
  resetDataset()
  __setDraftMode(false)
})
